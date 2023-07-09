import {Probot} from "probot";
import {Issue} from "../../shared/issue";
import {
  AUTOSCALING, COMPUTE,
  CONSOLE,
  CONTROL_PLANE, DATA, DOCS,
  ENGINEERING, INFRA, POSTGRES,
  PRODUCT_DESIGN
} from "../../shared/project_ids";
import {Octokit} from "@octokit/core";

const FIELD_IDS_BY_PROJECT_ID = {
  [CONSOLE.projectId]: {
    trackedIn: CONSOLE.trackedInFieldId,
    progress: CONSOLE.progressFieldId,
  },
  [ENGINEERING.projectId]: {
    trackedIn: ENGINEERING.trackedInFieldId,
    progress: ENGINEERING.progressFieldId,
  },
  [AUTOSCALING.projectId]: {
    trackedIn: AUTOSCALING.trackedInFieldId,
  },
  [PRODUCT_DESIGN.projectId]: {
    trackedIn: PRODUCT_DESIGN.trackedInFieldId,
  },
  [CONTROL_PLANE.projectId]: {
    trackedIn: CONTROL_PLANE.trackedInFieldId,
  },
  [INFRA.projectId]: {
    trackedIn: INFRA.trackedInFieldId,
  },
  [DATA.projectId]: {
    trackedIn: DATA.trackedInFieldId,
  },
  [COMPUTE.projectId]: {
    trackedIn: COMPUTE.trackedInFieldId,
  },
  [DOCS.projectId]: {
    trackedIn: DOCS.trackedInFieldId,
  },
  [POSTGRES.projectId]: {
    trackedIn: POSTGRES.trackedInFieldId,
  },
}

const updateTrackedInIfPossible = async (kit: Octokit, projectId: string, issue: Issue) => {
  const trackedInFieldId = FIELD_IDS_BY_PROJECT_ID[projectId].trackedIn;
  if (trackedInFieldId) {
    const trackedInValue = await issue.trackedIn(kit, projectId);
    await issue.setFieldValue(kit, projectId, trackedInFieldId, trackedInValue);
  }
}

const updateProgressIfPossible = async (kit: Octokit, projectId: string, issue: Issue) => {
  const fieldId = FIELD_IDS_BY_PROJECT_ID[projectId].progress;
  if (fieldId) {
    await issue.setFieldValue(kit, projectId, fieldId, issue.progress());
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

    let issue = await Issue.load(context.octokit, context.payload.issue.node_id);
    for (const projectId in issue.connectedProjectItems) {
      await updateProgressIfPossible(context.octokit, projectId, issue);
    }

    const children = await issue.getChildrenIssues(context.octokit);
    for (const childIssue of children) {
      for (const childProjectId in childIssue.connectedProjectItems) {
        await updateTrackedInIfPossible(context.octokit, childProjectId, childIssue);
      }
    }
  });

  app.on(["projects_v2_item.created"], async (context) => {
    // we use this event instead issue.edited because in this event we will get the project_node_id
    if (!(Object.keys(FIELD_IDS_BY_PROJECT_ID))
      .includes(context.payload.projects_v2_item.project_node_id)) {
      return;
    }

    const projectId =  context.payload.projects_v2_item.project_node_id;

    let issue = await Issue.load(context.octokit, context.payload.projects_v2_item.content_node_id);

    await updateTrackedInIfPossible(context.octokit, projectId, issue);
    await updateProgressIfPossible(context.octokit, projectId, issue);

    const children = await issue.getChildrenIssues(context.octokit);
    for (const childIssue of children) {
      await updateTrackedInIfPossible(context.octokit, projectId, childIssue);
    }
  });
}