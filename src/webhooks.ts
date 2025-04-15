import {Probot,} from "probot";

// import * as l from "./modules";
import { backfill_listener} from "./modules";

// webhooks entry point to the probot app
export = (app: Probot) => {
  // l.sync_roadmap_ship_target_with_subtasks_listener(app);
  // l.engineering_projects_manager_listener(app);
  // l.pull_request_label_change_listener(app);
  // l.workflow_notifications_listener(app);
  // l.status_last_updated_handler(app);
  // l.sync_team_label_with_project(app)
  // l.sync_fields_cross_projects(app);
  // l.sync_created_at(app);
  // l.sync_updated_at(app);
  // l.sync_closed_at(app)
  console.log(app);

  backfill_listener(app);
  // const octo = new ProbotOctokit();
  // backfill_created_updated_deleted(octo);

  //
  // we can also:
  // * send notifications on commit/pr/issue/etc
  // * intercept comments and run custom actions (e.g. run perf tests), see also
  //   probot-commands package
  //
};
