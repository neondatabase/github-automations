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
import {
  PRLabeledHandler,
  PRMergedOrClosedHandler, PROpenedHandler,
  PRUnLabeledHandler
} from "./deploy_preview_label_handler";
import {
  // CONSOLE, ENGINEERING,
  NEON_PRIVATE_ROADMAP,
} from "./project_ids";
import {syncRoadmapTargetFieldsWithEngProjects} from "./sync_roadmap_changes_with_eng_projects";

// webhooks entry point to the probot app
export = (app: Probot) => {
  const CONSOLE_DEPLOY_WORKFLOW_ID = parseInt(process.env.CONSOLE_DEPLOY_WORKFLOW_ID || '');
  const NEON_DEPLOY_WORKFLOW_ID = parseInt(process.env.NEON_DEPLOY_WORKFLOW_ID || '');

  const milestoneQueue = new Queue(1);
  const notificationsQueue = new Queue(1);

  app.on(["projects_v2_item.edited"], async (context) => {
    console.log("context: ", context);
    // we only update fields on edited because when projectItem is created it has no fields, so nothing to update
    if (context.payload.projects_v2_item.project_node_id === NEON_PRIVATE_ROADMAP.projectId) {
      // populate target ship Month and quarter for subtasks from engineering and console projects
      await syncRoadmapTargetFieldsWithEngProjects(context);
    }
  });

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

  app.on("pull_request.labeled", async (context) => {
    PRLabeledHandler(context)
  });

  app.on("pull_request.opened", async (context) => {
    PROpenedHandler(context)
  });

  app.on(["pull_request.closed"], async (context) => {
    PRMergedOrClosedHandler(context)
  });

  app.on(["pull_request.unlabeled"], async (context) => {
    PRUnLabeledHandler(context)
  });

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
