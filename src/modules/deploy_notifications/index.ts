import {Probot} from "probot";
import {
  workflowCancelledTemplate,
  workflowFailedTemplate,
  workflowSucceedTemplate, workflowTimedOutTemplate, getEnvChannelName,
  MessageContent, sendDeployNotification
} from "../../notification_helpers";
import Queue from "async-await-queue";
import {logger} from "../../shared/logger";

export const workflow_notifications_listener = (app: Probot) => {
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
          logger("info", "workflow_run: ", context.id);
          logger("info", context.payload)

          let msg: MessageContent | undefined;
          switch (workflow_run.workflow_id) {
            // workflow to staging
            case CONSOLE_DEPLOY_WORKFLOW_ID:
            case NEON_DEPLOY_WORKFLOW_ID:
              switch (workflow_run.conclusion) {
                case "success":
                  msg = workflowSucceedTemplate(workflow_run);
                  break;
                case "failure":
                  msg = workflowFailedTemplate(workflow_run);
                  break;
                case "cancelled":
                  msg = workflowCancelledTemplate(workflow_run);
                  break;
                case "timed_out":
                  msg = workflowTimedOutTemplate(workflow_run);
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
          logger("info", 'failed')
          logger("error", e);
        }
      });
    }

  });

}
