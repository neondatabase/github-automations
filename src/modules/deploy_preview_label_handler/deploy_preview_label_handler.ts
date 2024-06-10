import {EmitterWebhookEvent, EmitterWebhookEventName} from "@octokit/webhooks"
import { Context } from "probot/lib/context";
import {logger} from "../../shared/logger";
import {isDryRun} from "../../shared/utils";

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
    logger('info', "Skip PRLabeledHandler because the sender is Bot")
    return;
  }

  const label = context.payload.label;
  if (!label) {
    logger('info', "Skip PRLabeledHandler because no label")
    return;
  }
  const labelName = label.name;
  if (!labelName.match(/preview\/\w/)) {
    logger('info', "Skip PRLabeledHandler because changed label is not preview related")
    return;
  }

  const previewName: string = label.name.split('/')[1] || '';

  if (!previewName) {
    logger('info', "Skip PRLabeledHandler because preview name not found")
    return;
  }

  // find other PRs with this label and remove the label from it
  try {
    const prevPRs = await context.octokit.paginate('GET /repos/{owner}/{repo}/pulls', {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
    });

    prevPRs.forEach((pr) => {
      if (pr.number !== context.payload.pull_request.number
        && pr.labels.find((prLabel) => prLabel.name === labelName)) {
        logger('info', `Removing label ${labelName} from pr ${context.payload.pull_request.url}`)
        try {
          if (!isDryRun()) {
            context.octokit.request('DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}', {
              owner: context.payload.repository.owner.login,
              repo: context.payload.repository.name,
              issue_number: pr.number,
              name: labelName,
            });
          }
        } catch (error) {
          logger('error', `Removing label from previously marked PRs failed`, {error, context, label: labelName})
        }
      }
    });
  } catch (err) {
    logger('error', `Failed to fetch PRs`, err)
  }

  try {
    logger('info', `Marking the preview label as occupied`, {
      labelName,
    })

    if (!isDryRun()) {
      await context.octokit.request('PATCH /repos/{owner}/{repo}/labels/{name}', {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        name: labelName,
        color: COLORS[previewName] || OCCUPIED,
        description: `Preview is occupied by #${context.payload.pull_request.number}`,
      });
    }
  } catch (error) {
    logger('error', `Failed to mark preview as occupied`, {
      error,
      context,
      label: labelName,
    })
  }
}

export const PRUnLabeledHandler = async (context: EmitterWebhookEvent<"pull_request.unlabeled"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  if (context.payload.repository.full_name !== "neondatabase/cloud" ||
    context.payload.sender.type === 'Bot') {
    logger('info', "Skip PRUnLabeledHandler because the sender is Bot")
    return;
  }

  const label = context.payload.label;
  if (!label || !label.name.match(/preview\/\w/)) {
    logger('info', "Skip PRUnLabeledHandler because changed label is not preview related")
    return;
  }

  const labelName = label.name;
  const previewName: string = label.name.split('/')[1] || '';

  if (!previewName) {
    logger('info', "Skip PRUnLabeledHandler because preview name not found")
    return;
  }

  try {
    logger('info', "Marking preview as free", {
      label: labelName,
      context,
    })
    if (!isDryRun()) {
      await context.octokit.request('PATCH /repos/{owner}/{repo}/labels/{name}', {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        name: labelName,
        color: FREE,
        description: 'Free preview environment',
      });
    }
  } catch (error) {
    logger('error', `Failed to mark preview as free`, {
      label: labelName,
      context,
      error
    })
  }
}

export const PRMergedOrClosedHandler = async (context: EmitterWebhookEvent<"pull_request.closed"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  if (context.payload.repository.full_name !== "neondatabase/cloud" ||
    context.payload.sender.type === 'Bot') {
    logger('info', "Skip PRMergedOrClosedHandler because the sender is Bot")
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

    try {
      logger('info', "deleting label from the PR", {
        context,
        label: labelName
      })
      if (!isDryRun()) {
        await context.octokit.request('DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}', {
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: context.payload.pull_request.number,
          name: labelName,
        });
      }
    } catch (error) {
      logger('error', "Failed to delete label from PR", {
        error,
        context,
        label: labelName
      })
    }

    try {
      logger('info', "marking preview as free", {
        context,
        label: labelName
      })
      if (!isDryRun()) {
        await context.octokit.request('PATCH /repos/{owner}/{repo}/labels/{name}', {
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          name: labelName,
          color: FREE,
          description: 'Free preview environment',
        });
      }
    } catch (error) {
      logger('error', "Failed to mark preview as free", {
        error,
        context,
        label: labelName
      })
    }
  });
}

export const PROpenedHandler = async (context: EmitterWebhookEvent<"pull_request.opened"> & Omit<Context<EmitterWebhookEventName>, "id" | "name" | "payload">) => {
  if (context.payload.repository.full_name !== "neondatabase/cloud" ||
    context.payload.sender.type === 'Bot') {
    logger('info', "Skip PROpenedHandler because the sender is Bot")
    return;
  }

  const label = context.payload.pull_request.labels.find((prLabel) => {
    return prLabel.name.match(/preview\/\w/)
  });
  if (!label) {
    logger('info', "Skip PROpenedHandler because PR has no labels")
    return;
  }

  const labelName = label.name;

  const previewName: string = label.name.split('/')[1] || '';

  if (!previewName) {
    logger('info', "Skip PROpenedHandler because PR has no preview labels")
    return;
  }

  try {
    logger('info', `Marking the preview label as occupied`, {
      labelName,
    })

    if (!isDryRun()) {
      await context.octokit.request('PATCH /repos/{owner}/{repo}/labels/{name}', {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        name: labelName,
        color: COLORS[previewName] || OCCUPIED,
        description: `Preview is occupied by #${context.payload.pull_request.number}`,
      });
    }
  } catch (error) {
    logger('error', `Failed to mark preview as occupied`, {
      error,
      context,
      label: labelName,
    })
  }
}
