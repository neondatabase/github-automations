import {EmitterWebhookEvent, EmitterWebhookEventName} from "@octokit/webhooks";
import {Context} from "probot/lib/context";
import {SyncFieldsConfig, CONFIG, TargetFields} from "./config";

export const get_target_fields: (c: EmitterWebhookEvent<"projects_v2_item.edited"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => TargetFields = (context) => {
  const sourceProjectId = context.payload.projects_v2_item.project_node_id;
  if (!sourceProjectId || !CONFIG[sourceProjectId]) {
    return {}
  }

  const projectConfig: SyncFieldsConfig = CONFIG[sourceProjectId];

  if (!context.payload.changes || !context.payload.changes.field_value) {
    return {}
  }

  const changedFieldId = context.payload.changes.field_value.field_node_id;
  if (changedFieldId === projectConfig.forceSyncFieldId) {
    return projectConfig.to;
  }

  if (changedFieldId && Object.keys(projectConfig.to).includes(changedFieldId)) {
    return {[changedFieldId]: projectConfig.to[changedFieldId]}
  }

  return {}
}