import { expect, test } from "@jest/globals";
import { ActionConfig } from "../ActionConfig.js";
import { CommitInfo } from "./CommitInfo.js";
import { CommitInfoSet } from "./CommitInfoSet.js";
import { DefaultVersionClassifier } from "./DefaultVersionClassifier.js";
import { ReleaseInformation } from "./ReleaseInformation.js";

test("Regular expressions can be used as minor tag direct", async () => {
  const classifier = new DefaultVersionClassifier({
    ...new ActionConfig(),
    ...{ tagPrefix: "", minorPattern: "/S[a-z]+Value/" },
  });

  const releaseInfo = new ReleaseInformation(
    0,
    0,
    1,
    "",
    null,
    null,
    null,
    false,
  );
  const commitSet = new CommitInfoSet(false, [
    new CommitInfo(
      "",
      "Second Commit SomeValue",
      "",
      "",
      "",
      new Date(),
      "",
      "",
      new Date(),
      [],
    ),
    new CommitInfo(
      "",
      "Initial Commit",
      "",
      "",
      "",
      new Date(),
      "",
      "",
      new Date(),
      [],
    ),
  ]);

  const result = await classifier.ClassifyAsync(releaseInfo, commitSet);

  expect(result.major).toBe(0);
  expect(result.minor).toBe(1);
  expect(result.patch).toBe(0);
  expect(result.increment).toBe(0);
});
