import {Probot} from "probot";
import {logger} from "../../shared/logger";
import {isDryRun} from "../../shared/utils";
import {ALL_TEAMS_PROJECTS} from "../../shared/project_ids";
import {clearFieldValue, setDateField} from "../../shared/graphql_queries";
import {Issue} from "../../shared/issue";

const config = ALL_TEAMS_PROJECTS
  .filter(pr => !!pr.closedAtFieldId)
  .map(({projectId, closedAtFieldId}) => {
    return { projectId, closedAtFieldId }
  });

// Syncs "Closed at" field for project item.
// Value will be set when issue is closed and cleaned if issue is reopened

export const sync_closed_at = (app: Probot) => {
  app.on(["issues.closed", "issues.reopened"], async (context) => {
    let issue: Issue;
    try {
      issue = await Issue.load(context.octokit, context.payload.issue.node_id);

    } catch (e) {
      logger('error', `failed to load issue #${context.payload.repository.name}/${context.payload.issue.id}`, e);
      return;
    }

    const closedAt = context.payload.issue.closed_at;

    for (let projectId in issue.connectedProjectItems) {
      const projectItemId = issue.connectedProjectItems[projectId];
      const projectConfig = config.find(c => c.projectId === projectId);
      if (!projectConfig) {
        logger('info', `skip because syncing \`updated_at\` is not configured for project ${projectId}`);
        break;
      }

      try {
        logger('info', `setting closedAt for item #${projectItemId} in project ${projectId}`);

        if (!isDryRun()) {
          if (closedAt) {
            await context.octokit.graphql(setDateField, {
              project_id: projectId,
              project_item_id: projectItemId,
              date_field_id: projectConfig.closedAtFieldId,
              value: closedAt,
            });
            logger('info', `closedAt has been updated for project item '${projectItemId}' with value '${closedAt}'`);
          } else {
            await context.octokit.graphql(clearFieldValue, {
              project_id: projectId,
              project_item_id: projectItemId,
              field_id: projectConfig.closedAtFieldId,
            });
            logger('info', `closedAt has been cleared for project item '${projectItemId}'`);
          }
        }
      } catch (e) {
        logger('error', `failed to update closedAt for project item '${projectItemId}' in project ${projectId}`, e);
      }
    }
  })
}