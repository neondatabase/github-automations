import {Probot} from "probot";
import {Issue} from "../../shared/issue";

export const engineering_projects_manager_listener = (app: Probot) => {
  app.on(["issues.opened", "issues.edited"], async (context) => {
    // console.log("issues.opened: ", context.payload);

    // add issue to project and set few fields
    let issue = await Issue.load(context.octokit, context.payload.issue.node_id);
    await issue.addToTheProject(context.octokit);
    await issue.addChildrenToTheProject(context.octokit)
  });
}