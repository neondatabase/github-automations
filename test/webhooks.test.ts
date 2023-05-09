import nock from "nock";
// Requiring our app implementation
import myProbotApp from "../src/webhooks";
import { Probot, ProbotOctokit } from "probot";
// Requiring our fixtures
import payload from "./fixtures/issues.opened.json";
import issueWithParents from "./fixtures/issueWithParents.json";

const { parse } = require('graphql');
const fs = require("fs");
const path = require("path");

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8"
);

describe("Probot app", () => {
  let probot: any;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    // Load our app into probot
    probot.load(myProbotApp);
  });

  test("adds an issue to the project on open/edit", async () => {
    let mutations : Array<string> = [];

    const mock = nock("https://api.github.com")
      // Test that we correctly return a test token
      .post("/app/installations/2/access_tokens")
      .reply(201, {
        token: "test",
        permissions: {
          issues: "write",
        },
      })
      // Intercept issueWithParents query
      .post("/graphql", /CrossReferencedEvent/g)
      .reply(200, issueWithParents)
      // Intercept project mutations
      .post("/graphql", /mutation \(\$project_id/m)
      .times(3) // 3-shot matcher
      .reply(200, (_uri, requestBody: any) => {
        // take the mutation name to construct the response, which is the same
        // accross all mutations except the the enclosing object key is each time
        // set as the mutation name
        let query = parse(requestBody.query);
        let mutation = query.definitions[0].selectionSet.selections[0].name.value;

        // save the mutation name to match array later
        mutations.push(mutation);

        // simulate response
        let resp : any = {data:{}};
        resp.data[mutation] = { item: { id: 'proj_id' }};
        return resp;
      });

    // Receive a webhook event
    await probot.receive({ name: "issues", payload });

    expect(mock.pendingMocks()).toStrictEqual([]);
    expect(mutations).toStrictEqual([
      'addProjectV2ItemById',
      'updateProjectV2ItemFieldValue',
      'updateProjectV2ItemFieldValue'
    ]);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
