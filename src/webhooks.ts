import { Probot } from "probot";
import { Issue } from "./issue";
// import {
//   createWebhook,
//   debugTemplate,
//   pushToMainTemplate,
// } from "./discord_helpers";

// webhooks entry point to the probot app
export = (app: Probot) => {
  app.on(["issues.opened", "issues.edited"], async (context) => {
    console.log("issues.opened: ", context.payload);

    // add issue to project and set few fields
    let issue = await Issue.load(context.octokit, context.payload.issue.node_id);
    await issue.addToTheProject(context.octokit);
  });

  app.on(["issues.milestoned", "issues.demilestoned"], async (context) => {
    console.log("issue milestone changed: ", context.payload);

    // github events `issue.milestoned` and `issue.demilestoned` contains
    // field `payload.milestone`, but for some reason typings doesn't have it
    // @ts-ignore
    const prevMilestone = context.payload.milestone;

    let issue = await Issue.load(context.octokit, context.payload.issue.node_id);
    await issue.syncChildrenMilestone(context.octokit, prevMilestone ? {
      id: prevMilestone.id,
      node_id: prevMilestone.node_id,
      dueOn: prevMilestone.due_on,
      number: prevMilestone.number,
      title: prevMilestone.title,
    } : undefined);
  });

  // app.on("workflow_run", async (context) => {
  //   // this function handles deploys from github actions, for now it's only the console repo
  //   // if (context.payload.repository.name !== 'console') {
  //   //   return;
  //   // }
  //
  //   await webhook.send(debugTemplate(context.payload));
  //
  //   // const workflow_run = context.payload.workflow_run;
  //   // if (context.payload.action === 'completed' && workflow_run) {
  //   //   let content = "";
  //   //   switch (workflow_run.node_id) {
  //   //     // deploy to staging
  //   //     case 'WFR_kwLOFWwrAc5mOfYU':
  //   //       switch (workflow_run.conclusion) {
  //   //         case "success":
  //   //           content = deploySucceedTemplate(workflow_run);
  //   //           break;
  //   //         case "failure":
  //   //           content = deployFailedTemplate(workflow_run);
  //   //           break;
  //   //       }
  //   //       break;
  //   //     default:
  //   //       break;
  //   //   }
  //   //
  //   //   if (content) {
  //   //     await webhook.send({
  //   //       content,
  //   //     });
  //   //   }
  //   // }
  // });
  //
  // app.on(['push'], async (context) => {
  //   // we don't need to deploy our rfcs so just listen to push to main
  //   // if (context.payload.repository.name !== "rfcs") {
  //   //   return;
  //   // }
  //
  //   console.log("push: ", context.payload);
  //
  //   if (context.payload.ref === 'refs/heads/main') {
  //     await webhook.send({
  //       content: pushToMainTemplate(context.payload),
  //     });
  //   }
  // });
  //
  // app.on(["status"], async (context) => {
  //   // this function handles deploys from circleci, for now it's only for zenith repo
  //   // if (context.payload.repository.name !== "zenith") {
  //   //   return;
  //   // }
  //   await webhook.send(debugTemplate(context.payload));
  //
  //
  //   // console.log("status: ", context.payload);
  // })

  //
  // we can also:
  // * send notifications on commit/pr/issue/etc
  // * intercept comments and run custom actions (e.g. run perf tests), see also
  //   probot-commands package
  //
};
