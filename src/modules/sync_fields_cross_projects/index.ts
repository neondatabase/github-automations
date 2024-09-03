
import {Probot} from "probot";
import {get_target_fields} from "./get_target_fields";
// import {isDryRun} from "../../shared/utils";
import {logger} from "../../shared/logger";
import {projectV2ItemByNodeId} from "../../shared/graphql_queries";
import {Issue} from "../../shared/issue";
import {CONFIG, WATCH_PROJECT_IDS} from "./config";

// this automation will sync fields values between projects.
//
// Limitations:
// 1. the receiver field must always be of a string type, so color coding for select fields won't be preserved.
//
// How to set it up:
// Let's say you want to sync field Status from Project X to field "Design Status" to Project Y
// 1. get all the project IDs <todo: how to do that>
// 2. todo

export const sync_fields_cross_projects = (app: Probot) => {
  app.on(["projects_v2_item.edited"], async (context) => {
    if (context.payload.projects_v2_item.content_type !== 'Issue') {
      return;
    }
    // check if item belongs to one of the projects we sync things from
    const targetFields = get_target_fields(context);

    if (!Object.keys(targetFields).length) {
      return;
    }
    const sourceItemId = context.payload.projects_v2_item.node_id;
    const {node} = await context.octokit.graphql(projectV2ItemByNodeId, {project_item_id: sourceItemId});

    for (const sourceFieldId in targetFields) {
      const to = targetFields[sourceFieldId];
      const fieldData = node.fieldValues.nodes.find((item: {field?: { id: string }, title: string}) => {
        return item.field && item.field.id === sourceFieldId
      });

      const nextValue = fieldData ? (fieldData.title || fieldData.date || fieldData.name || fieldData.text || fieldData.number) : '';
      for ( const {projectId, fieldId} of to) {
        logger("info", `updating field ${fieldId} in project ${projectId} with value ${nextValue}`)
        const issue = await Issue.load(context.octokit, context.payload.projects_v2_item.content_node_id);

        await issue.setFieldValue(context.octokit, projectId, fieldId, nextValue);
      }
    }
  });

  app.on(["projects_v2_item.created"], async (context) => {
    if (context.payload.projects_v2_item.content_type !== 'Issue') {
      return;
    }
    const projectId = context.payload.projects_v2_item.project_node_id;

    if (!WATCH_PROJECT_IDS.includes(projectId)) {
      return;
    }
    // check if item is created in one of the projects we sync things to
    const issue = await Issue.load(context.octokit, context.payload.projects_v2_item.content_node_id)

    for (const sourceProjectId in issue.connectedProjectItems) {
      const targetFields = CONFIG[sourceProjectId].to;

      if (!Object.keys(targetFields).length) {
        return;
      }
      const sourceItemId = issue.connectedProjectItems[sourceProjectId];
      const {node} = await context.octokit.graphql(projectV2ItemByNodeId, {project_item_id: sourceItemId});

      for (const sourceFieldId in targetFields) {
        const to = targetFields[sourceFieldId];
        const fieldData = node.fieldValues.nodes.find((item: {field?: { id: string }, title: string}) => {
          return item.field && item.field.id === sourceFieldId
        });

        const nextValue = fieldData ? (fieldData.title || fieldData.date || fieldData.name || fieldData.text || fieldData.number) : '';
        for ( const {projectId, fieldId} of to) {
          logger("info", `updating field ${fieldId} in project ${projectId} with value ${nextValue}`)
          const issue = await Issue.load(context.octokit, context.payload.projects_v2_item.content_node_id);

          await issue.setFieldValue(context.octokit, projectId, fieldId, nextValue);
        }
      }
    }

  });
};