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
    if (projectItem.isArchived) {
      context.log.info("Skip because item is archived");
      continue;
    }

    if (projectItem.type !== 'Issue') {
      context.log.info("Skip because item is type is not an issue");
      continue;
    }

    const projectId = projectItem.project.id;
    const fieldId = config[projectId];

    if (!fieldId) {
      context.log.info("Skip because project doesn't have automation set up");
      continue;
    }

    const parentIssueInProject = parentProjectConnections.projectItems && parentProjectConnections.projectItems.nodes && parentProjectConnections.projectItems.nodes.find(prItem => (
      prItem.project.id === projectId
    ));

    if (!parentIssueInProject) {
      await clearFieldForProjectItem(context, projectItem, fieldId)
      context.log.info(`Skip because parent does not belong to the project ${projectId}`);
    } else {
      await setFieldForProjectItem(context, projectItem, fieldId);
    }

  }
}

export const sub_issues_parent_issue_removed_listener = async (context: EmitterWebhookEvent<"sub_issues.parent_issue_removed"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  const subIssueNodeId = context.payload.sub_issue.node_id;

  const {node: subIssueProjectItems}: IssueProjectV2Items = await context.octokit.graphql(issueProjectV2Items, {
    id: subIssueNodeId,
  });

  for (let projectItem of subIssueProjectItems.projectItems.nodes) {
    if (projectItem.isArchived) {
      context.log.info("Skip because item is archived");
      continue;
    }

    if (projectItem.type !== 'Issue') {
      context.log.info("Skip because item is type is not an issue");
      continue;
    }

    const projectId = projectItem.project.id;
    const fieldId = config[projectId];

    if (!fieldId) {
      context.log.info("Skip because project doesn't have automation set up");
      continue;
    }

    await clearFieldForProjectItem(context, projectItem, fieldId);
  }
}