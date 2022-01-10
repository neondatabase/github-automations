import { Octokit } from "@octokit/core";
import type { GraphQlQueryResponseData } from "@octokit/graphql";

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

export class Issue {
  node_id: string;
  title: string;
  body: string;
  closed: boolean;
  number: number;
  repo_full_name: string;
  subtasks: Array<[boolean, string]>;

  mentions: Array<Issue>;
  parents: Array<Issue>;

  constructor(node: any) {
    this.node_id = node.id;
    this.title = node.title;
    this.body = node.body;
    this.closed = node.closed;
    this.number = node.number;
    this.repo_full_name = node.repository.nameWithOwner;
    this.subtasks = [];
    this.mentions = [];
    this.parents = [];

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
    console.log("new ZenithIssue object: ", issue);
    return issue;
  }

  // subtasks are markdown list entries in the body
  private setSubtasks() {
    this.subtasks = Array
      .from(this.body.matchAll(/- \[([ x])\] ([^\n]*)/g))
      .map((m: any) => {
        let closed = m[1] === 'x';
        let title = m[2].trim();
        return [closed, title];
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
    let n_closed = this.subtasks.filter(([closed]) => closed).length;
    let n_total = this.subtasks.length;
    return `${n_closed} / ${n_total}`;
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
    resp = await kit.graphql(setField, {
      project_id: PROJECT_ID,
      project_item_id: project_item_id,
      tracked_field_id: TRACKED_IN_FIELD_ID,
      value: this.trackedIn(),
    });
    console.log("setTrackedIn: ", resp);

    // set progress field
    resp = await kit.graphql(setField, {
      project_id: PROJECT_ID,
      project_item_id: project_item_id,
      tracked_field_id: PROGRESS_FIELD_ID,
      value: this.progress(),
    });
    console.log("setProgressField: ", resp);
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
          repository {
            nameWithOwner
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
                    repository {
                      nameWithOwner
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
