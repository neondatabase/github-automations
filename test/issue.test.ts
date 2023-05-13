import { Issue } from "../src/shared/issue";
import issueWithParents from "./fixtures/issueWithParents.json";

const check_has_parent = (rawIssue: any, body: string) => {
  rawIssue.timelineItems.nodes[0].source.body = body;
  let issue = new Issue(rawIssue);
  expect(issue.parents.length).toStrictEqual(1);
  expect(issue.parents[0].number).toStrictEqual(11);
}

var check_has_no_parent = (rawIssue: any, body: string) => {
  rawIssue.timelineItems.nodes[0].source.body = body;
  let issue = new Issue(rawIssue);
  expect(issue.parents.length).toStrictEqual(0);
}

describe("Issue class", () => {
  let rawIssue: any;

  beforeEach(() => {
    rawIssue = JSON.parse(JSON.stringify(issueWithParents.data.node));
  });

  test("it counts subtasks", () => {
    delete rawIssue.timelineItems;
    rawIssue.body = `
        Some task text:
        - [ ] task1
        - [x] task2
        - [ ] #123
    `.replace(/ {8}/gm, '');

    let issue = new Issue(rawIssue);
    expect(issue.progress()).toStrictEqual('1 / 3');
  });

  test("it skips progress on issues without subtasks", () => {
    rawIssue.body = `Some task text.`;
    let issue = new Issue(rawIssue);
    expect(issue.progress()).toStrictEqual('-');
  });

  test("it sets the parent within the same repo", () => {
    check_has_parent(rawIssue, "* [ ] #22");
    check_has_parent(rawIssue, "* [x] #22");

    check_has_parent(rawIssue, "- [ ] #22");
    check_has_parent(rawIssue, "- [x] #22");
    check_has_parent(rawIssue, "- [ ]  #22  ");
    check_has_parent(rawIssue, "- [ ]  org/repo#22  ");
    check_has_parent(rawIssue, "- [x]  org/repo#22  ");
    check_has_parent(rawIssue, "- [ ]  org/repo/issues/22  ");
    check_has_parent(rawIssue, "- [x]  https://github.com/org/repo/issues/22  ");

    check_has_no_parent(rawIssue, "- [ ] text #22");
    check_has_no_parent(rawIssue, "- [ ] #22 text");
    check_has_no_parent(rawIssue, "- [ ] #12341324");
    check_has_no_parent(rawIssue, "- [ ]  org/repo2#22  ");
    check_has_no_parent(rawIssue, "- [x]  org/repo2#22  ");
    check_has_no_parent(rawIssue, "- [ ]  org/repo2/issues/22  ");
    check_has_no_parent(rawIssue, "- [x]  https://github.com/org/repo2/issues/22  ");
  });

  test("it sets the parent within the different repos", () => {
    rawIssue.repository.nameWithOwner = "org/repo2";

    check_has_parent(rawIssue, "* [ ]  org/repo2#22  ");

    check_has_parent(rawIssue, "- [ ]  org/repo2#22  ");
    check_has_parent(rawIssue, "- [x]  org/repo2#22  ");
    check_has_parent(rawIssue, "- [ ]  org/repo2/issues/22  ");
    check_has_parent(rawIssue, "- [x]  https://github.com/org/repo2/issues/22  ");

    check_has_no_parent(rawIssue, "- [ ] #22");
    check_has_no_parent(rawIssue, "- [x] #22");
  });

  test("it deals with several parents", () => {
    let parent = rawIssue.timelineItems.nodes[0];
    parent.source.body = "- [ ] #22";

    let second_parent = JSON.parse(JSON.stringify(parent));
    second_parent.source.number = 12;
    second_parent.source.title = 'second parent';
    rawIssue.timelineItems.nodes.push(second_parent);

    let issue = new Issue(rawIssue);
    expect(issue.parents.length).toStrictEqual(2);
    // expect(issue.trackedIn()).toStrictEqual("bot test (https://github.com/org/repo/issues/11), second parent (https://github.com/org/repo/issues/12)");
  });

  test("it parses issue data correctly", () => {
    const issue = new Issue(rawIssue);

    expect(issue.parseIssueData('#123')).toStrictEqual({
      number: 123,
      repo: 'repo'
    });
    expect(issue.parseIssueData('org/other_repo#123')).toStrictEqual({
      number: 123,
      repo: 'other_repo'
    });
    expect(issue.parseIssueData('org/another_repo/issues/123')).toStrictEqual({
      number: 123,
      repo: 'another_repo'
    });
    expect(issue.parseIssueData('https://github.com/org/another_repo/issues/123')).toStrictEqual({
      number: 123,
      repo: 'another_repo'
    });

    expect(issue.parseIssueData('other_org/another_repo/#123')).toBeUndefined();
    expect(issue.parseIssueData('https://github.com/other_org/another_repo/123')).toBeUndefined();

    expect(issue.parseIssueData('kind of #123')).toBeUndefined();
    expect(issue.parseIssueData('kind of another_repo#123')).toBeUndefined();
    expect(issue.parseIssueData('kind of org/another_repo/123')).toBeUndefined();
    expect(issue.parseIssueData('kind of https://github.com/org/another_repo/123')).toBeUndefined();

    expect(issue.parseIssueData('#123i')).toBeUndefined();
    expect(issue.parseIssueData('another_repo#123i')).toBeUndefined();
    expect(issue.parseIssueData('org/another_repo/123i')).toBeUndefined();
    expect(issue.parseIssueData('https://github.com/org/another_repo/123i')).toBeUndefined();
  });
});
