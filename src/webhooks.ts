import { Probot } from "probot";
import { Issue } from "./issue";
import {
  deployFailedTemplate,
  deploySucceedTemplate,
  deployTimedOutTemplate,
  deployCancelledTemplate,
  sendDeployNotification, MessageContent, getEnvChannelName
} from "./notification_helpers";
import Queue from "async-await-queue";
import {sleep} from "./utils";

import * as listeners from "./modules";

// webhooks entry point to the probot app
export = (app: Probot) => {
  const CONSOLE_DEPLOY_WORKFLOW_ID = parseInt(process.env.CONSOLE_DEPLOY_WORKFLOW_ID || '');
  const NEON_DEPLOY_WORKFLOW_ID = parseInt(process.env.NEON_DEPLOY_WORKFLOW_ID || '');

  const milestoneQueue = new Queue(1);
  const notificationsQueue = new Queue(1);

  listeners.sync_roadmap_ship_target_with_subtasks_listener(app);

  app.on(["issues.opened", "issues.edited"], async (context) => {
    // console.log("issues.opened: ", context.payload);

    // add issue to project and set few fields
    let issue = await Issue.load(context.octokit, context.payload.issue.node_id);
    await issue.addToTheProject(context.octokit);
    await issue.addChildrenToTheProject(context.octokit)
  });
  //
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
        prevMilestone = context.payload.milestone;
      } else if (context.payload.action === "milestoned") {
        nextMilestone = context.payload.milestone;
      } else {
        return;
      }

      let issue = await Issue.load(context.octokit, context.payload.issue.node_id);
      await issue.syncChildrenMilestone(context.octokit, prevMilestone, nextMilestone);
    });
  });

  listeners.pull_request_label_change_listener(app);

  app.on(["workflow_run"], async (context) => {
    const workflow_run = context.payload.workflow_run;

    if (
      context.payload.action === 'completed'
      && context.payload.sender.login !== 'vipvap'
      && workflow_run
      && [
        process.env.CONSOLE_PRODUCTION_BRANCH_NAME,
        process.env.CONSOLE_STAGING_BRANCH_NAME,
        process.env.NEON_STAGING_BRANCH_NAME,
        process.env.NEON_PRODUCTION_BRANCH_NAME,
      ].includes(workflow_run.head_branch)
      && workflow_run.event === 'push'
    ) {
      notificationsQueue.run(async () => {
        try {
          console.log("workflow_run: ", context.id);
          console.log(context.payload)

          let msg: MessageContent | undefined;
          switch (workflow_run.workflow_id) {
            // deploy to staging
            case CONSOLE_DEPLOY_WORKFLOW_ID:
            case NEON_DEPLOY_WORKFLOW_ID:
              switch (workflow_run.conclusion) {
                case "success":
                  msg = deploySucceedTemplate(workflow_run);
                  break;
                case "failure":
                  msg = deployFailedTemplate(workflow_run);
                  break;
                case "cancelled":
                  msg = deployCancelledTemplate(workflow_run);
                  break;
                case "timed_out":
                  msg = deployTimedOutTemplate(workflow_run);
                  break;
              }
              break;
            default:
              break;
          }

          if (msg) {
            await sendDeployNotification(msg, getEnvChannelName(workflow_run));
          }
        } catch(e) {
          console.log('failed')
          console.log(e);
        }
      });
    }

  });

  //
  // we can also:
  // * send notifications on commit/pr/issue/etc
  // * intercept comments and run custom actions (e.g. run perf tests), see also
  //   probot-commands package
  //
};
