import { Probot } from "probot";
import { Issue } from "./issue";
import {webhook, consoleDeployFailedTemplate, consoleDeploySucceedTemplate, getDeploymentEnv} from "./discord_helpers";
import Queue from "async-await-queue";
import {sleep} from "./utils";

// webhooks entry point to the probot app
export = (app: Probot) => {
  const CONSOLE_DEPLOY_TO_STAGING_WORKFLOW_ID = parseInt(process.env.CONSOLE_DEPLOY_TO_STAGING_WORKFLOW_ID || '');
  const CONSOLE_DEPLOY_TO_PRODUCTION_WORKFLOW_ID = parseInt(process.env.CONSOLE_DEPLOY_TO_PRODUCTION_WORKFLOW_ID || '');

  const milestoneQueue = new Queue(1);

  app.on(["issues.opened", "issues.edited"], async (context) => {
    console.log("issues.opened: ", context.payload);

    // add issue to project and set few fields
    let issue = await Issue.load(context.octokit, context.payload.issue.node_id);
    await issue.addToTheProject(context.octokit);
    await issue.addChildrenToTheProject(context.octokit)
  });

  app.on(["issues.demilestoned", "issues.milestoned"], async (context) => {
    console.log(`issue ${context.payload.issue.node_id} ${context.payload.action}`);

    // sometimese github would send event in wrong order
    // so we always process demilestoned beforeс milestoned
    // to avoid bugs when milestone is changed from one to another
    if (context.payload.action === 'milestoned') {
      // we wait before add the task to queue in case
      // it is a pair of events and milestoned came first
      await sleep(200);
    }

    milestoneQueue.run(async () => {

      let prevMilestone = null;
      let nextMilestone = null;

      if (context.payload.action === "demilestoned") {
        // github events `issue.milestoned` and `issue.demilestoned` contains
        // field `payload.milestone`, but for some reason typings doesn't have it
        // @ts-ignore
        prevMilestone = context.payload.milestone;
      } else if (context.payload.action === "milestoned") {
        // @ts-ignore
        nextMilestone = context.payload.milestone;
      } else {
        return;
      }

      let issue = await Issue.load(context.octokit, context.payload.issue.node_id);
      await issue.syncChildrenMilestone(context.octokit, prevMilestone ? {
        id: prevMilestone.id,
        node_id: prevMilestone.node_id,
        dueOn: prevMilestone.due_on,
        number: prevMilestone.number,
        title: prevMilestone.title,
      } : null, nextMilestone ? {
        id: nextMilestone.id,
        node_id: nextMilestone.node_id,
        dueOn: nextMilestone.due_on,
        number: nextMilestone.number,
        title: nextMilestone.title,
      } : null);
    });
  });

  app.on(["workflow_run"], async (context) => {
    console.log("workflow_run: ", context.payload);

    const workflow_run = context.payload.workflow_run;
    if (context.payload.action === 'completed' && workflow_run) {
      let content = "";
      switch (workflow_run.workflow_id) {
        // deploy to staging
        case CONSOLE_DEPLOY_TO_STAGING_WORKFLOW_ID:
        case CONSOLE_DEPLOY_TO_PRODUCTION_WORKFLOW_ID:
          switch (workflow_run.conclusion) {
            case "success":
              content = consoleDeploySucceedTemplate(workflow_run);
              break;
            case "failure":
              content = consoleDeployFailedTemplate(workflow_run);
              break;
            case "cancelled":
              content = `:person_gesturing_no:  ${getDeploymentEnv(workflow_run)} Deployment #${workflow_run.run_number} was cancelled.`;
              break;
            case "timed_out":
              content = `:clock10:  ${getDeploymentEnv(workflow_run)} Deployment #${workflow_run.run_number} timed out.`;
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
