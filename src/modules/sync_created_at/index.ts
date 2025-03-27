import {Probot} from "probot";
import {logger} from "../../shared/logger";
import {Issue} from "../../shared/issue";
import {isDryRun} from "../../shared/utils";
import {ALL_TEAMS_PROJECTS} from "../../shared/project_ids";
import {setDateField} from "../../shared/graphql_queries";

const config = ALL_TEAMS_PROJECTS
  .filter(pr => !!pr.createdAtFieldId)
  .map(({projectId, createdAtFieldId}) => {
  return { projectId, createdAtFieldId }
});

// Syncs "Created at" field for project item from the issue.
// Important: The value that will be set is when the issue was created, not when the issue was added to the project.

export const sync_created_at = (app: Probot) => {
  app.on(["projects_v2_item.created"], async (context) => {
    // add created_at field
    if (context.payload.projects_v2_item.content_type !== 'Issue') {
      logger('info', 'skip because content type is not issue');
      return;
    }

    const projectId = context.payload.projects_v2_item.project_node_id;
    const projectItemId = context.payload.projects_v2_item.node_id;
    const issueNumber = context.payload.projects_v2_item.content_node_id;

    const projectConfig = config.find(c => c.projectId === projectId);

    if (!projectConfig) {
      logger('info', `skip because syncing \`created_at\` is not configured for project ${projectId}`);
      return;
    }

    try {
      const issue = await Issue.load(context.octokit, issueNumber);

      logger('info', `setting created at for issue #${issue.number} ${issue.title} in project ${projectId}`);

      if (!isDryRun()) {
        await context.octokit.graphql(setDateField, {
          project_id: projectId,
          project_item_id: projectItemId,
          date_field_id: projectConfig.createdAtFieldId,
          value: issue.createdAt,
        });
      }
      logger('info', `createdAt has been updated for project item '${projectItemId}' (#${issue.number} ${issue.title}) with value '${issue.createdAt}'`);
    } catch(e) {
      logger('error', `filaed to update createdAt for project item '${projectItemId}' in project ${projectId}`, e);
    }
  });
}