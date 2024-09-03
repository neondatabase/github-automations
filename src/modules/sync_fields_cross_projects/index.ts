
import {Probot} from "probot";
import {get_target_fields} from "./get_target_fields";
// import {isDryRun} from "../../shared/utils";
import {logger} from "../../shared/logger";
import {projectV2ItemByNodeId} from "../../shared/graphql_queries";
import {Issue} from "../../shared/issue";

// this automation will sync fields values between projects.
//
// Limitations:
// 1. the receiver field must always be of a string type, so color coding for select fields won't be preserved.
//
// How to set it up:
// Let's say you want to sync field Status from Project X to field "Design Status" to Project Y
// 1. get all the project IDs <todo: how to do that>
// 2. todo

export const sunc_fields_cross_projects = (app: Probot) => {
  app.on(["projects_v2_item.created", "projects_v2_item.edited"], async (context) => {
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

      const nextValue = fieldData ? fieldData.title : '';
      for ( const {projectId, fieldId} of to) {
        logger("info", `updating field ${fieldId} in project ${projectId} with value ${nextValue}`)
        const issue = await Issue.load(context.octokit, context.payload.projects_v2_item.content_node_id);

        await issue.setFieldValue(context.octokit, projectId, fieldId, nextValue);
      }
    }
  });
};