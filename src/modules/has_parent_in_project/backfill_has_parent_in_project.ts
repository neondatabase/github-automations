import {
  getProjectItemsWithParents,
} from "../../shared/graphql_queries";
import {logger} from "../../shared/logger";
import {GraphQlQueryResponseData} from "@octokit/graphql";
import {configArr as config} from "./config";
import {setFieldForProjectItem} from "./utils";
import {Context} from "probot/lib/context";
import {EmitterWebhookEventName} from "@octokit/webhooks";

export const backfill_has_parent_in_project = async (c: Pick<Context<EmitterWebhookEventName>, "octokit" | "log">) => {
  console.time('backfill_has_parent_in_project')

  let graphqlCounter = 0;
  let backfilledItems = 0;
  for (let project of config) {
    if (!project) {
      continue;
    }
    const fieldId = project.hasParentInProjectFieldId;
    if (!fieldId) {
      continue;
    }
    console.time('backfill_has_parent_in_project' + project.projectNumber)
    let pageInfo: {
      hasNextPage: boolean,
      endCursor: string,
    } = {
      hasNextPage: true,
      endCursor: '',
    }
    while (pageInfo.hasNextPage) {
      try {
        const res: GraphQlQueryResponseData = await c.octokit.graphql(getProjectItemsWithParents, {
          q: `org:neondatabase project:neondatabase/${project.projectNumber}`,
          cursor: pageInfo.endCursor,
        });
        logger('info', `total count: ${res.search.issueCount}`);
        const { search } = res;
        graphqlCounter++;
        logger('info', `processing page from cursor ${pageInfo.endCursor}, itemsCount: ${search.nodes.length}`);

        pageInfo.endCursor = search.pageInfo.endCursor
        pageInfo.hasNextPage = search.pageInfo.hasNextPage
        for (let issue of search.nodes) {
          const issueProjectItem = issue.projectItems && issue.projectItems.nodes && issue.projectItems.nodes.find((pr: any) => (pr.project.id === project.projectId))
          if (!issue.parent) {
            continue;
          }

          const parentProjectItem = issue.parent && issue.parent.projectItems && issue.parent.projectItems.nodes.find((pr: any) => (pr.project.id === project.projectId));

          if (parentProjectItem && issueProjectItem) {
            graphqlCounter++;
            backfilledItems++;
            await setFieldForProjectItem(c, issueProjectItem, fieldId)
          }
        }

      } catch (e) {
        logger('error', e)
      }

    }
    console.log(`Backfilled ${backfilledItems} items for project ${project.projectNumber}, GraphQL requests count: ${graphqlCounter}`)
    console.timeLog('backfill_has_parent_in_project', {
      projectNumber: project.projectNumber
    })
    console.timeEnd('backfill_has_parent_in_project' + project.projectNumber)
  }

  console.timeEnd('backfill_has_parent_in_project')
}