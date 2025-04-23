import {issueProjectV2Items, IssueProjectV2Items} from "../../shared/graphql_queries";
import {config} from "./config";
import {EmitterWebhookEvent, EmitterWebhookEventName} from "@octokit/webhooks";
import {Context} from "probot/lib/context";
import {clearFieldForProjectItem, setFieldForProjectItem} from "./utils";

export const sub_issues_parent_issue_added_listener = async (context: EmitterWebhookEvent<"sub_issues.parent_issue_added"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  const parentNodeId = context.payload.parent_issue.node_id;
  const subIssueNodeId = context.payload.sub_issue.node_id;

  const {node: parentProjectConnections}: IssueProjectV2Items = await context.octokit.graphql(issueProjectV2Items, {
    id: parentNodeId,
  });

  if (!parentProjectConnections.projectItems.nodes.length) {
    return;
  }
  const {node: subIssueProjectItems}: IssueProjectV2Items = await context.octokit.graphql(issueProjectV2Items, {
    id: subIssueNodeId,
  });

  for (let projectItem of subIssueProjectItems.projectItems.nodes) {
    const projectId = projectItem.project.id;
    const fieldId = config[projectId];

    if (!fieldId) {
      context.log.info("Skip because project doesn't have automation set up");
      continue;
    }

    // todo: skip if the item of subIssue is archived in the project

    const parentIssueInProject = parentProjectConnections.projectItems.nodes.find(prItem => (
      prItem.project.id === projectId
    ));

    if (!parentIssueInProject) {
      context.log.info(`Skip because parent does not belong to the project ${projectId}`);
      continue;
    }

    await setFieldForProjectItem(context, projectItem, fieldId);
  }
}

export const sub_issues_parent_issue_removed_listener = async (context: EmitterWebhookEvent<"sub_issues.parent_issue_removed"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  const subIssueNodeId = context.payload.sub_issue.node_id;

  const {node: subIssueProjectItems}: IssueProjectV2Items = await context.octokit.graphql(issueProjectV2Items, {
    id: subIssueNodeId,
  });

  for (let projectItem of subIssueProjectItems.projectItems.nodes) {
    const projectId = projectItem.project.id;
    const fieldId = config[projectId];

    if (!fieldId) {
      context.log.info("Skip because project doesn't have automation set up");
      continue;
    }

    await clearFieldForProjectItem(context, projectItem, fieldId);
  }
}