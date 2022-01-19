import { Probot } from "probot";
import { Issue } from "./issue";
import { deployFailedTemplate,
  deploySucceedTemplate,
  pushToMainTemplate,
  webhook
} from "./discord_helpers";

// webhooks entry point to the probot app
export = (app: Probot) => {
  app.on(["issues.opened", "issues.edited"], async (context) => {
    // console.log("issues.opened: ", context.payload);

    // add issue to project and set few fields
    let issue = await Issue.load(context.octokit, context.payload.issue.node_id);
    await issue.addToTheProject(context.octokit);
  });

  app.on("workflow_run", async (context) => {
    // console.log("workflow_run: ", context.payload);

    const workflow_run = context.payload.workflow_run;
    if (context.payload.action === 'completed' && workflow_run) {
      let content = "";
      switch (workflow_run.node_id) {
        // deploy to staging
        case 'WFR_kwLOFWwrAc5mOfYU':
          switch (workflow_run.conclusion) {
            case "success":
              content = deploySucceedTemplate(workflow_run);
              break;
            case "failure":
              content = deployFailedTemplate(workflow_run);
              break;
          }
          break;
        default:
          break;
      }

      if (content) {
        await webhook.send({
          content,
        });
      }
    }
  });

  app.on(['push'], async (context) => {
    // console.log("push: ", context.payload);

    if (context.payload.ref === 'refs/heads/main') {
      await webhook.send({
        content: pushToMainTemplate(context.payload),
      });
    }
  })

  //
  // we can also:
  // * send notifications on commit/pr/issue/etc
  // * intercept comments and run custom actions (e.g. run perf tests), see also
  //   probot-commands package
  //
};
