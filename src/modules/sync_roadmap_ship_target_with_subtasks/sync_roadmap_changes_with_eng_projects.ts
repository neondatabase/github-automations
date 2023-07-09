import {Context} from "probot/lib/context";
import {EmitterWebhookEvent, EmitterWebhookEventName, } from "@octokit/webhooks";

import {
  AUTOSCALING, COMPUTE,
  CONSOLE, CONTROL_PLANE, DATA, DOCS,
  ENGINEERING,
  INFRA,
  NEON_PRIVATE_ROADMAP,
  PRODUCT_DESIGN
} from "../../shared/project_ids";
import {Issue} from "../../shared/issue";
import {Octokit} from "@octokit/core";
import {isDryRun} from "../../shared/utils";
import {projectV2ItemByNodeId} from "../../shared/graphql_queries";
import {logger} from "../../shared/logger";

const FIELDS_MAPPING = [
  {
    from: NEON_PRIVATE_ROADMAP.targetShipMothFieldId,
    to: [
      {
        projectId: CONSOLE.projectId,
        fieldId: CONSOLE.roadmapTargetShipMonthFieldId,
      },
      {
        projectId: ENGINEERING.projectId,
        fieldId: ENGINEERING.roadmapTargetShipMonthFieldId,
      },
      {
        projectId: PRODUCT_DESIGN.projectId,
        fieldId: PRODUCT_DESIGN.roadmapTargetShipMonthFieldId,
      },
      {
        projectId: INFRA.projectId,
        fieldId: INFRA.roadmapTargetShipMonthFieldId,
      },
      {
        projectId: AUTOSCALING.projectId,
        fieldId: AUTOSCALING.roadmapTargetShipMonthFieldId,
      },
      {
        projectId: CONTROL_PLANE.projectId,
        fieldId: CONTROL_PLANE.roadmapTargetShipMonthFieldId,
      },
      {
        projectId: DATA.projectId,
        fieldId: DATA.roadmapTargetShipMonthFieldId,
      },
      {
        projectId: COMPUTE.projectId,
        fieldId: COMPUTE.roadmapTargetShipMonthFieldId,
      },
      {
        projectId: DOCS.projectId,
        fieldId: DOCS.roadmapTargetShipMonthFieldId,
      },
    ]
  },
  {
    from: NEON_PRIVATE_ROADMAP.targetShipQuarterFieldId,
    to: [
      {
        projectId: CONSOLE.projectId,
        fieldId: CONSOLE.roadmapTargetShipQuarterFieldId,
      },
      {
        projectId: ENGINEERING.projectId,
        fieldId: ENGINEERING.roadmapTargetShipQuarterFieldId,
      },
      {
        projectId: PRODUCT_DESIGN.projectId,
        fieldId: PRODUCT_DESIGN.roadmapTargetShipQuarterFieldId,
      },
      {
        projectId: AUTOSCALING.projectId,
        fieldId: AUTOSCALING.roadmapTargetShipQuarterFieldId,
      },
      {
        projectId: CONTROL_PLANE.projectId,
        fieldId: CONTROL_PLANE.roadmapTargetShipQuarterFieldId,
      },
      {
        projectId: DATA.projectId,
        fieldId: DATA.roadmapTargetShipQuarterFieldId,
      },
      {
        projectId: COMPUTE.projectId,
        fieldId: COMPUTE.roadmapTargetShipQuarterFieldId,
      },
      {
        projectId: DOCS.projectId,
        fieldId: DOCS.roadmapTargetShipQuarterFieldId,
      },
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

export const handleRoadmapProjectItemChange = async (context: EmitterWebhookEvent<"projects_v2_item.edited"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  // check all the children in Engineering and Console projects
  // and sync Target Month and Target Quarter fields
  // from Roadmap Project item to Engineering and Console projects
  if (context.payload.sender.type === "Bot" ||
    context.payload.projects_v2_item.content_type !== 'Issue') {
    return;
  }

  const mapping = context.payload.changes.field_value.field_node_id === NEON_PRIVATE_ROADMAP.forceSyncFieldId
    ? FIELDS_MAPPING
    : FIELDS_MAPPING.filter(item => item.from === context.payload.changes.field_value.field_node_id);

  // logger("changes", context.payload.changes)
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

export const handleRoadmapIssueChange = async (context: EmitterWebhookEvent<"issues.edited"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
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
}