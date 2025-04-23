import {Probot} from "probot";
import {Issue} from "../../shared/issue";
import {
  CONTROL_PLANE, AUTOSCALING, COMPUTE, STORAGE, PROXY,
  SRE,
  BILLING, IDENTITY, DBAAS, BAAS, WORKFLOW, AZURE, FE_INFRA, QA, SUPPORT_TOOLS,
  DATA, DOCS,
  ENGINEERING, CONSOLE,
  PIXEL_POINT, POSTGRES, PRODUCT
} from "../../shared/project_ids";
import {Octokit} from "@octokit/core";
import {logger} from "../../shared/logger";

const FIELD_IDS_BY_PROJECT_ID = {
  [CONSOLE.projectId]: {
    trackedIn: CONSOLE.trackedInFieldId,
  },
  [ENGINEERING.projectId]: {
    trackedIn: ENGINEERING.trackedInFieldId,
  },
  [SRE.projectId]: {
    trackedIn: SRE.trackedInFieldId,
  },
  [AUTOSCALING.projectId]: {
    trackedIn: AUTOSCALING.trackedInFieldId,
  },
  [CONTROL_PLANE.projectId]: {
    trackedIn: CONTROL_PLANE.trackedInFieldId,
  },
  [DATA.projectId]: {
    trackedIn: DATA.trackedInFieldId,
  },
  [COMPUTE.projectId]: {
    trackedIn: COMPUTE.trackedInFieldId,
  },
  [STORAGE.projectId]: {
    trackedIn: STORAGE.trackedInFieldId,
  },
  [PROXY.projectId]: {
    trackedIn: PROXY.trackedInFieldId,
  },
  [DOCS.projectId]: {
    trackedIn: DOCS.trackedInFieldId,
  },
  [POSTGRES.projectId]: {
    trackedIn: POSTGRES.trackedInFieldId,
  },
  [PRODUCT.projectId]: {
    trackedIn: PRODUCT.trackedInFieldId,
  },
  [PIXEL_POINT.projectId]: {
    trackedIn: PIXEL_POINT.trackedInFieldId,
  },
  [IDENTITY.projectId]: {
    trackedIn: IDENTITY.trackedInFieldId,
  },
  [DBAAS.projectId]: {
    trackedIn: DBAAS.trackedInFieldId,
  },
  [SUPPORT_TOOLS.projectId]: {
    trackedIn: SUPPORT_TOOLS.trackedInFieldId,
  },
  [WORKFLOW.projectId]: {
    trackedIn: WORKFLOW.trackedInFieldId,
  },
  [BILLING.projectId]: {
    trackedIn: BILLING.trackedInFieldId,
  },
  [BAAS.projectId]: {
    trackedIn: BAAS.trackedInFieldId,
  },
  [QA.projectId]: {
    trackedIn: QA.trackedInFieldId,
  },
  [AZURE.projectId]: {
    trackedIn: AZURE.trackedInFieldId,
  },
  [FE_INFRA.projectId]: {
    trackedIn: FE_INFRA.trackedInFieldId,
  },
}

const updateTrackedInIfPossible = async (kit: Octokit, projectId: string, issue: Issue) => {
  const trackedInFieldId = FIELD_IDS_BY_PROJECT_ID[projectId].trackedIn;
  if (trackedInFieldId) {
    const trackedInValue = await issue.trackedIn(kit, projectId);
    logger("info", "update tracked in field for:", issue.title);
    logger("info", "update tracked in field value:", trackedInValue);
    await issue.setFieldValue(kit, projectId, trackedInFieldId, trackedInValue);
  }
}

export const engineering_projects_manager_listener = (app: Probot) => {
  app.on(["issues.edited"], async (context) => {
    if (![
      "cloud",
      "neon",
    ].includes(context.payload.repository.name)) {
      return;
    }

    try {

      let issue = await Issue.load(context.octokit, context.payload.issue.node_id);

      const children = await issue.getChildrenIssues(context.octokit);
      for (const childIssue of children) {
        for (const childProjectId in childIssue.connectedProjectItems) {
          await updateTrackedInIfPossible(context.octokit, childProjectId, childIssue);
        }
      }
    } catch(e) {
      logger("error", e);
    }
  });

  app.on(["projects_v2_item.created"], async (context) => {
    // we use this event instead issue.edited because in this event we will get the project_node_id
    if (!context.payload.projects_v2_item.project_node_id || !(Object.keys(FIELD_IDS_BY_PROJECT_ID))
      .includes(context.payload.projects_v2_item.project_node_id)) {
      return;
    }

    const projectId =  context.payload.projects_v2_item.project_node_id;

    try {

      let issue = await Issue.load(context.octokit, context.payload.projects_v2_item.content_node_id);

      await updateTrackedInIfPossible(context.octokit, projectId, issue);

      const children = await issue.getChildrenIssues(context.octokit);
      for (const childIssue of children) {
        await updateTrackedInIfPossible(context.octokit, projectId, childIssue);
      }
    } catch(e) {
      logger("error", e);
    }
  });

  // the code below is for running manually triggered syncs locally:
  //
  // 1. uncomment the code below and comment our code above, leave only this listener in the webhooks.js
  // 2. create a temp field in the project where you want to update Tracked in field
  // 3. build & run the bot
  // 4. bulk update the temp field in the project
  // 5. wait for the bot to update the Tracked in field
  // 6. stop the bot
  // 7. delete the temp field
  // 8. Enjoy!
  //
  // app.on(["projects_v2_item.edited"], async (context) => {
  //   // we use this event instead issue.edited because in this event we will get the project_node_id
  //   if (!(Object.keys(FIELD_IDS_BY_PROJECT_ID))
  //     .includes(context.payload.projects_v2_item.project_node_id)
  //   ) {
  //     return;
  //   }
  //
  //   if ((context.payload.changes.field_value.field_node_id === FIELD_IDS_BY_PROJECT_ID[context.payload.projects_v2_item.project_node_id].trackedIn)) {
  //     logger('info', 'skip because the tracked in value was changed')
  //   }
  //
  //   const projectId =  context.payload.projects_v2_item.project_node_id;
  //
  //   try {
  //
  //     let issue = await Issue.load(context.octokit, context.payload.projects_v2_item.content_node_id);
  //
  //     await updateTrackedInIfPossible(context.octokit, projectId, issue);
  //
  //     const children = await issue.getChildrenIssues(context.octokit);
  //     for (const childIssue of children) {
  //       await updateTrackedInIfPossible(context.octokit, projectId, childIssue);
  //     }
  //   } catch(e) {
  //     logger("error", e);
  //   }
  // });
}