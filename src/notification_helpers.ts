import {bold, codeBlock, hideLinkEmbed} from '@discordjs/builders'
import {CirceCiJobs} from "./circleci";
import {Block,KnownBlock, WebClient} from "@slack/web-api";

const slackClient = new WebClient(process.env.SLACK_TOKEN || '');
export const sendDeployNotification = async (blocks?: (Block|KnownBlock)[]) => {
  await slackClient.chat.postMessage({
    channel: process.env.SLACK_DEPLOY_NOTIFICATIONS_CHANNEL || '',
    text: '',
    blocks,
  });
}

const COMMIT_MESSAGE_LIMIT = 1600;

enum ResultIcons {
  Success = ":+1:",
  Failed = ":no_entry_sign:",
  Cancelled = ":woman-gesturing-no:",
  TimedOut = ":clock10:",
}

const getShortCommitMessage = (commit: { message: string }) => {
  return commit.message.length > COMMIT_MESSAGE_LIMIT ? commit.message.substring(0, COMMIT_MESSAGE_LIMIT) + '...' : commit.message;
};

const formatCommit = (commit: { message: string, author: {name: string}, id: string }) => {
  return `${commit.id.substring(0,8)} - ${commit.author.name}:\n\n${getShortCommitMessage(commit)}`;
};

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

export const getDeploymentEnv = (workflow_run: any) => {
  if (workflow_run.head_branch == process.env.CONSOLE_STAGING_BRANCH_NAME) {
    return "*[ STAGING CONSOLE ]*";
  }
  if (workflow_run.head_branch == process.env.CONSOLE_PRODUCTION_BRANCH_NAME) {
    return "*[ PRODUCTION CONSOLE ]*";
  }
  throw new Error("Unknown deployment workflow run id");
}

export const consoleDeploySucceedTemplate = (workflow_run: any) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${ResultIcons.Success}  ${getDeploymentEnv(workflow_run)} New console version has been successfully deployed.\n` +
          `Deploy number: ${workflow_run.run_number}.\n` +
          `HEAD now is: \n`,
      }
    },
    getCommitEmbeds(workflow_run),
  ];
}

export const consoleDeployFailedTemplate = (workflow_run: any) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${ResultIcons.Failed}  ${getDeploymentEnv(workflow_run)} Deployment #${workflow_run.run_number} failed :(\n` +
          `Logs: <${workflow_run.html_url}|view on github>\n` +
          `Commit details:`,
      }
    },
    getCommitEmbeds(workflow_run),
  ];
}

export const consoleDeployTimedOutTemplate = (workflow_run: any) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${ResultIcons.TimedOut}  ${getDeploymentEnv(workflow_run)} Deployment #${workflow_run.run_number} timed out.`,
      }
    },
    getCommitEmbeds(workflow_run),
  ];
}

export const consoleDeployCancelledTemplate = (workflow_run: any) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${ResultIcons.Cancelled}  ${getDeploymentEnv(workflow_run)} Deployment #${workflow_run.run_number} was cancelled.`,
      }
    },
    getCommitEmbeds(workflow_run),
  ];
}

export const pushToMainTemplate = (pushEventData: {
  repository: {
    full_name: string
  },
  compare: string,
  commits: Array<{
    id: string,
    message: string,
    author: {
      name: string
    }
  }>
}) => {
  const link = hideLinkEmbed(pushEventData.compare);

  return `Push to ${bold(pushEventData.repository.full_name + '/main')}!\n` +
      `${codeBlock(pushEventData.commits.map(formatCommit).join('\n'))}` +
      `\nDiff: ${link}`;
}

export const getEnv = (jobName: CirceCiJobs) => {
  switch (jobName) {
    case CirceCiJobs.DeployProxyProduction:
      return "*[ PRODUCTION PROXY ]*";
    case CirceCiJobs.DeployProxyStaging:
      return "*[ STAGING PROXY ]*";
    case CirceCiJobs.DeployStaging:
      return "*[ STAGING NEON ]*";
    case CirceCiJobs.DeployProduction:
      return "*[ PRODUCTION NEON ]*";
  }

  throw new Error("Unknown job name");
}

export const getDeploymentTemplate = ({
  jobName,
  payload
}: {
  jobName: string,
  payload: any,
}) => {
  if (!Object.values(CirceCiJobs).includes(jobName as CirceCiJobs) || !payload.target_url) {
    return
  }

  let icon;
  switch (payload.state) {
    case 'success':
      icon = ResultIcons.Success;
      break;
    case 'failure':
    case 'error':
      icon = ResultIcons.Failed;
      break;
  }

  const result: (Block|KnownBlock)[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${icon} ${getEnv(jobName as CirceCiJobs)} Job *${jobName}* completed with status \`${payload.state}\`\n` +
          `Job details: <${payload.target_url}|CircleCI>\n` +
          `Commit details:`,
      }
    },
  ];

  try {
    const embeds = getCommitEmbeds({
      head_commit: {
        ...payload.commit.commit,
        id: payload.commit.sha,
      },
      repository: payload.repository
    });
    result.push(embeds);
  } catch(e) {
    console.log(e);
  }

  return result;
}
