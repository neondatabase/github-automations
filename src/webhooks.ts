import { Probot } from "probot";

import * as l from "./modules";

// webhooks entry point to the probot app
export = (app: Probot) => {
  l.sync_roadmap_ship_target_with_subtasks_listener(app);
  l.engineering_projects_manager_listener(app);
  l.pull_request_label_change_listener(app);
  l.workflow_notifications_listener(app);
  l.status_last_updated_handler(app);

  //
  // we can also:
  // * send notifications on commit/pr/issue/etc
  // * intercept comments and run custom actions (e.g. run perf tests), see also
  //   probot-commands package
  //
};
