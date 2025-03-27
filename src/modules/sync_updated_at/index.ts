import {Probot} from "probot";
import {logger} from "../../shared/logger";
import {isDryRun} from "../../shared/utils";
import {ALL_TEAMS_PROJECTS} from "../../shared/project_ids";
import {setDateField} from "../../shared/graphql_queries";

const config = ALL_TEAMS_PROJECTS
  .filter(pr => !!pr.updatedAtFieldId)
  .map(({projectId, updatedAtFieldId}) => {
    return { projectId, updatedAtFieldId }
  });

// Syncs "Created at" field for project item from the issue.
// Important: The value that will be set is when the issue was created, not when the issue was added to the project.

export const sync_updated_at = (app: Probot) => {
  app.on(["projects_v2_item.edited"], async (context) => {
    // add created_at field
    if (context.payload.projects_v2_item.content_type !== 'Issue') {
      logger('info', 'skip because content type is not issue');
      return;
    }

    if (context.payload.sender.type === 'Bot') {
      logger('info', 'skip "sync_updated_at" because sender is a bot');
      return;
    }

    const projectId = context.payload.projects_v2_item.project_node_id;
    const projectItemId = context.payload.projects_v2_item.node_id;
    const updatedAt = context.payload.projects_v2_item.updated_at;

    const projectConfig = config.find(c => c.projectId === projectId);

    if (!projectConfig) {
      logger('info', `skip because syncing \`updated_at\` is not configured for project ${projectId}`);
      return;
    }

    try {
      logger('info', `setting updatedAt for item #${projectItemId} in project ${projectId}`);

      if (!isDryRun()) {
        await context.octokit.graphql(setDateField, {
          project_id: projectId,
          project_item_id: projectItemId,
          date_field_id: projectConfig.updatedAtFieldId,
          value: updatedAt,
        });
      }
      logger('info', `updatedAt has been updated for project item '${projectItemId}' with value '${updatedAt}'`);
    } catch(e) {
      logger('error', `failed to update updatedAt for project item '${projectItemId}' in project ${projectId}`, e);
    }
  });
}