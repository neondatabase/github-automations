import {bold, codeBlock, hideLinkEmbed} from '@discordjs/builders'
import Discord, {MessageEmbed} from "discord.js";
import {CirceCiJobs} from "./circleci";

if (!process.env.DISCORD_WEBHOOK_URL) {
  console.log("No DISCORD_WEBHOOK_URL found in environment variables. It means no notifications.");
}

export const webhook = new Discord.WebhookClient({
  url: process.env.DISCORD_WEBHOOK_URL || '',
});

const COMMIT_MESSAGE_LIMIT = 1600;

enum ResultIcons {
  Success = ":thumbsup:",
  Failed = ":no_entry_sign:",
  Cancelled = ":person_gesturing_no:",
  TimedOut = ":clock10:",
}

const getShortCommitMessage = (commit: { message: string }) => {
  return commit.message.length > COMMIT_MESSAGE_LIMIT ? commit.message.substring(0, COMMIT_MESSAGE_LIMIT) + '...' : commit.message;
};

const formatCommit = (commit: { message: string, author: {name: string}, id: string }) => {
  return `${commit.id.substring(0,8)} - ${commit.author.name}:\n\n${getShortCommitMessage(commit)}`;
};

const getCommitEmbeds = (
  workflow_run: any
) => {
  const {head_commit: commit, repository: repo} = workflow_run;

  const [title, ...changes] = (
    commit.message.length > COMMIT_MESSAGE_LIMIT ?
      commit.message.substring(0, COMMIT_MESSAGE_LIMIT) + '...' :
      commit.message
  ).split('\n');

  const commitEmbed = new MessageEmbed()
    .setAuthor({name: `${commit.author.name} <${commit.author.email}>`})
    .setTitle(`${commit.id.substring(0, 8)} - ${title}`)
    .setDescription(changes.join('\n'))
    .setURL(`https://github.com/${repo.full_name}/commit/${commit.id}`);

  return {
    embeds: [commitEmbed]
  }
}

export const getDeploymentEnv = (workflow_run: any) => {
  if (workflow_run.head_branch == process.env.CONSOLE_STAGING_BRANCH_NAME) {
    return "**[ STAGING CONSOLE ]**";
  }
  if (workflow_run.head_branch == process.env.CONSOLE_PRODUCTION_BRANCH_NAME) {
    return "**[ PRODUCTION CONSOLE ]**";
  }
  throw new Error("Unknown deployment workflow run id");
}

export const consoleDeploySucceedTemplate = (workflow_run: any) => {
  return {
    ...getCommitEmbeds(workflow_run),
    content: `${ResultIcons.Success}  ${getDeploymentEnv(workflow_run)} New console version has been successfully deployed.\n` +
      `Deploy number: ${workflow_run.run_number}. HEAD now is:\n`,
  }
}

export const consoleDeployFailedTemplate = (workflow_run: any) => {
  const link = hideLinkEmbed(workflow_run.html_url);

  return {
    ...getCommitEmbeds(workflow_run),
    content: `${ResultIcons.Failed}  ${getDeploymentEnv(workflow_run)} Deployment #${workflow_run.run_number} failed :(\n` +
    `Logs: ${link}\n`,
  }
}

export const consoleDeployTimedOutTemplate = (workflow_run: any) => {
  return {
    ...getCommitEmbeds(workflow_run),
    content: `${ResultIcons.TimedOut}  ${getDeploymentEnv(workflow_run)} Deployment #${workflow_run.run_number} timed out.`,
  }
}

export const consoleDeployCancelledTemplate = (workflow_run: any) => {
  return {
    ...getCommitEmbeds(workflow_run),
    content: `${ResultIcons.Cancelled}  ${getDeploymentEnv(workflow_run)} Deployment #${workflow_run.run_number} was cancelled.`,
  }
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

export const getZenithEnv = (jobName: CirceCiJobs) => {
  switch (jobName) {
    case CirceCiJobs.DeployProxyProduction:
      return "**[ PRODUCTION PROXY ]**";
    case CirceCiJobs.DeployProxyStaging:
      return "**[ STAGING PROXY ]**";
    case CirceCiJobs.DeployStaging:
      return "**[ STAGING ZENITH ]**";
    case CirceCiJobs.DeployProduction:
      return "**[ PRODUCTION ZENITH ]**";
  }

  throw new Error("Unknown job name");
}

export const getZenithDeploymentTemplate = ({
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
  let embeds = {};
  try {
    embeds = getCommitEmbeds({
      head_commit: {
        ...payload.commit.commit,
        id: payload.commit.sha,
      },
      repository: payload.repository
    })
  } catch(e) {
    console.log(e);
  }
  return {
    content: `${icon} ${getZenithEnv(jobName as CirceCiJobs)} Job **${jobName}** completed with status \`${payload.state}\`\n` +
      `Job details: ${hideLinkEmbed(payload.target_url)}\n` +
      `Commit details:\n`,
    ...embeds,
  }
}