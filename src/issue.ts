import { Octokit } from "@octokit/core";
import type { GraphQlQueryResponseData } from "@octokit/graphql";
import {isDryRun} from "./utils";

// gh api graphql -f query='
//   query {
//     organization(login: "zenithdb"){
//       projectNext(number: 6) {
//           id
//       }
//     }
//   }'
const PROJECT_ID = 'PN_kwDOBKF3Cs1e-g'

// gh api graphql -f query='
// query{
//   node(id: "PN_kwDOBKF3Cs1e-g") {
//     ... on ProjectNext {
//       fields(first: 20) {
//         nodes {
//           id
//           name
//           settings
//         }
//       }
//     }
//   }
// }'
const TRACKED_IN_FIELD_ID = 'MDE2OlByb2plY3ROZXh0RmllbGQ0ODg0OTM='
const PROGRESS_FIELD_ID = 'MDE2OlByb2plY3ROZXh0RmllbGQ5NzkxMzc='

interface Milestone {
  id: number;
  node_id: string;
  dueOn: string;
  number: any;
  title?: string;
}

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
  subtasks: Array<[boolean, string, IssueData | undefined]>;
  owner_login: string;
  milestone?: Milestone;

  mentions: Array<Issue>;
  parents: Array<Issue>;

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
    let issue = new Issue(resp.node);
    // console.log("new ZenithIssue object: ", issue);
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

  trackedIn() {
    return this.parents
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

  async addToTheProject(kit: Octokit) {
    // upsert to the project
    let resp: GraphQlQueryResponseData = await kit.graphql(addToTheProject, {
      issue_id: this.node_id,
      project_id: PROJECT_ID,
    });
    console.log("addToTheProject: ", resp);

    let project_item_id: string = resp.addProjectNextItem.projectNextItem.id

    // set tracked_in field
    if (!isDryRun()) {
      resp = await kit.graphql(setField, {
        project_id: PROJECT_ID,
        project_item_id: project_item_id,
        tracked_field_id: TRACKED_IN_FIELD_ID,
        value: this.trackedIn(),
      });
    }
    console.log("setTrackedIn: ", resp);

    // set progress field
    if (!isDryRun()) {
      resp = await kit.graphql(setField, {
        project_id: PROJECT_ID,
        project_item_id: project_item_id,
        tracked_field_id: PROGRESS_FIELD_ID,
        value: this.progress(),
      });
    }
    console.log("setProgressField: ", resp);

    if (this.milestone && this.subtasks.length > 0) {
      // set milestone field for child issues
      await this.syncChildrenMilestone(kit, this.milestone, this.milestone);
    }
  }

  async syncChildrenMilestone(kit: Octokit, oldMilestone: Milestone | null, newMilestone: Milestone | null) {
    console.log('sync children milestone, from:', oldMilestone);
    console.log('sync children milestone, to:', newMilestone);
    const milestoneMap: Record<string, number> = {};
    // sync milestones for children
    for (let i = 0; i < this.subtasks.length; i++) {
      const [_closed, , issueData] = this.subtasks[i];

      // don't update closed subtasks
      if (_closed || !issueData) {
        continue;
      }

      const {repo, number: issue_number} = issueData;

      let {data: issue} = await kit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
        owner: this.owner_login,
        repo,
        issue_number,
      });

      if (
        (!issue.milestone && oldMilestone) ||
        (issue.milestone && !oldMilestone) ||
        (issue.milestone && oldMilestone && issue.milestone.title !== oldMilestone.title)
      ) {
        continue;
      }

      if (issue.milestone && issue.milestone.title === oldMilestone?.title) {
        // we don't want update child's issue milestone if it's milestone doesn't match the parent
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

      console.log(`set issue #${repo}/${issue_number} milestone to`, milestoneNumber);
    }
  }

}

const issueWithParents = `
    query($issue_id: ID!) {
      node(id: $issue_id) {
        id
        ... on Issue {
          id
          title
          body
          number
          milestone {
            id
            dueOn
            number
            title
          }
          repository {
            nameWithOwner
            name
            owner {
              login
            }
          }
          timelineItems(last: 100) {
            nodes {
              ... on CrossReferencedEvent {
                id
                source {
                  ... on Issue {
                    id
                    title
                    body
                    number
                    milestone {
                      id
                      dueOn
                      number
                      title
                    }
                    repository {
                      nameWithOwner
                      name
                      owner {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `

const addToTheProject = `
    mutation ($project_id: ID!, $issue_id: ID!) {
      addProjectNextItem(input: {
        projectId: $project_id,
        contentId: $issue_id
      }) {
        projectNextItem { id }
      }
    }
  `;

const setField = `
    mutation ($project_id: ID!, $project_item_id: ID!, $tracked_field_id: ID!, $value: String!) {
      updateProjectNextItemField(input: {
        projectId: $project_id,
        itemId: $project_item_id,
        fieldId: $tracked_field_id,
        value: $value
      }) {
        projectNextItem { id }
      }
    }
  `;
