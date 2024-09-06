import {Context} from "probot/lib/context";
import {EmitterWebhookEvent, EmitterWebhookEventName, } from "@octokit/webhooks";

import {
  ALL_TEAMS_PROJECTS,
  NEON_PRIVATE_ROADMAP,
} from "../../shared/project_ids";
import {Issue} from "../../shared/issue";
import {Octokit} from "@octokit/core";
import {isDryRun} from "../../shared/utils";
import {projectV2ItemByNodeId} from "../../shared/graphql_queries";
import {logger} from "../../shared/logger";

const FIELDS_MAPPING = [
  {
    from: NEON_PRIVATE_ROADMAP.targetShipQuarterFieldId,
    to: ALL_TEAMS_PROJECTS
      .filter(({roadmapTargetShipQuarterFieldId}) => !!roadmapTargetShipQuarterFieldId)
      .map(({projectId, roadmapTargetShipQuarterFieldId}) => ({
        projectId,
        fieldId: roadmapTargetShipQuarterFieldId,
      }))
  }
];

const syncFieldValuesWithSubtasks = async (kit: Octokit, roadmapNodeId: string, issues: Issue[], fieldMapping: Array<{ from: string | undefined, to: Array<{ projectId: string, fieldId: string | undefined }> }>) => {

  try {
    const {node} = await kit.graphql(projectV2ItemByNodeId, {project_item_id: roadmapNodeId});

    logger("info", "syncFieldValuesWithSubtasks")
    logger("info", "processing node:", node);
    logger("info", "processing children:", issues);
    logger("info", "field mapping: ", fieldMapping);

    issues.map(async (issueItem) => {
      if (issueItem.closed) {
        // skip because closed
        return;
      }

      for (const {from, to} of fieldMapping) {
        if (from) {
          const fieldData = node.fieldValues.nodes.find((item: {field?: { id: string }, title: string}) => {
            return item.field && item.field.id === from
          });

          const nextValue = fieldData ? fieldData.title : '';

          if (!isDryRun()) {
            for (const {projectId, fieldId} of to) {
              if (fieldId) {
                try {
                  await issueItem.setFieldValue(kit, projectId, fieldId, nextValue)
                } catch(e) {
                  logger('error', 'Failed to sync fields with subtask')
                }
              }
            }
          }
        }
      }
    })
  } catch(e) {
    logger("error", 'Failed to fetch issue', e)
  }
}

export const handleRoadmapProjectItemChange = async (context: EmitterWebhookEvent<"projects_v2_item.edited"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  // check all the children in Engineering and Console projects
  // and sync Target Month and Target Quarter fields
  // from Roadmap Project item to Engineering and Console projects
  if (context.payload.sender.type === "Bot" ||
    context.payload.projects_v2_item.content_type !== 'Issue') {
    return;
  }

  logger("info", 'changed field id', context.payload.changes.field_value.field_node_id);
  logger("info", 'force sync field id', NEON_PRIVATE_ROADMAP.forceSyncFieldId)

  const isForceSyncFieldChanged = context.payload.changes.field_value.field_node_id === NEON_PRIVATE_ROADMAP.forceSyncFieldId;

  const mapping = isForceSyncFieldChanged
    ? FIELDS_MAPPING
    : FIELDS_MAPPING.filter(item => item.from === context.payload.changes.field_value.field_node_id);

  // logger("info", "changes", context.payload.changes)
  logger("info", "All mapping", FIELDS_MAPPING)
  logger("info", "will apply mapping", mapping)
  if (!mapping || !mapping.length) {
    logger("info", "skipping because nothing to map")
  }

  try {
    const issue = await Issue.load(context.octokit, context.payload.projects_v2_item.content_node_id);
    const childrenIssues = await issue.getChildrenIssues(context.octokit);
    await syncFieldValuesWithSubtasks(
      context.octokit,
      context.payload.projects_v2_item.node_id,
      childrenIssues,
      mapping,
    )
  } catch(e) {
    logger("info", 'Failed to sync fields with subtask catchall', e)
  }
}

export const handleRoadmapIssueChange = async (context: EmitterWebhookEvent<"issues.edited"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  try {
    const issue = await Issue.load(context.octokit, context.payload.issue.node_id);
    const childrenIssues = await issue.getChildrenIssues(context.octokit);
    if (!issue.connectedProjectItems[NEON_PRIVATE_ROADMAP.projectId]) {
      return;
    }
    await syncFieldValuesWithSubtasks(
      context.octokit,
      issue.connectedProjectItems[NEON_PRIVATE_ROADMAP.projectId],
      childrenIssues,
      FIELDS_MAPPING,
    )
  } catch(e) {
    logger("error", e)
  }
}