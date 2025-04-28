import {
  ALL_TEAMS_PROJECTS
} from "../../shared/project_ids";
import {Probot} from "probot";
import {logger} from "../../shared/logger";
import {isDryRun} from "../../shared/utils";
import {Issue} from "../../shared/issue";

// this automation will ensure that issue in project X will always have label Y
// and if the issue is not in the project it won't have the label.
//
// To enable this automation for your project
// add project id and label name to the PROJECTS_TO_LABELS_MAP object
//
// Instruction to sync things manually on issues view https://github.com/neondatabase/cloud/issues
// 1. Add label to the issues that are added to the project:
//    1.1. Use this filter:
//         `is:issue state:open project:neondatabase/<project_number> -label:<team_label>`
//    1.2. Select all issues, click 'Lables', select the <team_label> label to bulk add it to selected issues
// 2. Remove label from the issues that do not belong to the project anymore
//    2.1. Use this filter:
//         `is:issue state:open -project:neondatabase/<project_number> label:<team_label>`
//    2.2. Select all issues, click 'Lables', select the <team_label> label to bulk remove it from selected issues
const configArr = ALL_TEAMS_PROJECTS.filter(({projectId, teamLabelName}) => {
  return !!projectId && !!teamLabelName;
});

// @ts-ignore
const PROJECTS_TO_LABELS_MAP = Object.fromEntries(configArr.map(({projectId, teamLabelName}) => {
  return [projectId, teamLabelName];
}));

export const sync_team_label_with_project = (app: Probot) => {
  app.on(["projects_v2_item.created"], async (context) => {
    // add label
    if (context.payload.projects_v2_item.content_type !== 'Issue') {
      logger('info', 'skip because content type is not issue');
      return;
    }

    const projectId = context.payload.projects_v2_item.project_node_id;
    if (!projectId) {
      logger('info', 'skip because projectId is undefined');
      return;
    }

    const label = PROJECTS_TO_LABELS_MAP[projectId];
    const issueNumber = context.payload.projects_v2_item.content_node_id;

    if (!label) {
      logger('info', 'skip because label is not configured');
      return;
    }

    try {
      const issue = await Issue.load(context.octokit, issueNumber);

      logger('info', `setting label ${label} for issue #${issue.number} ${issue.title}`);
      if (!isDryRun()) {
        await context.octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
          owner: issue.owner_login,
          repo: issue.repo_name,
          issue_number: issue.number,
          labels: [
            label
          ]
        })
        logger('info', `label ${label} has been added for issue #${issue.number} ${issue.title}`);
      }
    } catch(e) {
      logger('error', `setting label ${label} for issue ${issueNumber} failed`, e);
    }
  });

  app.on(["projects_v2_item.converted"], async (context) => {
    if (context.payload.projects_v2_item.content_type !== 'Issue') {
      logger('info', 'skip because content type is not issue');
      return;
    }

    // add label
    const projectId = context.payload.projects_v2_item.project_node_id;

    if (!projectId) {
      logger('info', 'skip because projectId is undefined');
      return;
    }

    const label = PROJECTS_TO_LABELS_MAP[projectId];
    const issueNumber = context.payload.projects_v2_item.content_node_id;

    if (!label) {
      logger('info', 'skip because label is not configured');
      return;
    }

    try {
      const issue = await Issue.load(context.octokit, issueNumber);

      logger('info', `setting label ${label} for issue #${issue.number} ${issue.title}`);
      if (!isDryRun()) {
        await context.octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
          owner: issue.owner_login,
          repo: issue.repo_name,
          issue_number: issue.number,
          labels: [
            label
          ]
        })
        logger('info', `label ${label} has been added for issue #${issue.number} ${issue.title}`);
      }
    } catch(e) {
      logger('error', `setting label ${label} for issue ${issueNumber} failed`, e);
    }
  });

  app.on(["projects_v2_item.deleted"], async (context) => {
    if (context.payload.projects_v2_item.content_type !== 'Issue') {
      logger('info', 'skip because content type is not issue');
      return;
    }

    // remove label
    const projectId = context.payload.projects_v2_item.project_node_id;

    if (!projectId) {
      logger('info', 'skip because projectId is undefined');
      return;
    }

    const label = PROJECTS_TO_LABELS_MAP[projectId];
    const issueNumber = context.payload.projects_v2_item.content_node_id;

    if (!label) {
      logger('info', 'skip because label is not configured');
      return;
    }

    try {
      const issue = await Issue.load(context.octokit, issueNumber);

      logger('info', `removing label ${label} for issue #${issue.number} ${issue.title}`);
      if (!isDryRun()) {
        await context.octokit.request('DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}', {
          owner: issue.owner_login,
          repo: issue.repo_name,
          issue_number: issue.number,
          name: label
        })
        logger('info', `label ${label} has been removed for issue #${issue.number} ${issue.title}`);
      }
    } catch(e) {
      logger('error', `removing label ${label} for issue ${issueNumber} failed`, e);
    }
  });
};