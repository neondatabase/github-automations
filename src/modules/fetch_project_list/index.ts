import {ProbotOctokit} from "probot";
import {getProjectItemsForExport} from "../../shared/graphql_queries";
import {logger} from "../../shared/logger";
import fs from "fs";
import {FieldValue, ProjectItem, SearchResult, Issue} from "./types";

const searchCutOffArr = [
    `created:>2025-07-01`, // test set

    // `created:>2025-04-01`,
    // `created:2025-01-01..2025-04-01`,
    // `created:2024-07-01..2025-01-01`,
    // 'created:2022-06-01..2024-07-01',
    // `created:<2022-06-01`,
]

const repoWhitelist = [
    "cloud",
    "neon",
    "company_projects",
    "analytics",
    "neonctl",
    "autoscaling"
];

const projectsBlacklist = [
    '(TEST) All Company Epics',
    '[DEPRECATED] Engineering Tasks',
    'Incident Follow-ups', // to be migrated as labels?


    // personal projects, not to be migrated?
    '@MihaiBojin',
    '@NanoBjorn\' backlog'
]

// const statusesWhiteList = [
//     'selected',
//     'in progress',
//     'needs refinement',
//     'triage',
//     'blocked',
//     'inbox'
// ]

const statusesWhiteListRegex = /selected|in\sprogress|needs\srefinement|triage|blocked|inbox/i

const getFieldValue = (field: FieldValue) => (field.text || field.date || field.number || field.name || '');

const tryGetFieldValue = (search: string, fieldsData: ProjectItem["fieldValues"]["nodes"]) => {
    const field = fieldsData.find(fieldItem => fieldItem.field && fieldItem.field.name.toLowerCase().includes(search.toLowerCase()));

    return field ? getFieldValue(field) : '';
}

const getIssueId = (issue: Pick<Issue, "number" | "repository">) => {
    return `${issue.repository.name}#${issue.number}`;
}

const getParentId = (issue: Issue) => {
    if (issue.trackedInIssues && issue.trackedInIssues.totalCount > 1) {
        throw new Error('More than one tracked in')
    }
    const parent = issue.parent;
    const trackedIn = issue.trackedInIssues.nodes[0];

    if (parent && trackedIn) {
        throw new Error('Has both parent and tracked in')
    }

    return (parent && getIssueId(parent)) || (trackedIn && getIssueId(trackedIn)) || '';
}

const prepareLabels = (issue: Issue) => {
    return issue.labels.nodes
        .filter((labelNode) => labelNode.name && !labelNode.name.startsWith("c/") && !labelNode.name.startsWith("team/"))
        .map((labelNode) => labelNode.name);
}

const prepareBody = (issue: Issue, projectItems: ProjectItem[])=> {
    const projectItemsFieldsText = "## Fields from Neon Github Projects\n\n" + projectItems.map((prItem: any) => {
        let res = `||Field||Value||\n`;
        res = res + prItem.fieldValues.nodes
            .filter((fieldValue: any) => fieldValue.field && fieldValue.field.name && !fieldValue.field.name.includes('🔄') && fieldValue.field.name !== "Title")
            .map((fieldValue: any) => (
                `|${fieldValue.field.name}|${getFieldValue(fieldValue)}|`
            )).join('\n')

        return `${prItem.project.title}\n${res}`;
    }).join('\n\n')

    return escape(`[Original Github Issue from Neon](${issue.url}), created at ${issue.createdAt}\n\n${issue.body}\n\n${projectItemsFieldsText}`);
}

const prepareComponents = (issue:Issue) => {
    return issue.labels.nodes
        .filter((labelNode) => labelNode.name && labelNode.name.startsWith("c/"))
        .map((labelNode) => labelNode.name.substring(2));
}

const prepareIssueType = (issue: Issue) => {
    // todo

    if (issue.repository.name === "company_projects") {
        return "Major Initiative"
    }

    return issue.issueType.name || 'Task';
}

// get project item that is most likely to make progress
const getMainProject = (projectItems: ProjectItem[]) => {
    return projectItems.find((prItem) => (tryGetFieldValue("status", prItem.fieldValues.nodes).toLowerCase() === 'in progress'))
    || projectItems.find((prItem) => (tryGetFieldValue("status", prItem.fieldValues.nodes).toLowerCase() === 'selected'))
    || projectItems.find((prItem) => (tryGetFieldValue("status", prItem.fieldValues.nodes).toLowerCase() === 'needs refinement'))
    || projectItems.find((prItem) => (tryGetFieldValue("status", prItem.fieldValues.nodes).toLowerCase() === 'blocked'))
    || projectItems.find((prItem) => (tryGetFieldValue("status", prItem.fieldValues.nodes).toLowerCase() === 'inbox'))
    || projectItems[0]
}

const escape = (str: string) => `"${str}"`;

const MAX_LABELS = 11;
const MAX_TEAMS = 5;
const MAX_COMPONENTS = 5;
const MAX_ASSIGNEES = 1;

export const fetch_project_list = async (octokit: ProbotOctokit) => {
    console.log("start fetching");

    const stats = {
        maxLabelsLength: 0,
        maxComponentsLength: 0,
        maxProjectsItemsLength: 0,
        maxTeams: 0,
        maxAssignees: 0,
    }

    const exportData = [
        [
            "url",
            "id",
            "title",
            "body",
            "issueType",
            "author",
            "parent",
            ...new Array(MAX_ASSIGNEES).fill('assignee'),
            ...new Array(MAX_COMPONENTS).fill('component'),
            ...new Array(MAX_TEAMS).fill('team'),
            ...new Array(MAX_LABELS).fill('label'),
            ...new Array(MAX_TEAMS).fill('Statuses in teams projects'),
            "Selected project Name",
            "Selected status",
            "Selected priority",
            "Selected size",
        ]
    ];
    const exportExceptions = [
        [
            "url",
            "title",
            "reason"
        ]
    ]

    const addException = (issue: Issue, reason: string) => {
        exportExceptions.push([
            issue.url,
            issue.title,
            reason
        ]);
    }

    console.time('fetch_project_list')
    let i = 0;
    for (let searchSlice of searchCutOffArr) {
        const searchQuery = `org:neondatabase is:issue state:open ${searchSlice}`;
        let pageInfo: {
            hasNextPage: boolean,
            endCursor: string,
        } = {
            hasNextPage: true,
            endCursor: '',
        }
        while (pageInfo.hasNextPage) {
            console.log("counter", i);
            try {
                const res: { search: SearchResult, totalCount: number } = await octokit.graphql(getProjectItemsForExport, {
                    q: searchQuery,
                    cursor: pageInfo.endCursor,
                });
                logger('info', `Search query: ${searchQuery}, total count: ${res.search.issueCount}`);
                const { search } = res;
                // logger('info', `processing page from cursor ${pageInfo.endCursor}, itemsCount: ${search.nodes.length}`);


                pageInfo.endCursor = search.pageInfo.endCursor
                pageInfo.hasNextPage = search.pageInfo.hasNextPage
                if (res.totalCount > 1000) {
                    logger('error', `Search slice returned more than 1000 results, query: "${searchQuery}"`);
                }

                for (let issue of search.nodes) {
                    i++;
                    // logger('info', `it. #${i} Processing issue ${issue.repository.name}#${issue.number} ${issue.title}`)
                    if (!(repoWhitelist).includes(issue.repository.name)) {
                        addException(issue, 'Does not belong to whitelisted repositories')
                        continue;
                    }

                    if (!issue.projectItems.nodes.length) {
                        addException(issue, 'Does not belong to any projects')
                        continue;
                    }

                    // list of projects which fields get to issue body
                    const projectItems = issue.projectItems.nodes
                        .filter((prItem) => (
                            !prItem.project.closedAt  // don't care about closed projects
                            && !prItem.isArchived  // don't care about archived items
                        ))

                    if (!projectItems.length) {
                        addException(issue, 'Does not belong to any open projects')
                        continue;
                    }

                    // sanitize projectItems
                    let activeProjectItems = projectItems
                        .filter((prItem) => (
                            !projectsBlacklist.includes(prItem.project.title)   // skip certain projects
                        ))

                    stats.maxProjectsItemsLength = Math.max(activeProjectItems.length, stats.maxProjectsItemsLength)

                    if (!activeProjectItems.length) {
                        addException(issue, 'All the projects the issue belongs to are blacklisted')
                        continue;
                    }

                    activeProjectItems = activeProjectItems
                        .filter((prItem) => {
                            const status = tryGetFieldValue('status', prItem.fieldValues.nodes)
                            return status && status.match(statusesWhiteListRegex)   // only allow certain statuses
                        })

                    if (!activeProjectItems.length) {
                        addException(issue, 'No projects with whitelisted statuses')
                        continue;
                    }

                    // get project item with the best status (In Progress, Selected, Blocked, Need Refinement, Inbox)
                    const mainProjectItem = getMainProject(activeProjectItems);

                    // get components from labels
                    const components = prepareComponents(issue);
                    stats.maxComponentsLength = Math.max(components.length, stats.maxComponentsLength)
                    components.length = MAX_COMPONENTS

                    // sanitise labels
                    const labels = prepareLabels(issue);
                    stats.maxLabelsLength = Math.max(labels.length, stats.maxLabelsLength)
                    labels.length = MAX_LABELS

                    const teams = activeProjectItems.map((prItem) => (prItem.project.title));
                    stats.maxTeams = Math.max(teams.length, stats.maxTeams);
                    teams.length = MAX_TEAMS

                    const assignees = issue.assignees.nodes.map((item) => (item.login));
                    stats.maxAssignees = Math.max(assignees.length, stats.maxAssignees);
                    assignees.length = MAX_ASSIGNEES;

                    const teamsStatuses = activeProjectItems.map((prItem) => (`${prItem.project.title}/${tryGetFieldValue('status', prItem.fieldValues.nodes) || 'unknown'}`));
                    teamsStatuses.length = MAX_TEAMS;

                    const id = getIssueId(issue);
                    const body = prepareBody(issue, projectItems);
                    const title = escape(`${issue.title}, ${id}`);
                    const author = issue.author.login // todo: map to databricks emails pending Crystal
                    let parent = '';

                    try {
                        parent = getParentId(issue);
                    } catch (e: any) {
                        exportExceptions.push([issue.url, issue.title, e]);
                        continue;
                    }

                    const issueType = prepareIssueType(issue);

                    exportData.push(
                        [
                        //     "url",
                            issue.url,
                        //     "repo#number",
                            id,
                        //     "title",
                            title,
                        //     "body",
                            body,
                        //     "issueType",
                            issueType,
                        //     "author",
                            author,
                        //     "parent",
                            parent,
                        // assignee
                            ...assignees,
                        //     ...new Array(5).fill('component'),
                            ...components,
                        //     ...new Array(5).fill('team'),
                            ...teams,
                        //     ...new Array(5).fill('label'),
                            ...labels,
                        // ...new Array(MAX_TEAMS).fill('Statuses in teams projects'),
                            ...teamsStatuses,
                        // "Selected project Name",
                            mainProjectItem.project.title,
                        // "Selected status",
                            tryGetFieldValue("status", mainProjectItem.fieldValues.nodes),
                        // "Selected priority",
                            tryGetFieldValue("priority", mainProjectItem.fieldValues.nodes),
                        // "Selected size",
                            tryGetFieldValue("size", mainProjectItem.fieldValues.nodes),
                        ]
                    )
                }

                logger('info', search);
            } catch (e) {
                logger('error', e)
            }
        }
    }
    const content = exportData.map(item => item.join('ÿ')).join('\n')
    const exceptionsContent = exportExceptions.map(item => item.join('ÿ')).join('\n')

    console.log("stats")
    console.log(stats)
    console.log("Processed issues:", i);
    console.log(`will migrate: ${exportData.length - 1}, will not migrate: ${exportExceptions.length - 1}`);
    console.timeEnd('fetch_project_list')

    try {
        const timestamp = +new Date();
        fs.writeFileSync(`./${timestamp}_Dump_all.csv`, content);
        fs.writeFileSync(`./${timestamp}_Exceptions_all.csv`, exceptionsContent);
        console.log("written")
        // file written successfully
    } catch (err) {
        console.error(err);
    }
}