
// gh api graphql -f query='
//   query {
//     organization(login: "neondatabase"){
//       projectV2(number: 6) {
//           id
//       }
//     }
//   }'

// gh api graphql -f query='
// query{
//   node(id: "PVT_kwDOBKF3Cs1e-g") {
//   ... on ProjectV2 {
//       fields(first: 20) {
//         nodes {
//         ... on ProjectV2Field {
//             name,
//               id
//           }
//         },
//         totalCount
//       }
//     }
//   }
// }
// '

export const issueWithParents = `
    query($issue_id: ID!) {
      node(id: $issue_id) {
        id
        ... on Issue {
          id
          title
          body
          number
          milestone {
            id
            dueOn
            number
            title
          }
          repository {
            nameWithOwner
            name
            owner {
              login
            }
          }
          labels(last: 100) {
            nodes {
              id
              name
            }
          }
          timelineItems(last: 100) {
            nodes {
              ... on CrossReferencedEvent {
                id
                source {
                  ... on Issue {
                    id
                    title
                    body
                    number
                    milestone {
                      id
                      dueOn
                      number
                      title
                    }
                    repository {
                      nameWithOwner
                      name
                      owner {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `
export const addToTheProject = `
    mutation ($project_id: ID!, $issue_id: ID!) {
      addProjectV2ItemById(input: {
        projectId: $project_id,
        contentId: $issue_id
      }) {
      item { id }
      }
    }
  `;
export const setField = `
    mutation ($project_id: ID!, $project_item_id: ID!, $tracked_field_id: ID!, $value: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $project_id,
        itemId: $project_item_id,
        fieldId: $tracked_field_id,
        value: { text: $value }
      }) {
        projectV2Item { id }
      }
    }
  `;
export const projectV2ItemByNodeId = `
query($project_item_id: ID!){
  node(id: $project_item_id) {
\t\t... on ProjectV2Item {
      id,
      fieldValues(last: 100) {
        nodes {
          ... on ProjectV2ItemFieldIterationValue {
            title,
            field {
              ... on ProjectV2IterationField {
                id
              }
            },
          },
        }
      }
    }
  }
}`
export const issueProjectV2Items = `
query($id: ID!){
  node(id: $id) {
  ... on Issue {
      projectItems(first: 10) {
        ... on ProjectV2ItemConnection {
          nodes {
            ... on ProjectV2Item {
              id,
              project {
                ... on ProjectV2 {
                  id, title
                }
              }
            }
          }
        }
      }
    }
  }
}
`