# github-automations

## Bot

> Zenith automation bot built with [Probot](https://github.com/probot/probot).

Now it can handle:
* automatically add new issues to the project
* update progress when issue is updated
* update tracked_in when child issue is updated (but not vice versa)

## Scripts

`./sync_issues.rb` -- walks over all open issues in console and zeniths repos and add them to https://github.com/orgs/zenithdb/projects/6. Also sets `Tracked In` field if current issue is subtask of some other issue.

Tested with ruby 2.7.3 but expected to work all 2.x/3.x versions.

In order for script to access github you need to:
1. install github cli: https://github.com/cli/cli#installation
1. give it api write access:
    ```
    gh auth login --scopes "write:org"
    ```
1. clone this repository
1. make the sync script executable:
    ```
    chmod +x sync_issues.rb
    ```

## Relevant info

Some guides on using API to manage projects: https://docs.github.com/en/issues/trying-out-the-new-projects-experience/using-the-api-to-manage-projects

Issue-related events in github actions: https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#issues

It is handy to use https://docs.github.com/en/graphql/overview/explorer to check GraphQL queries.

E.g. following query would print field id's in our project

```graphql
query { 
  node(id: "PN_kwDOBKF3Cs1e-g") {
      ... on ProjectNext {
      fields(first: 20) {
          nodes {
          id
          name
          settings
          }
      }
      }
  }
}
```

## Contributing

If you have suggestions for how zenith-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2022 Stas Kelvich <stas.kelvich@gmail.com>
