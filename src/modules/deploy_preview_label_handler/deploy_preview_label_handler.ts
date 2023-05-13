import {EmitterWebhookEvent, EmitterWebhookEventName} from "@octokit/webhooks"
import { Context } from "probot/lib/context";

const FREE = "BFBFBF";
const OCCUPIED = "2fad40";

const COLORS: Record<string, string> = {
  argon: "ffba72",
  helium: "fd7249",
  krypton: "d0ffb3",
  xenon: "c3bdff",
  radon: "fa4343",
  oganesson: "927acc",
  hydrogen: "43abfa",
  nitrogen: "332ffa",
  oxygen: "29a6ff",
  fluorine: "40995b",
  chlorine: "a7ab57",
}

export const PRLabeledHandler = async (context: EmitterWebhookEvent<"pull_request.labeled"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  if (context.payload.repository.full_name !== "neondatabase/cloud" ||
    context.payload.sender.type === 'Bot') {
    return;
  }

  const label = context.payload.label;
  if (!label) {
    return;
  }
  const labelName = label.name;
  if (!labelName.match(/preview\/\w/)) {
    return;
  }

  const previewName: string = label.name.split('/')[1] || '';

  if (!previewName) {
    return;
  }

  // find other PRs with this label and remove the label from it
  const prevPRs = await context.octokit.request('GET /repos/{owner}/{repo}/pulls', {
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    per_page: 100,
  });

  prevPRs.data.forEach((pr) => {
    if (pr.number !== context.payload.pull_request.number
      && pr.labels.find((prLabel) => prLabel.name === labelName)) {
      context.octokit.request('DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}', {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: pr.number,
        name: labelName,
      });
    }
  });

  await context.octokit.request('PATCH /repos/{owner}/{repo}/labels/{name}', {
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    name: labelName,
    color: COLORS[previewName] || OCCUPIED,
    description: `Preview is occupied by #${context.payload.pull_request.number}`,
  });
}

export const PRUnLabeledHandler = async (context: EmitterWebhookEvent<"pull_request.unlabeled"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  if (context.payload.repository.full_name !== "neondatabase/cloud" ||
    context.payload.sender.type === 'Bot') {
    return;
  }

  const label = context.payload.label;
  if (!label || !label.name.match(/preview\/\w/)) {
    return;
  }

  const labelName = label.name;
  const previewName: string = label.name.split('/')[1] || '';

  if (!previewName) {
    return;
  }

  await context.octokit.request('PATCH /repos/{owner}/{repo}/labels/{name}', {
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    name: labelName,
    color: FREE,
    description: 'Free preview environment',
  });
}

export const PRMergedOrClosedHandler = async (context: EmitterWebhookEvent<"pull_request.closed"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  if (context.payload.repository.full_name !== "neondatabase/cloud" ||
    context.payload.sender.type === 'Bot') {
    return;
  }

  const labels = context.payload.pull_request.labels.filter((prLabel) => {
    return prLabel.name.match(/preview\/\w/)
  });

  labels.forEach(async (label) => {
    const labelName = label.name;

    const previewName: string = label.name.split('/')[1] || '';

    if (!previewName) {
      return;
    }

    await context.octokit.request('DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}', {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      issue_number: context.payload.pull_request.number,
      name: labelName,
    });

    await context.octokit.request('PATCH /repos/{owner}/{repo}/labels/{name}', {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      name: labelName,
      color: FREE,
      description: 'Free preview environment',
    });
  });
}

export const PROpenedHandler = async (context: EmitterWebhookEvent<"pull_request.opened"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  if (context.payload.repository.full_name !== "neondatabase/cloud" ||
    context.payload.sender.type === 'Bot') {
    return;
  }

  const label = context.payload.pull_request.labels.find((prLabel) => {
    return prLabel.name.match(/preview\/\w/)
  });
  if (!label) {
    return;
  }

  const labelName = label.name;

  const previewName: string = label.name.split('/')[1] || '';

  if (!previewName) {
    return;
  }

  await context.octokit.request('PATCH /repos/{owner}/{repo}/labels/{name}', {
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    name: labelName,
    color: COLORS[previewName] || OCCUPIED,
    description: `Preview is occupied by #${context.payload.pull_request.number}`,
  });
}
