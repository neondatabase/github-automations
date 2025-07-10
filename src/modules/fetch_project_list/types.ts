export type PageInfo = {
    endCursor: string,
    hasNextPage: boolean,
    startCursor: string,
    hasPreviousPage: boolean,
}

type Repository = {
    name: string
}

export type FieldValue = {
    field: {
        id: string
        name: string
    }
    text?: string
    date?: string
    name?: string
    number?: string
} & ({text: string} | {date: string} | { name: string } |{number: number})

export type ProjectItem = {
    id: string
    isArchived: boolean
    type: string
    updatedAt: string
    project: {
        id: string
        title: string
        closedAt: string
    }
    fieldValues: {
        nodes: Array<FieldValue>
    }
}

export type Issue = {
    number: number
    title: string
    body: string
    url: string
    createdAt: string
    updatedAt: string
    closedAt: string
    repository: Repository
    issueType: {
        name: string
    },
    author: {
        login: string
    }
    trackedInIssues: {
        totalCount: number
        nodes: Array<Pick<Issue, "number" | "repository">>
    }
    parent: Pick<Issue, "number" | "repository">
    assignees: {
        totalCount: number
        nodes: Array<{
            login: string
        }>
    }
    labels: {
        nodes: Array<{
            name: string
        }>
    }
    projectItems: {
        nodes: Array<ProjectItem>
    }
}

export type SearchResult = {
    pageInfo: PageInfo,
    issueCount: number,
    nodes: Array<Issue>
}
