import {
  issueData,
} from "../../shared/graphql_queries";
import {config} from "./config";
import {EmitterWebhookEvent, EmitterWebhookEventName} from "@octokit/webhooks";
import {Context} from "probot/lib/context";
import {GraphQlQueryResponseData} from "@octokit/graphql";
import {clearFieldForProjectItem, setFieldForProjectItem} from "./utils";

export const item_added_restored_deleted_listener = async (context: EmitterWebhookEvent<"projects_v2_item.created" | "projects_v2_item.restored" | "projects_v2_item.deleted" | "projects_v2_item.archived"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  if (context.payload.projects_v2_item.content_type !== "Issue") {
    context.log.info(`skip because content type is not an issue`);
    return;
  }

  const issueNodeId = context.payload.projects_v2_item.content_node_id;
  const projectId = context.payload.projects_v2_item.project_node_id;
  const projectItemId = context.payload.projects_v2_item.node_id;

  if (!issueNodeId || !projectId || !projectItemId) {
    context.log.info(`skip because missing id`);

   return;
  }

  const issueProjectItem = {
    id: issueNodeId,
    project: {
      id: projectId
    }
  }

  const fieldId = config[projectId];
  if (!fieldId) {
    context.log.info(`skip because has_parent_in_project is not configured for project ${projectId}`);
    return;
  }

  const issue: GraphQlQueryResponseData = await context.octokit.graphql(issueData, {
    id: issueNodeId
  });

  // check for parent in project and update if parent belongs to the same project
  if (issue.parent && (context.payload.action === 'created' || context.payload.action === 'restored')) {
    const parentProjectItem = issue.parent.projectItems.nodes.find((prItem: any) => (
      prItem.project.id === projectId
    ));
    if (parentProjectItem) {
      await setFieldForProjectItem(context, issueProjectItem, fieldId)
    }
  }

  // update value for all sub issues
  for (let subIssue of issue.node.subIssues.nodes) {
    const projectItem = subIssue.projectItems.nodes.find((prItem: any) => (
      prItem.project.id === projectId
    ));

    if (!projectItem) {
      context.log.info(`skip because subissue ${subIssue.id} doesn't belong to the same project as parent`)
      continue;
    }

    if (projectItem.isArchived) {
      context.log.info(`skip because subissue ${subIssue.id} is archived`)
      continue;
    }

    if (projectItem.type !== "Issue") {
      context.log.info(`skip because subissue ${subIssue.id} type is not an issue`)
      continue;
    }

    if (context.payload.action === 'deleted' || context.payload.action === 'archived') {
      await clearFieldForProjectItem(context, projectItem, fieldId)
    } else {
      await setFieldForProjectItem(context, projectItem, fieldId)
    }
  }
}
