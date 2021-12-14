#!/usr/bin/env ruby
require 'json'

def query(q)
    JSON.load(`gh api graphql --header 'GraphQL-Features: projects_next_graphql' -f query='#{q}'`)
end

def get_issues(repo)
  issues = []

  # we can't get more than 100 issues at once, so parametrize query with cursor
  query_builder = lambda do |condition| %Q{{
      repository (owner: "zenithdb", name: "#{repo}") {
        name
        issues (first: 100, #{condition} states: [OPEN]) {
          edges {
            cursor
          }
          nodes {
            id
            number
            title
            timelineItems(first: 10, itemTypes: CROSS_REFERENCED_EVENT) {
              nodes {
                ... on CrossReferencedEvent {
                  id
                  source {
                    ... on Issue {
                      id
                      title
                      body
                      number
                    }
                  }
                }
              }
            }
            body
          }
        }
      }
    }}
  end

  # get first 100 issues
  resp = query(query_builder.call(''))
  # and continue until result is empty
  while resp['data']['repository']['issues']['nodes'].size > 0 do
      issues += resp['data']['repository']['issues']['nodes']
      cursor = resp['data']['repository']['issues']['edges'][-1]['cursor']
      # get next 100 issues
      resp = query(query_builder.call("after: \"#{cursor}\","))
  end

  # fill tracked_in for all issues: check if issue that referenced this one has
  # markdown list with our issue number
  # XXX: cross-repo issues?
  issues = issues.map do |issue|
    {
      'id' => issue['id'],
      'number' => issue['number'],
      'title' => issue['title'],
      'tracked_in' => issue['timelineItems']['nodes']
        .filter { |timeline_item|
          body = timeline_item['source']['body']
          num = issue['number']
          body && (body.include?("- [ ] ##{num}") || body.include?("- [x] #{num}"))
        }
        .map { |timeline_item|
          src = timeline_item['source']
          "#{src['title']} (https://github.com/zenithdb/#{repo}/issues/#{src['number']})"
        }
    }
  end
end

def add_item(project_id, repo, issue)
  puts issue

  r1 = query(%Q{
    mutation {
      addProjectNextItem(input: {
        projectId: "#{project_id}"
        contentId: "#{issue['id']}"
      }) {
        projectNextItem { id }
      }
    }
  })

  project_item_id = r1['data']['addProjectNextItem']['projectNextItem']['id']


  # gh api graphql -f query='
  # query{
  #   node(id: "PN_kwDOBKF3Cs1e-g") {
  #     ... on ProjectNext {
  #       fields(first: 20) {
  #         nodes {
  #           id
  #           name
  #           settings
  #         }
  #       }
  #     }
  #   }
  # }'
  tracked_field_id = 'MDE2OlByb2plY3ROZXh0RmllbGQ0ODg0OTM='

  r2 = query(%Q{
    mutation {
      updateProjectNextItemField(input: {
        projectId: "#{project_id}"
        itemId: "#{project_item_id}"
        fieldId: "#{tracked_field_id}"
        value: "#{issue['tracked_in'].join(',')}"
      }) {
        projectNextItem { id }
      }
    }
  })

  puts r1
  puts r2
end

# gh api graphql --header 'GraphQL-Features: projects_next_graphql' -f query='
#   query {
#     organization(login: "zenithdb"){
#       projectNext(number: 6) {
#           id
#       }
#     }
#   }'
project_id = 'PN_kwDOBKF3Cs1e-g'

get_issues('zenith').each do |issue|
  add_item(project_id, 'zenith', issue)
end

get_issues('console').each do |issue|
  add_item(project_id, 'console', issue)
end
