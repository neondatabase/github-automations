import {bold, codeBlock, hideLinkEmbed} from '@discordjs/builders'
import Discord, {MessageEmbed} from "discord.js";

if (!process.env.DISCORD_WEBHOOK_URL) {
  console.log("No DISCORD_WEBHOOK_URL found in environment variables. It means no notifications.");
}

export const webhook = new Discord.WebhookClient({
  url: process.env.DISCORD_WEBHOOK_URL || '',
});

const COMMIT_MESSAGE_LIMIT = 1600;

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

  const [title, ...changes] = commit.message.split('\n');
  let changesStr = changes.join('\n');
  if (changesStr.length > COMMIT_MESSAGE_LIMIT) {
    changesStr = changesStr.substring(0, COMMIT_MESSAGE_LIMIT) + '...';
  }

  const commitEmbed = new MessageEmbed()
    .setAuthor({name: `${commit.author.name} <${commit.author.email}>`})
    .setTitle(`${commit.id.substring(0, 8)} - ${title}`)
    .setDescription(changesStr)
    .setURL(`https://github.com/${repo.full_name}/commit/${commit.id}`);

  return {
    embeds: [commitEmbed]
  }
}

export const getDeploymentEnv = (workflow_run: any) => {
  if (workflow_run.workflow_id == process.env.CONSOLE_DEPLOY_TO_STAGING_WORKFLOW_ID) {
    return "**[ STAGING ]**";
  }
  if (workflow_run.workflow_id == process.env.CONSOLE_DEPLOY_TO_PRODUCTION_WORKFLOW_ID) {
    return "**[ PRODUCTION ]**";
  }
  throw new Error("Unknown deployment workflow run id");
}

export const consoleDeploySucceedTemplate = (workflow_run: any) => {
  return {
    ...getCommitEmbeds(workflow_run),
    content: `:thumbsup:  ${getDeploymentEnv(workflow_run)} New console version has been successfully deployed.\n` +
      `Deploy number: ${workflow_run.run_number}. HEAD now is:\n`,
  }
}

export const consoleDeployFailedTemplate = (workflow_run: any) => {
  const link = hideLinkEmbed(workflow_run.html_url);

  return {
    ...getCommitEmbeds(workflow_run),
    content: `:no_entry_sign:  ${getDeploymentEnv(workflow_run)} Deployment #${workflow_run.run_number} failed :(\n` +
    `Logs: ${link}\n`,
  }
}

export const consoleDeployTimedOutTemplate = (workflow_run: any) => {
  return {
    ...getCommitEmbeds(workflow_run),
    content: `:clock10:  ${getDeploymentEnv(workflow_run)} Deployment #${workflow_run.run_number} timed out.`,
  }
}

export const consoleDeployCancelledTemplate = (workflow_run: any) => {
  return {
    ...getCommitEmbeds(workflow_run),
    content: `:person_gesturing_no:  ${getDeploymentEnv(workflow_run)} Deployment #${workflow_run.run_number} was cancelled.`,
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
