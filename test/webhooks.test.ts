import nock from "nock";
// Requiring our app implementation
import myProbotApp from "../src/webhooks";
import { Probot, ProbotOctokit } from "probot";
// Requiring our fixtures

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

  test("noop", () => {
    expect(1).toStrictEqual(1);
  });


  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
