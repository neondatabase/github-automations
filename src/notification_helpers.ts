import {Block, ChatPostMessageArguments, KnownBlock, WebClient} from "@slack/web-api";
import {logger} from "./shared/logger";

export type MessageContent = Omit<ChatPostMessageArguments, 'channel'>;
type TemplateFunc = (args: any) => MessageContent | undefined;

const slackClient = new WebClient(process.env.SLACK_TOKEN || '');

const isConsoleRepo = (workflow_run: any) => (workflow_run.repository.name === 'cloud')
const isNeonRepo = (workflow_run: any) => (workflow_run.repository.name === 'neon')

export const getEnvChannelName = (workflow_run: { head_branch?: string }) => {
  if (isConsoleRepo(workflow_run)) {
    if (workflow_run.head_branch === process.env.CONSOLE_PRODUCTION_BRANCH_NAME) {
      return process.env.SLACK_DEPLOY_NOTIFICATIONS_CHANNEL_PRODUCTION
    }

    if (workflow_run.head_branch === process.env.CONSOLE_STAGING_BRANCH_NAME) {
      return process.env.SLACK_DEPLOY_NOTIFICATIONS_CHANNEL
    }
  } else if (isNeonRepo(workflow_run)) {
    if (workflow_run.head_branch == process.env.NEON_STAGING_BRANCH_NAME) {
      return process.env.SLACK_DEPLOY_NOTIFICATIONS_CHANNEL
    }
    if (workflow_run.head_branch == process.env.NEON_PRODUCTION_BRANCH_NAME) {
      return process.env.SLACK_DEPLOY_NOTIFICATIONS_CHANNEL_PRODUCTION

    }
  }
  return;
}

export const sendDeployNotification = async (data: MessageContent, channelName?: string) => {
  if (!channelName) {
    logger("info", "Unknown chat name");
    return
  }

  try {
    const result = await slackClient.chat.postMessage({
      ...data,
      channel: channelName,
    });
    logger("info", 'Chat message request completed:', result);
  } catch (e) {
    logger("info", "failed to send notification message")
    console.error(e);
  }
}

const COMMIT_MESSAGE_LIMIT = 1600;

enum ResultIcons {
  Success = ":+1:",
  Failed = ":no_entry_sign:",
  Cancelled = ":woman-gesturing-no:",
  TimedOut = ":clock10:",
}

// const getShortCommitMessage = (commit: { message: string }) => {
//   return commit.message.length > COMMIT_MESSAGE_LIMIT ? commit.message.substring(0, COMMIT_MESSAGE_LIMIT) + '...' : commit.message;
// };

// const formatCommit = (commit: { message: string, author: {name: string}, id: string }) => {
//   return `${commit.id.substring(0,8)} - ${commit.author.name}:\n\n${getShortCommitMessage(commit)}`;
// };

const getCommitEmbeds: (w: any) => Block|KnownBlock = (
  workflow_run: any
) => {
  const {head_commit: commit, repository: repo} = workflow_run;

  const [title, ...changes] = (
    commit.message.length > COMMIT_MESSAGE_LIMIT ?
      commit.message.substring(0, COMMIT_MESSAGE_LIMIT) + '...' :
      commit.message
  ).split('\n');

  let result = `>>>*${commit.author.name} <${commit.author.email}>*\n`;
  result = result + `<https://github.com/${repo.full_name}/commit/${commit.id}|${commit.id.substring(0, 8)} - ${title}>\n`;
  result = result + `${changes.join('\n')}`;

  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: result,
    }
  };
}

const getWorkflowEnv = (workflow_run: any) => {
  if (isConsoleRepo(workflow_run)) {
    if (workflow_run.head_branch == process.env.CONSOLE_STAGING_BRANCH_NAME) {
      return "*[ STAGING CONSOLE ]*";
    }
    if (workflow_run.head_branch == process.env.CONSOLE_PRODUCTION_BRANCH_NAME) {
      return "*[ PRODUCTION CONSOLE ]*";
    }
  } else if (isNeonRepo(workflow_run)) {
    if (workflow_run.head_branch == process.env.NEON_STAGING_BRANCH_NAME) {
      return "*[ STAGING NEON ]*";
    }
    if (workflow_run.head_branch == process.env.NEON_PRODUCTION_BRANCH_NAME) {
      return "*[ PRODUCTION NEON ]*";
    }
  }
  throw new Error("Unknown workflow run id");
}

export const workflowSucceedTemplate: TemplateFunc = (workflow_run: any) => {
  let component = 'console';
  if (isNeonRepo(workflow_run)) {
    component = 'storage'
  }

  const header = `New ${component} commit has been successfully merged.`

  return {
    text: header,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${ResultIcons.Success}  ${getWorkflowEnv(workflow_run)} ${header}\n` +
            `Deploy number: ${workflow_run.run_number}.\n` +
            `HEAD now is: \n`,
        }
      },
      getCommitEmbeds(workflow_run),
    ]
  };
}

export const workflowFailedTemplate: TemplateFunc = (workflow_run: any) => {
  const header = `Workflow #${workflow_run.run_number} failed`

  return {
    text: header,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${ResultIcons.Failed}  ${getWorkflowEnv(workflow_run)} ${header} :(\n` +
            `Logs: <${workflow_run.html_url}|view on github>\n` +
            `Commit details:`,
        }
      },
      getCommitEmbeds(workflow_run),
    ]
  };
}

export const workflowTimedOutTemplate: TemplateFunc = (workflow_run: any) => {
  const header = `Workflow #${workflow_run.run_number} timed out.`;
  return {
    text: header,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${ResultIcons.TimedOut}  ${getWorkflowEnv(workflow_run)} ${header}`,
        }
      },
      getCommitEmbeds(workflow_run),
   ]
  };
}

export const workflowCancelledTemplate: TemplateFunc = (workflow_run: any) => {
  const header = `Workflow #${workflow_run.run_number} was cancelled.`;

  return {
    text: header,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${ResultIcons.Cancelled}  ${getWorkflowEnv(workflow_run)} ${header}`,
        }
      },
      getCommitEmbeds(workflow_run),
    ]
  };
}
