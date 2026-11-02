import { cmd } from "../CommandRunner.js";
import { TagFormatter } from "../formatting/TagFormatter.js";
import { LastReleaseResolver } from "./LastReleaseResolver.js";
import { ReleaseInformation } from "./ReleaseInformation.js";
import { ActionConfig } from "../ActionConfig.js";
import * as core from "@actions/core";

export class DefaultLastReleaseResolver implements LastReleaseResolver {
  private changePath: string;
  private useBranches: boolean;

  constructor(config: ActionConfig) {
    this.changePath = config.changePath;
    this.useBranches = config.useBranches;
  }

  async ResolveAsync(
    current: string,
    tagFormatter: TagFormatter,
  ): Promise<ReleaseInformation> {
    const releasePattern = tagFormatter.GetPattern();

    // A commit may have several tags, use the highest one which is a valid version tag
    const currentTag =
      (
        await cmd(
          `git tag --points-at ${current} --sort=-v:refname ${releasePattern}`,
        )
      )
        .split("\n")
        .map((t) => t.trim())
        .find((t) => tagFormatter.IsValid(t)) || "";
    const isTagged = currentTag !== "";

    const [currentMajor, currentMinor, currentPatch] = currentTag
      ? tagFormatter.Parse(currentTag)
      : [null, null, null];

    let tagsCount = 0;
    let tag = "";
    try {
      const refPrefixPattern = this.useBranches ? "refs/heads/" : "refs/tags/";
      // If the current commit is already tagged we look for the release before it so that
      // the increment is accurate (assuming the new tag is the expected one)
      const command = `git for-each-ref --sort=-v:*refname --format=%(refname:short) --merged=${current} ${refPrefixPattern}${releasePattern}`;
      const tags = (await cmd(command))
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t !== "");
      tagsCount = tags.length;
      tag = tags.find((t) => tagFormatter.IsValid(t) && t !== currentTag) || "";
    } catch (err) {
      tag = "";
    }

    if (tag === "") {
      // When the current commit carries the only release tag there is no previous release
      // and nothing to warn about. Without a remote we assume there are no other tags to
      // pull, which also keeps the test output from being polluted with warnings.
      if (!isTagged && (await cmd("git", "remote")) !== "") {
        if (tagsCount > 0) {
          core.warning(
            `None of the ${tagsCount} tags(s) found were valid version tags for the present configuration. If this is unexpected, check to ensure that the configuration is correct and matches the tag format you are using. If you have not yet tagged this repo with a version tag, this can be ignored.`,
          );
        } else {
          core.warning(
            "No tags are present for this repository. If this is unexpected, check to ensure that tags have been pulled from the remote. If you have not yet tagged this repo with a version tag, this can be ignored.",
          );
        }
      }
      const [major, minor, patch] = tagFormatter.Parse("");
      // no release tags yet, use the initial commit as the root
      return new ReleaseInformation(
        major,
        minor,
        patch,
        "",
        currentMajor,
        currentMinor,
        currentPatch,
        isTagged,
      );
    }

    // parse the version tag
    const [major, minor, patch] = tagFormatter.Parse(tag);
    const root = await cmd("git", `merge-base`, tag, current);
    return new ReleaseInformation(
      major,
      minor,
      patch,
      root.trim(),
      currentMajor,
      currentMinor,
      currentPatch,
      isTagged,
    );
  }
}
