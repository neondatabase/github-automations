import { Probot } from "probot";
import { Issue } from "./issue";
import {
  webhook,
  consoleDeployFailedTemplate,
  consoleDeploySucceedTemplate,
  consoleDeployTimedOutTemplate,
  consoleDeployCancelledTemplate,
  getZenithDeploymentTemplate,
} from "./discord_helpers";
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
      let msg;
      switch (workflow_run.workflow_id) {
        // deploy to staging
        case CONSOLE_DEPLOY_TO_STAGING_WORKFLOW_ID:
        case CONSOLE_DEPLOY_TO_PRODUCTION_WORKFLOW_ID:
          switch (workflow_run.conclusion) {
            case "success":
              msg = consoleDeploySucceedTemplate(workflow_run);
              break;
            case "failure":
              msg = consoleDeployFailedTemplate(workflow_run);
              break;
            case "cancelled":
              msg = consoleDeployCancelledTemplate(workflow_run);
              break;
            case "timed_out":
              msg = consoleDeployTimedOutTemplate(workflow_run);
              break;
          }
          break;
        default:
          break;
      }

      if (msg) {
        await webhook.send(msg);
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
  app.on(["status"], async (context) => {
    // console.log("received status event", context.payload);
    // first we check it's zenithdb/zenith repo and main branch
    if (context.payload.repository.name !== "zenith"
      || !context.payload.branches.find((b) => b.name === "main")
      || context.payload.state === 'pending') {
      return;
    }

    const match = context.payload.context.match(/^ci\/circleci:\s(.*)$/);
    if (!match) {
      return;
    }
    const jobName = match[1];

    // we can fetch some data from CircleCI API
    // const circleCiMatch = (context.payload.target_url || '').match(/^https:\/\/circleci\.com\/(.*)\/(\d+)/);
    // if (!circleCiMatch) {
    //   return;
    // }
    // const [, slug, jobId] = circleCiMatch;

    // const {data: jobData} = await CircleCIClient.get(`/project/${slug}/job/${jobId}`);

    const template = getZenithDeploymentTemplate({
      jobName,
      payload: context.payload,
    });

    if (!template) {
      return;
    }

    try {
      await webhook.send(template)
    } catch(e) {
      console.log(e)
    }
  })

  //
  // we can also:
  // * send notifications on commit/pr/issue/etc
  // * intercept comments and run custom actions (e.g. run perf tests), see also
  //   probot-commands package
  //
};
