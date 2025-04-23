import {Context} from "probot/lib/context";
import {EmitterWebhookEventName} from "@octokit/webhooks";
import {HAS_PARENT_IN_PROJECT_VALUE} from "./config";
import {isDryRun} from "../../shared/utils";
import {clearFieldValue, setNumberField} from "../../shared/graphql_queries";

export async function setFieldForProjectItem(context: Pick<Context<EmitterWebhookEventName>, "octokit" | "log">, projectItem: {
  id: string;
  project: { id: string }
}, fieldId: string) {
  try {
    context.log.info(`Try set hasParentInProject value to ${HAS_PARENT_IN_PROJECT_VALUE} for item ${projectItem.id} in project ${projectItem.project.id}`)
    if (!isDryRun()) {
      const res = await context.octokit.graphql(setNumberField, {
        project_id: projectItem.project.id,
        project_item_id: projectItem.id,
        field_id: fieldId,
        value: HAS_PARENT_IN_PROJECT_VALUE
      });
      context.log.info(`Done set hasParentInProject value to ${HAS_PARENT_IN_PROJECT_VALUE} for item ${projectItem.id} in project ${projectItem.project.id} with res`, res);
    }
  } catch (e) {
    context.log.error(e);
  }
}

export async function clearFieldForProjectItem(context: Pick<Context<EmitterWebhookEventName>, "octokit" | "log">, projectItem: {
  id: string;
  project: { id: string; title: string }
}, fieldId: string) {
  try {
    context.log.info(`Try clear hasParentInProject value for item ${projectItem.id} in project ${projectItem.project.id}`)
    if (!isDryRun()) {
      const res = await context.octokit.graphql(clearFieldValue, {
        project_id: projectItem.project.id,
        project_item_id: projectItem.id,
        field_id: fieldId,
      });
      context.log.info(`Done clear hasParentInProject value for item ${projectItem.id} in project ${projectItem.project.id} with res`, res);
    }
  } catch (e) {
    context.log.error(e);
  }
}