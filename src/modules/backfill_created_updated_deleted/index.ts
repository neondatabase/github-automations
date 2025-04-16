import {ProbotOctokit} from "probot";
import {
  getProjectItems, setDateField,
} from "../../shared/graphql_queries";
import {logger} from "../../shared/logger";
import {ALL_TEAMS_PROJECTS, NeonProject} from "../../shared/project_ids";
import {isDryRun} from "../../shared/utils";

const config: Array<Pick<NeonProject, 'projectId' | 'projectNumber' | 'updatedAtFieldId' | 'createdAtFieldId' | 'closedAtFieldId'>> = ALL_TEAMS_PROJECTS.map(({projectId, projectNumber, updatedAtFieldId, createdAtFieldId, closedAtFieldId}) => {
  if (!projectId || !projectNumber) {
    return;
  }

  if (!createdAtFieldId && !updatedAtFieldId && !closedAtFieldId) {
    return;
  }

  return {
    projectNumber,
    projectId,
    createdAtFieldId,
    updatedAtFieldId,
    closedAtFieldId,
  }
}).filter(pr => Boolean(pr)) as Array<Pick<NeonProject, 'projectId' | 'projectNumber' | 'updatedAtFieldId' | 'createdAtFieldId' | 'closedAtFieldId'>>;
console.log(config)

export const backfill_created_updated_deleted = async (octokit: ProbotOctokit) => {
  console.time('backfill_created_updated_deleted')
  let graphqlCounter = 0;
  let backfilledItems = 0;
  for (let project of config) {
    if (!project) {
      break;
    }
    console.time('backfill_created_updated_deleted' + project.projectNumber)
    let pageInfo: {
      hasNextPage: boolean,
      endCursor: string,
    } = {
      hasNextPage: true,
      endCursor: '',
    }
    while (pageInfo.hasNextPage) {
      try {
        const res: {
          search: {
            pageInfo: {
              endCursor: string,
              hasNextPage: boolean,
              startCursor: string,
              hasPreviousPage: boolean,
            }
            issueCount: number,
            nodes: Array<{
              number: number,
              title: string,
              createdAt: string,
              updatedAt: string,
              closedAt?: string,
              repository: {
                name: string,
              }
              author: {
                login: string,
              }
              projectItems: {
                nodes: Array<{
                  id: string,
                  isArchived: boolean,
                  type: 'ISSUE',
                  updatedAt: string,
                  project: {
                    id: string
                  }
                  fieldValues: {
                    nodes: Array<{
                      field: {
                        id: string,
                        name: string,
                      }
                      date: string;
                    }>
                  },
                }>
              }
            }>
          }
        } = await octokit.graphql(getProjectItems, {
          q: `org:neondatabase project:neondatabase/${project.projectNumber} is:closed`,
          cursor: pageInfo.endCursor,
        });
        logger('info', `total count: ${res.search.issueCount}`);
        const { search } = res;
        graphqlCounter++;
        logger('info', `processing page from cursor ${pageInfo.endCursor}, itemsCount: ${search.nodes.length}`);


        pageInfo.endCursor = search.pageInfo.endCursor
        pageInfo.hasNextPage = search.pageInfo.hasNextPage
        let i = 0;
        for (let issue of search.nodes) {
          let backfilled = false;
          i++;
          logger('info', `it. #${i} Processing issue #${issue.number} ${issue.title}`)
          if (!issue.projectItems || !issue.projectItems.nodes || !issue.projectItems.nodes.length) {
            logger('info', `Skip Processing issue #${issue.number} ${issue.title}: Does not belong to the project ${project.projectNumber}`)
            continue;
          }

          const projectItem = issue.projectItems.nodes.find((conn) => (conn.project.id === project.projectId));

          if (!projectItem) {
            logger('info', `Skip Processing issue #${issue.number} ${issue.title}: Does not belong to the project ${project.projectNumber}`)
            continue;
          }

          if (projectItem.isArchived) {
            logger('info', `Skip Processing issue #${issue.number} ${issue.title}: Archived in project ${project.projectNumber}`)
            continue;
          }

          const createdAtFieldDesiredValue = issue.createdAt;
          const updatedAtFiedDesiredValue = (new Date(projectItem.updatedAt).getTime()) >= new Date(issue.updatedAt).getTime() ?
            projectItem.updatedAt : issue.updatedAt;
          const closedAtFieldDesiredValue = issue.closedAt;

          // @ts-ignore
          const dateFieldsValues = Object.fromEntries(projectItem.fieldValues.nodes.map((fieldValueObj) => {
            if (fieldValueObj.field) {
              return [fieldValueObj.field.id, fieldValueObj.date];
            }
            return;
          }).filter(Boolean));

          if (project.createdAtFieldId && !dateFieldsValues[project.createdAtFieldId] && createdAtFieldDesiredValue) {
            graphqlCounter++;
            backfilled = true;
            if (!isDryRun()) {
              try {
                await octokit.graphql(setDateField, {
                  project_id: project.projectId,
                  project_item_id: projectItem.id,
                  date_field_id: project.createdAtFieldId,
                  value: createdAtFieldDesiredValue
                })
              } catch(e) {
                logger('error', e)
              }
            }
            logger('info', `Set created at for issue #${issue.number} ${issue.title} in project ${project.projectId} with value ${createdAtFieldDesiredValue}`)
          }

          if (project.updatedAtFieldId && !dateFieldsValues[project.updatedAtFieldId] && updatedAtFiedDesiredValue) {
            graphqlCounter++;
            backfilled = true;

            if (!isDryRun()) {
              try {
                await octokit.graphql(setDateField, {
                  project_id: project.projectId,
                  project_item_id: projectItem.id,
                  date_field_id: project.updatedAtFieldId,
                  value: updatedAtFiedDesiredValue
                })
              } catch(e) {
                logger('error', e)
              }
              }
            logger('info', `Set updated at for issue #${issue.number} ${issue.title} in project ${project.projectId} with value ${updatedAtFiedDesiredValue}`)
          }

          if (project.closedAtFieldId && !dateFieldsValues[project.closedAtFieldId] && closedAtFieldDesiredValue) {
            graphqlCounter++;
            backfilled = true;

            if (!isDryRun()) {
              try {
                await octokit.graphql(setDateField, {
                  project_id: project.projectId,
                  project_item_id: projectItem.id,
                  date_field_id: project.closedAtFieldId,
                  value: closedAtFieldDesiredValue
                })
              } catch (e) {
                logger('error', e)
              }
            }
            logger('info', `Set updated at for issue #${issue.number} ${issue.title} in project ${project.projectId} with value ${closedAtFieldDesiredValue}`)
          }
          if (backfilled) {
            backfilledItems++
          }
          logger('info', `Done processing issue #${issue.number} ${issue.title}`)
        }

        logger('info', search);
      } catch (e) {
        logger('error', e)
      }

    }
    console.log(`Backfilled ${backfilledItems} items for project ${project.projectNumber}, GraphQL requests count: ${graphqlCounter}`)
    console.timeLog('backfill_created_updated_deleted', {
      projectNumber: project.projectNumber
    })
    console.timeEnd('backfill_created_updated_deleted' + project.projectNumber)
  }

  console.timeEnd('backfill_created_updated_deleted')
}