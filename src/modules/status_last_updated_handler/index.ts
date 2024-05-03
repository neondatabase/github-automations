import {Probot} from "probot";
import {config} from "./config";
import {
  projectV2ItemStatusFieldValue,
  setDateField
} from "../../shared/graphql_queries";
import {logger} from "../../shared/logger";
import {isDryRun} from "../../shared/utils";

export const status_last_updated_handler = (app: Probot) => {
  app.on(["projects_v2_item.edited", "projects_v2_item.created"], async (context) => {
    // we use this event instead issue.edited because in this event we will get the project_node_id
    logger("info", "status_last_updated_handler fired with payload", context.payload);
    const projectId = context.payload.projects_v2_item.project_node_id;
    const statusFieldId = config[projectId].statusFieldId;
    const lastUpdatedFieldId = config[projectId].statusLastUpdatedFieldId;
    if (!(Object.keys(config)).includes(projectId) || !statusFieldId || !lastUpdatedFieldId) {
      logger("info", 'status_last_updated_handler skipped because not configured for the project')
      return;
    }

    // @ts-ignore
    if (context.payload.changes && context.payload.changes.fieldId !== statusFieldId) {
      logger("info", 'status_last_updated_handler skipped because changes are not in status field')
      return;
    }

    try {
      const projectsItem = await context.octokit.graphql(
        projectV2ItemStatusFieldValue,
        {
          project_item_id: context.payload.projects_v2_item.node_id,
        });
      const updatedAt = (projectsItem as any).node.fieldValueByName.updatedAt;
      const params = {
        project_id: projectId,
        project_item_id: context.payload.projects_v2_item.node_id,
        date_field_id: lastUpdatedFieldId,
        value: updatedAt,
      };
      logger("info", "Update project v2 item with", params);
      if (!isDryRun()) {
        const res = await context.octokit.graphql(
          setDateField,
          params);
        logger("info", "Item updated with result", res);
      }
    } catch(e) {
      logger("error", "Failed to update Status last updated field", e);
    }
  });
}