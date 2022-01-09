import { Probot } from "probot";
import { Issue } from "./issue";

// webhooks entry point to the probot app
export = (app: Probot) => {

  app.on(["issues.opened", "issues.edited"], async (context) => {
    console.log("issues.opened: ", context.payload);

    // add issue to project and set few fields
    let issue = await Issue.load(context.octokit, context.payload.issue.node_id);
    await issue.addToTheProject(context.octokit);
  });

  //
  // we can also:
  // * send notifications on commit/pr/issue/etc
  // * intercept comments and run custom actions (e.g. run perf tests), see also
  //   probot-commands package
  //
};
