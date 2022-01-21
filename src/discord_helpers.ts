import {bold, codeBlock, hideLinkEmbed} from '@discordjs/builders'
import Discord from "discord.js";

if (!process.env.DISCORD_WEBHOOK_URL) {
  console.log("No DISCORD_WEBHOOK_URL found in environment variables. It means no notifications.");
}

export const webhook = new Discord.WebhookClient({
  url: process.env.DISCORD_WEBHOOK_URL || '',
});


const getShortCommitMessage = (commit: { message: string }) => {
  const parts = commit.message.split('\n');
  // const parts = commit.message.split('/\R/');
  return parts[0];
};

const formatCommit = (commit: { message: string, author: {name: string}, id: string }) => {
  return `${commit.id.substring(0,8)} - ${commit.author.name}: ${getShortCommitMessage(commit)}`;
};

export const consoleDeploySucceedTemplate = (workflow_run: any) => {
  return `:thumbsup:  New console version has been successfully deployed on staging.\n` +
      `Deploy number: ${workflow_run.run_number}. HEAD now is:\n` +
      codeBlock(formatCommit(workflow_run.head_commit));
}

export const consoleDeployFailedTemplate = (workflow_run: any) => {
  const link = hideLinkEmbed(workflow_run.html_url);

  return `:no_entry_sign:  Deployment to staging #${workflow_run.run_number} failed :(\n` +
    `Logs: ${link}\n` +
    codeBlock(formatCommit(workflow_run.head_commit));
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
