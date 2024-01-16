import { Octokit } from "@octokit/core";
import type { GraphQlQueryResponseData } from "@octokit/graphql";
import { isDryRun } from "./utils";

import { Milestone } from "@octokit/webhooks-types"
import {
  issueProjectV2Items,
  issueWithParents,
  setField
} from "./graphql_queries";
import {logger} from "./logger";

interface IssueData {
  repo: string;
  number: number;
}

export class Issue {
  node_id: string;
  title: string;
  body: string;
  closed: boolean;
  number: number;
  repo_full_name: string;
  repo_name: string;
  // [closed, label, IssueData]
  subtasks: Array<[boolean, string, IssueData | undefined]>;
  owner_login: string;
  milestone?: Milestone;
  belongsToConsole?: boolean;

  mentions: Array<Issue>;
  parents: Array<Issue>;

  consoleProjectNodeId?: string;
  engineeringProjectNodeId?: string;

  // {[projectId]: [nodeId]}
  connectedProjectItems: Record<string, string>

  constructor(node: any) {
    this.node_id = node.id;
    this.title = node.title;
    this.body = node.body;
    this.closed = node.closed;
    this.number = node.number;
    this.repo_full_name = node.repository.nameWithOwner;
    this.repo_name = node.repository.name;
    this.subtasks = [];
    this.mentions = [];
    this.parents = [];
    this.owner_login = node.repository.owner.login;
    this.milestone = node.milestone;
    this.belongsToConsole = !!(node.labels?.nodes || []).find((l: any) => (l.name === 'c/console/ui'));

    this.connectedProjectItems = {};


    // fill children
    this.setSubtasks();

    // fill mentions, if present
    if (node.hasOwnProperty('timelineItems')) {
      this.mentions = node
        .timelineItems
        .nodes
        // PR mention looks like `{ "id": "...", "source": {}}`, so check that source
        // has an id -- that way we will leave only mentioning Issue
        .filter((n: any) => n.hasOwnProperty('source') && n.source.hasOwnProperty('id'))
        .map((n: any) => new Issue(n.source));
    }

    this.setParents();
  }

  public static async load(kit: Octokit, issueNodeId: string) {
    let resp: GraphQlQueryResponseData = await kit.graphql(issueWithParents, {
      issue_id: issueNodeId,
    });
    logger("info", resp);
    if (!resp.node) {
      logger("info","failed to parse issue", resp)
      throw new Error("failed to parse issue");
    }
    let issue = new Issue(resp.node);
    await issue.loadConnectedProjectItems(kit);
    logger("info", "new ZenithIssue object: ", issue);
    return issue;
  }

  parseIssueData(title: string): IssueData | undefined {
    let repo = this.repo_name;
    let issue_number;

    // 1. #123 style references, when issues in the same repo
    const matchSameRepoIssue = title.match(/^#(\d+)$/);
    const matchOrgRepoIssue = (
      // 2. org/repo#123 style references
      title.match(new RegExp(`\^${this.owner_login}\/(.*)#(\\d+)$`)) ||
      // 3. org/repo/issues/123 style references
      title.match(new RegExp(`\^${this.owner_login}\/(.*)\/issues\/(\\d+)$`)) ||
      // 4. https://github.com/org/repo/issues/123 style references
      title.match(new RegExp(`\^https:\/\/github\.com\/${this.owner_login}\/(.*)\/issues\/(\\d+)$`))
    );


    if (matchSameRepoIssue) {
      issue_number = parseInt(matchSameRepoIssue[1]);
    } else if (matchOrgRepoIssue) {
      repo = matchOrgRepoIssue[1]
      issue_number = parseInt(matchOrgRepoIssue[2]);
    }

    if (!issue_number) {
      return
    }

    return {
      repo,
      number: issue_number,
    }
  }

  // subtasks are markdown list entries in the body
  private setSubtasks() {
    this.subtasks = Array
      // @ts-ignore
      .from(this.body.matchAll(/[-|*] \[([ x])\] ([^\n]*)/g))
      .map((m: any) => {
        let closed = m[1] === 'x';
        let title = m[2].trim();
        return [closed, title, this.parseIssueData(title)];
      });
  }

  // parent is a mentioning issue that has us as a subtask
  private setParents() {
    this.parents = this.mentions
      .filter((m: Issue) =>
        m.subtasks.some(([_closed, title]) =>
          // 1. #123 style references, when issues in the same repo
          (title == `#${this.number}` && m.repo_full_name === this.repo_full_name) ||
          // 2. org/repo#123 style references
          title == `${this.repo_full_name}#${this.number}` ||
          // 3. org/repo/issues/123 style references
          title == `${this.repo_full_name}/issues/${this.number}` ||
          // 4. https://github.com/org/repo/issues/123 style references
          title == `https://github.com/${this.repo_full_name}/issues/${this.number}`
        )
      )
  }

  async trackedIn(kit: Octokit, projectId: string) {
    for (const parent of this.parents) {
      await parent.loadConnectedProjectItems(kit);
    }

    return this.parents
      // only issues that are belong to the same project
      .filter((p: Issue) => (!!p.connectedProjectItems[projectId]))
      .map((p: Issue) =>
        `${p.title} (https://github.com/${p.repo_full_name}/issues/${p.number})`
      )
      .join(', ');
  }

  progress() {
    let n_total = this.subtasks.length;

    if (n_total === 0) {
      return '-';
    } else {
      let n_closed = this.subtasks.filter(([closed]) => closed).length;
      return `${n_closed} / ${n_total}`;
    }
  }

  private async loadConnectedProjectItems(kit: Octokit) {
    logger("info", "loading connections for issue,", this.node_id);
    // get info about connected project items
    const resp: GraphQlQueryResponseData = await kit.graphql(issueProjectV2Items, {
      id: this.node_id,
    });

    logger("info", 'loaded connections: ', resp);
    const {node} = resp;

    if (!node || !node.projectItems || !node.projectItems.nodes || !node.projectItems.nodes.length) {
      return;
    }

    for (const item of node.projectItems.nodes) {
      this.connectedProjectItems[item.project.id] = item.id;
    }
    logger("info", "done loading connections, result:", this.connectedProjectItems);
  }

  async setFieldValue(kit: Octokit, projectId: string, fieldId: string, value: any) {
    // logger("info", "start setFieldValue epic:", this.title)
    // logger("info", "start setFieldValue fieldId:", fieldId)
    // logger("info", "start setFieldValue value:", value)
    if (!this.connectedProjectItems[projectId]) {
      // issue doesn't not belong to this project
      logger("info", "skipping because does not belong to project", this.title)
      return;
    }

    if (!isDryRun()) {
      try {
        const resp = await kit.graphql(setField, {
          project_id: projectId,
          project_item_id: this.connectedProjectItems[projectId],
          tracked_field_id: fieldId,
          value,
        });
        logger("info", 'resp: ', resp)
      } catch(e) {
        logger("info", 'failed to update value for', this.title)
        logger("error", e)
      }
    }
    logger("info", "update value for finished", this.title)

  }

  async getChildrenIssues(kit: Octokit) {
    logger("info", `getChildrenIssues: ${this.title}`);
    if (!this.subtasks.length) {
      logger("info", `skip because no subtasks`);
      return [];
    }

    const res: Issue[] = [];
    for (let [closed, , issueData] of this.subtasks) {
      if (closed || !issueData) {
        continue;
      }

      logger("info", `processing ${issueData.repo}#${issueData.number}`);
      let {data: issue} = await kit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
        owner: this.owner_login,
        repo: issueData.repo,
        issue_number: issueData.number,
      });

      logger("info", `process ${issue.id}`, issue);
      try {
        const zIssue = await Issue.load(kit, issue.node_id);
        res.push(zIssue);
        logger("info", `done processing ${issue.title}`);
      } catch(e) {
        logger("error", e)
      }
    }

    return res;
  }

  async syncChildrenMilestone(kit: Octokit, oldMilestone: Milestone | null, newMilestone: Milestone | null) { // todo
    if (this.subtasks.length) {
      logger("info", 'sync children milestone, from:', oldMilestone);
      logger("info", 'sync children milestone, to:', newMilestone);
    }
    const milestoneMap: Record<string, number> = {};
    // sync milestones for children
    for (let i = 0; i < this.subtasks.length; i++) {
      const [_closed, title, issueData] = this.subtasks[i];

      // don't update closed subtasks
      if (_closed || !issueData) {
        logger("info", `skip "${title}" because it's closed or couldn't be parsed`);
        continue;
      }

      const {repo, number: issue_number} = issueData;

      logger("info", `processing ${repo}#${issue_number}`);
      let {data: issue} = await kit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
        owner: this.owner_login,
        repo,
        issue_number,
      });

      if (
        (issue.milestone && !oldMilestone) ||
        (issue.milestone && oldMilestone && issue.milestone.title !== oldMilestone.title)
      ) {
        logger("info", `skip ${repo}#${issue_number} because it didn't match the old milestone: issue milestone: ${issue.milestone?.number}, old milestone: ${oldMilestone?.number}`);

        continue;
      }

      let milestoneNumber = newMilestone ? newMilestone.number : null;

      if (newMilestone && newMilestone.title && repo !== this.repo_name) {
        if (!milestoneMap[repo]) {
          let {data: repoMilestones} = await kit.request('GET /repos/{owner}/{repo}/milestones', {
            owner: this.owner_login,
            repo,
          });
          let milestone = repoMilestones.find((m) => m.title === newMilestone?.title);
          if (milestone) {
            milestoneMap[repo] = milestone.number;
          } else {
            // we wouldn't be able to update milestone for another repo's issue
            milestoneMap[repo] = -1;
            continue;
          }
        } else if (milestoneMap[repo] > 0) {
          milestoneNumber = milestoneMap[repo];
        } else {
          continue;
        }
      }

      if (!isDryRun()) {
        await kit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
          owner: this.owner_login,
          repo,
          issue_number,
          milestone: milestoneNumber,
        });
      }

      logger("info", `set issue #${repo}/${issue_number} milestone to`, milestoneNumber);
    }
  }
}
