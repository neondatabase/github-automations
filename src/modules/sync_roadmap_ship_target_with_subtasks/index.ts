import {NEON_PRIVATE_ROADMAP} from "../../shared/project_ids";
import {
  handleRoadmapIssueChange,
  handleRoadmapProjectItemChange
} from "./sync_roadmap_changes_with_eng_projects";
import {Probot} from "probot";
import {logger} from "../../shared/logger";

export const sync_roadmap_ship_target_with_subtasks_listener = (app: Probot) => {
  app.on(["projects_v2_item.edited"], async (context) => {
    logger("info", "projects_v2_item.edited fired", context)
    // we only update fields on edited because when projectItem is created it has no fields, so nothing to update
    if (context.payload.projects_v2_item.project_node_id === NEON_PRIVATE_ROADMAP.projectId) {
      // populate target ship Month and quarter for subtasks from engineering and console projects
      await handleRoadmapProjectItemChange(context);
    }
  });

  app.on(["issues.edited"], async (context) => {
    logger("info", "issues.edited fired", context)
    if (context.payload.repository.name === "neon_roadmap") {
      // populate target ship Month and quarter for subtasks from engineering and console projects
      await handleRoadmapIssueChange(context);
    }
  })
};