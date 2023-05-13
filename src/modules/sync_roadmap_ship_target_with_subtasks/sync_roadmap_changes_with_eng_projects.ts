import {Context} from "probot/lib/context";
import {EmitterWebhookEvent, EmitterWebhookEventName, } from "@octokit/webhooks";

import {CONSOLE, NEON_PRIVATE_ROADMAP} from "../../project_ids";
import {Issue} from "../../lib/issue_next";
import {Octokit} from "@octokit/core";
import {isDryRun} from "../../lib/utils";
import {projectV2ItemByNodeId} from "../../graphql_queries";
import {logger} from "../../lib/logger";

const FIELDS_MAPPING = [
  {
    from: NEON_PRIVATE_ROADMAP.targetShipMothFieldId,
    to: [
      {
        projectId: CONSOLE.projectId,
        fieldId: CONSOLE.roadmapTargetShipMonthFieldId,
      }
    ]
  },
  {
    from: NEON_PRIVATE_ROADMAP.targetShipQuarterFieldId,
    to: [
      {
        projectId: CONSOLE.projectId,
        fieldId: CONSOLE.roadmapTargetShipQuarterFieldId,
      }
    ]
  }
];

const syncFieldValuesWithSubtasks = async (kit: Octokit, roadmapNodeId: string, issues: Issue[], fieldMapping: Array<{ from: string, to: Array<{ projectId: string, fieldId: string }> }>) => {
  const {node} = await kit.graphql(projectV2ItemByNodeId, {project_item_id: roadmapNodeId});
  logger("syncFieldValuesWithSubtasks")
  logger("processing node:", node);
  logger("processing children:", issues);
  logger("field mapping: ", fieldMapping);

  issues.map(async (issueItem) => {
    if (issueItem.closed) {
      // skip because closed
      return;
    }

    for (const {from, to} of fieldMapping) {
      const fieldData = node.fieldValues.nodes.find((item: {field?: { id: string }, title: string}) => {
        return item.field && item.field.id === from
      });

      const nextValue = fieldData ? fieldData.title : '';

      if (!isDryRun()) {
        for (const {projectId, fieldId} of to) {
          await issueItem.setFieldValue(kit, projectId, fieldId, nextValue)
        }
      }
    }
  })
}

export const syncRoadmapTargetFieldsWithEngProjects = async (context: EmitterWebhookEvent<"projects_v2_item.edited"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  // check all the children in Engineering and Console projects
  // and sync Target Month and Target Quarter fields
  // from Roadmap Project item to Engineering and Console projects
  if (context.payload.sender.type === "Bot" ||
    context.payload.projects_v2_item.content_type !== 'Issue') {
    return;
  }

  const mapping = FIELDS_MAPPING.filter(item => item.from === context.payload.changes.field_value.field_node_id);

  logger("changes", context.payload.changes)
  logger("All mapping", FIELDS_MAPPING)
  logger("will apply mapping", mapping)
  if (!mapping.length) {
    logger("skipping because nothing to map")
  }

  const issue = await Issue.load(context.octokit, context.payload.projects_v2_item.content_node_id);
  const childrenIssues = await issue.getChildrenIssues(context.octokit);
  await syncFieldValuesWithSubtasks(
    context.octokit,
    context.payload.projects_v2_item.node_id,
    childrenIssues,
    mapping,
  )
}