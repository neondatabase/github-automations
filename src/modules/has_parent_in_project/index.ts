import {Probot} from "probot";
import {
  sub_issues_parent_issue_added_listener,
  sub_issues_parent_issue_removed_listener
} from "./sub_issues_event_listeners";
import {item_added_restored_deleted_listener} from "./project_v2_item_event_listeners";

export const has_parent_in_project_listener = (app: Probot) => {
  app.on(["sub_issues.parent_issue_added"], sub_issues_parent_issue_added_listener);
  app.on(["sub_issues.parent_issue_removed"], sub_issues_parent_issue_removed_listener);
  app.on(["projects_v2_item.deleted", "projects_v2_item.created", "projects_v2_item.restored", "projects_v2_item.archived"], item_added_restored_deleted_listener);
}