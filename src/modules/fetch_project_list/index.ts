import {ProbotOctokit} from "probot";
import {getProjectItemsForExport} from "../../shared/graphql_queries";
import {logger} from "../../shared/logger";
import fs from "fs";
import {FieldValue, ProjectItem, SearchResult, Issue} from "./types";
// @ts-ignore
import J2M from 'j2m';

const searchCutOffArr = [
    // `created:>2025-07-01`, // test set
    // `31093` // test set

    // prod set
    `created:>2025-04-01`,
    `created:2025-01-01..2025-04-01`,
    `created:2024-07-01..2025-01-01`,
    'created:2022-06-01..2024-07-01',
    `created:<2022-06-01`,
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
    '@erikgrinaker\'s untitled project',
    'CIv2 Project',
    'Deals',
    'PD: AI XP team',
    '[TEMPLATE] <Your team/component> tasks',
    'Infra Initiatives',
    'Postgres team tasks',
    'PD: API Platform team tasks',
    'PD: QA tasks',
    'SOC2',
    'Triage: Product Delivery',
    '@MihaiBojin',
    'Developer Productivity team tasks',
    'PD: Workflow tasks',
    'PD: Growth',
    'PD: Identity tasks',
]

const projectsAsTeams = [
    'PCI-DSS',
    'Data team tasks',
    'RE: Support Tools',
    'Product Design Team Tasks',
    'PD: FE Infra tasks',
    'PD: Workflow tasks',
    'Pl: Compute team tasks',
    'Pl: Proxy team tasks',
    'PD: DBaaS tasks',
    'Security',
    'PD: Docs tasks',
    'Pl: Storage team tasks',
    'PD: Billing tasks',
    'Pl: Control-plane team tasks',
    'Pl: Autoscaling team tasks'
]

const projectsAsLabels = [
    'COGS',
    'Project Trust',
    'Support Escalations',
    'PD: Azure tasks',
    'HIPAA',
    'Incident Follow-ups'
]

const priorityMap = {
    'P0':'Blocker',
    'P1':'Critical',
    'P2':'Major',
    'P3':'Minor',
    '🌋 Urgent':'Critical',
    '🏔 High':'Major',
    '🏕 Medium':'Minor',
    '🏝 Low':'Trivial',
    '🌋 P0 - High':'Blocker',
    '🏔 P1 - Moderate':'Critical',
    '🏕 P2 - Low Priority':'Major',
    '🏝 P3 - Negligible':'Minor',
}

// const statusesWhiteList = [
//     'selected',
//     'in progress',
//     'needs refinement',
//     'triage',
//     'blocked',
//     'inbox'
// ]

// const statusesWhiteListRegex = /selected|in\sprogress|needs\srefinement|triage|blocked|inbox/i

const getFieldValue = (field: FieldValue) => (field.text || field.date || field.number || field.name || '');

const tryGetFieldValue = (search: string, fieldsData: ProjectItem["fieldValues"]["nodes"]) => {
    const field = fieldsData.find(fieldItem => fieldItem.field && fieldItem.field.name.toLowerCase().includes(search.toLowerCase()));

    return field ? getFieldValue(field) : '';
}

const getIssueId = (issue: Pick<Issue, "number" | "repository">) => {
    return `${issue.repository.name}#${issue.number}`;
}

const prepareLabels = (issue: Issue) => {
    const ghLabels = issue.labels.nodes
        .filter((labelNode) => labelNode.name && !labelNode.name.startsWith("c/") && !labelNode.name.startsWith("team/"))
        .map((labelNode) => labelNode.name);
    const projectToLabels = issue.projectItems.nodes.filter(prItem => (
        !prItem.isArchived && projectsAsLabels.includes(prItem.project.title)
    )).map(prItem => `project/${prItem.project.title.replace(/\s/g, '_')}`);

    return [
        ...ghLabels,
        ...projectToLabels
    ]
}

const prepareBody = (issue: Issue, projectItems: ProjectItem[], linksMap: Record<string, string>)=> {
    // todo: replace links
    console.log(issue)
    console.log(projectItems)

    const projectItemsFieldsText = "## Fields from Neon Github Projects\n\n" +
        projectItems.map((prItem) => {
            let res = `||Field||Value||\n`;
            res = res + prItem.fieldValues.nodes
                .filter((fieldValue) => fieldValue.field && fieldValue.field.name && !fieldValue.field.name.includes('🔄') && fieldValue.field.name !== "Title")
                .map((fieldValue) => (
                    `|${fieldValue.field.name}|${getFieldValue(fieldValue)}|`
                )).join('\n')

            return `### ${prItem.project.title}\n${res}`;
        }).join('\n')

    const reporterLink = `[${issue.author.login}](${issue.author.url})`;
    const assigneesArr = issue.assignees.nodes.map(user => (`[${user.login}](${user.url})`))

    const originalAssignees = assigneesArr.length ? `GH Assignees: ${assigneesArr.join(', ')}\n\n` : '\n';

    // replacing links to look nicer in body
    // const mathFullLinks =

    const content = `[Original Github Issue from Neon](${issue.url}), created at ${issue.createdAt} by ${reporterLink}\n` +
        originalAssignees +
        issue.body +
        "\n\n" +
        projectItemsFieldsText

    const wiki = J2M.toJ(content);
    return escape(wiki);
    // return ''
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

    return issue.issueType ? issue.issueType.name : 'Task';
}

// get project item that is most likely to make progress
const getMainProject = (teamProjectItems: ProjectItem[], labelProjectItems: ProjectItem[]) => {
    if (!teamProjectItems.length && !labelProjectItems.length) {
        return;
    }

    const projectItems = teamProjectItems.length ? teamProjectItems : labelProjectItems;

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
const MAX_LINKED = 5;

export const fetch_project_list = async (octokit: ProbotOctokit) => {
    console.log("start fetching");

    const stats = {
        maxLabelsLength: 0,
        maxComponentsLength: 0,
        maxProjectsItemsLength: 0,
        maxTeams: 0,
        maxAssignees: 0,
        maxRelatesTo: 0,
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
            ...new Array(MAX_LINKED).fill('relates to'),
            ...new Array(MAX_ASSIGNEES).fill('assignee'),
            ...new Array(MAX_COMPONENTS).fill('component'),
            ...new Array(MAX_TEAMS).fill('team'),
            ...new Array(MAX_LABELS).fill('label'),
            ...new Array(MAX_TEAMS).fill('Statuses in team projects'),
            ...new Array(MAX_TEAMS).fill('Statuses in label projects'),
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
                        addException(issue, `Does not belong to whitelisted repositories, repo name: ${issue.repository.name}`)
                        continue;
                    }

                    if (!issue.projectItems.nodes.length) {
                        addException(issue, 'Does not belong to any projects')
                        continue;
                    }

                    // list of projects which fields get to issue body
                    const whitelistedProjectItems = issue.projectItems.nodes
                        .filter((prItem) => (
                            !prItem.project.closedAt  // don't care about closed projects
                            && !prItem.isArchived  // don't care about archived items
                            && !projectsBlacklist.includes(prItem.project.title) // exclude blacklisted projects
                            // && // todo: exclude blacklisted statuses
                        ))

                    if (!whitelistedProjectItems.length) {
                        const projectsStr = issue.projectItems.nodes
                            .map((prItem) => {
                                if (prItem.project.closedAt) {
                                    `"${prItem.project.title}": project closed at ${prItem.project.closedAt}`
                                }
                                if (prItem.isArchived) {
                                    return `"${prItem.project.title}": issue archived`
                                }
                                if (projectsBlacklist.includes(prItem.project.title)) {
                                    return `"${prItem.project.title}": project is not whitelisted`
                                }
                                return `"${prItem.project.title}": unknown reason, check me`
                            }).join('; ')
                        addException(issue, `Does not belong to any allowed projects, details: ${projectsStr}`)
                        continue;
                    }
                    stats.maxProjectsItemsLength = Math.max(whitelistedProjectItems.length, stats.maxProjectsItemsLength)

                    const teamsProjectItems = whitelistedProjectItems
                        .filter((prItem) => (
                            projectsAsTeams.includes(prItem.project.title)   // only for teams we want to migrate as Assigned Team
                        ))

                    const labelProjectItems = whitelistedProjectItems.filter((prItem) => (
                        projectsAsLabels.includes(prItem.project.title)   // only for teams we want to migrate as Assigned Team
                    ))

                    // get project item with the best status (In Progress, Selected, Blocked, Need Refinement, Inbox)
                    const mainProjectItem: ProjectItem | undefined = getMainProject(teamsProjectItems, labelProjectItems);

                    // get components from labels
                    const components = prepareComponents(issue);
                    stats.maxComponentsLength = Math.max(components.length, stats.maxComponentsLength)
                    components.length = MAX_COMPONENTS

                    // sanitise labels
                    const labels = prepareLabels(issue);
                    stats.maxLabelsLength = Math.max(labels.length, stats.maxLabelsLength)
                    labels.length = MAX_LABELS

                    const teams = teamsProjectItems.map((prItem) => (prItem.project.title));
                    stats.maxTeams = Math.max(teams.length, stats.maxTeams);
                    teams.length = MAX_TEAMS

                    const assignees = issue.assignees.nodes.map((item) => (item.login));
                    stats.maxAssignees = Math.max(assignees.length, stats.maxAssignees);
                    assignees.length = MAX_ASSIGNEES;

                    const teamsStatuses = teamsProjectItems.map((prItem) => (`${prItem.project.title}/${tryGetFieldValue('status', prItem.fieldValues.nodes) || 'unknown'}`));
                    teamsStatuses.length = MAX_TEAMS;
                    const labelStatuses = labelProjectItems.map((prItem) => (`${prItem.project.title}/${tryGetFieldValue('status', prItem.fieldValues.nodes) || 'unknown'}`));
                    labelStatuses.length = MAX_TEAMS;

                    const id = getIssueId(issue);
                    const body = prepareBody(issue, whitelistedProjectItems, {});
                    const title = escape(`${issue.title}, ${id}`);
                    const author = issue.author.login // todo: map to databricks emails pending Crystal
                    const parent = issue.parent ? getIssueId(issue.parent) : '';
                    const relatesTo = issue.trackedInIssues.nodes.map(item => getIssueId(item));
                    stats.maxRelatesTo = Math.max(relatesTo.length, stats.maxRelatesTo);
                    relatesTo.length = MAX_LINKED;

                    const selectedPriority = mainProjectItem ? priorityMap[tryGetFieldValue("priority", mainProjectItem.fieldValues.nodes) || 'unknown'] || 'unknown' : '';


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
                        // relates to
                            ...relatesTo,
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
                        // ...new Array(MAX_TEAMS).fill('Statuses in label projects'),
                            ...labelStatuses,
                        // "Selected project Name",
                            mainProjectItem ? mainProjectItem.project.title : '',
                        // "Selected status",
                            mainProjectItem ? tryGetFieldValue("status", mainProjectItem.fieldValues.nodes) : '',
                        // "Selected priority",
                            selectedPriority,
                        // "Selected size",
                            mainProjectItem ? tryGetFieldValue("size", mainProjectItem.fieldValues.nodes) : '',
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
        const timestamp = new Date().toISOString();
        fs.writeFileSync(`./${timestamp}_Dump_all.csv`, content);
        fs.writeFileSync(`./${timestamp}_Exceptions_all.csv`, exceptionsContent);
        console.log("written")
        // file written successfully
    } catch (err) {
        console.error(err);
    }
}