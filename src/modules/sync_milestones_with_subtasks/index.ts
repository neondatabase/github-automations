import {Probot} from "probot";
import {sleep} from "../../lib/utils";
import {Issue} from "../../lib/issue";
import Queue from "async-await-queue";

export const sync_milestones_with_subtasks_listener = (app: Probot) => {
  const milestoneQueue = new Queue(1);

  app.on(["issues.demilestoned", "issues.milestoned"], async (context) => {
    console.log(`issue ${context.payload.issue.node_id} ${context.payload.action}`);

    // sometimese github would send event in wrong order
    // so we always process demilestoned beforeс milestoned
    // to avoid bugs when milestone is changed from one to another
    if (context.payload.action === 'milestoned') {
      // we wait before add the task to queue in case
      // it is a pair of events and milestoned came first
      await sleep(200);
    }

    milestoneQueue.run(async () => {

      let prevMilestone = null;
      let nextMilestone = null;

      if (context.payload.action === "demilestoned") {
        // github events `issue.milestoned` and `issue.demilestoned` contains
        // field `payload.milestone`, but for some reason typings doesn't have it
        prevMilestone = context.payload.milestone;
      } else if (context.payload.action === "milestoned") {
        nextMilestone = context.payload.milestone;
      } else {
        return;
      }

      let issue = await Issue.load(context.octokit, context.payload.issue.node_id);
      await issue.syncChildrenMilestone(context.octokit, prevMilestone, nextMilestone);
    });
  });
}