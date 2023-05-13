import {Probot} from "probot";
import {
  deployCancelledTemplate,
  deployFailedTemplate,
  deploySucceedTemplate, deployTimedOutTemplate, getEnvChannelName,
  MessageContent, sendDeployNotification
} from "../../notification_helpers";
import Queue from "async-await-queue";

export const deploy_notifications_listener = (app: Probot) => {
  const CONSOLE_DEPLOY_WORKFLOW_ID = parseInt(process.env.CONSOLE_DEPLOY_WORKFLOW_ID || '');
  const NEON_DEPLOY_WORKFLOW_ID = parseInt(process.env.NEON_DEPLOY_WORKFLOW_ID || '');

  const notificationsQueue = new Queue(1);

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

}