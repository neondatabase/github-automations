import Discord from 'discord.js';
import {bold, codeBlock, hideLinkEmbed} from '@discordjs/builders'


if (!process.env.DISCORD_WEBHOOK_URL) {
  console.error('DISCORD_WEBHOOK_URL is not set');
  process.exit(1);
}

export const webhook = new Discord.WebhookClient({
  url: process.env.DISCORD_WEBHOOK_URL,
});

const getShortCommitMessage = (commit: { message: string }) => {
  const parts = commit.message.split('\n');
  // const parts = commit.message.split('/\R/');
  return parts[0];
};

const formatCommit = (commit: { message: string, author: {name: string}, id: string }) => {
  return codeBlock(`${commit.id.substring(0,8)} - ${commit.author.name}: ${getShortCommitMessage(commit)}`);
};

export const deploySucceedTemplate = (workflow_run: any) => {
  return `New console version has been successfully deployed on staging\n` +
      `\n\nHEAD now is:\n` +
      formatCommit(workflow_run.head_commit);
}

export const deployFailedTemplate = (workflow_run: any) => {
  const link = hideLinkEmbed(workflow_run.html_url);

  return `Deploy to stage from ${bold(workflow_run.repository.name + '/' + workflow_run.head_branch)} failed :(\n\n` +
      formatCommit(workflow_run.head_commit) +
    `\n\nLogs: ${link}`;
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

  return `Push to ${bold(pushEventData.repository.full_name + '/main')}!\n\n` +
      `${pushEventData.commits.map(formatCommit).join('\n')}` +
      `\n\nDiff: ${link}`;
}

export const debugTemplate = (message: any) => {
  return `Debug info: ${codeBlock(message)}`;
}