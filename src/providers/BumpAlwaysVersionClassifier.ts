import { ActionConfig } from "../ActionConfig";
import { CommitInfo } from "./CommitInfo";
import { CommitInfoSet } from "./CommitInfoSet";
import { DefaultVersionClassifier } from "./DefaultVersionClassifier";
import { ReleaseInformation } from "./ReleaseInformation";
import { VersionClassification } from "./VersionClassification";
import { VersionType } from "./VersionType";

export class BumpAlwaysVersionClassifier extends DefaultVersionClassifier {
  protected patchPattern: (commit: CommitInfo) => boolean;
  protected enablePrereleaseMode: boolean;

  constructor(config: ActionConfig) {
    super(config);

    this.enablePrereleaseMode = config.enablePrereleaseMode;
    this.patchPattern = !config.bumpEachCommitPatchPattern
      ? (_) => true
      : this.parsePattern(
          config.bumpEachCommitPatchPattern,
          "",
          config.searchCommitBody,
        );
  }

  public override async ClassifyAsync(
    lastRelease: ReleaseInformation,
    commitSet: CommitInfoSet,
  ): Promise<VersionClassification> {
    if (lastRelease.currentPatch !== null) {
      return new VersionClassification(
        VersionType.None,
        0,
        false,
        <number>lastRelease.currentMajor,
        <number>lastRelease.currentMinor,
        <number>lastRelease.currentPatch,
      );
    }

    const filteredCommitSet = this.filterIgnoredCommits(commitSet);

    let { major, minor, patch } = lastRelease;
    let type = VersionType.None;
    let increment = 0;

    if (filteredCommitSet.commits.length === 0) {
      return new VersionClassification(type, 0, false, major, minor, patch);
    }

    for (let commit of filteredCommitSet.commits.reverse()) {
      if (this.majorPattern(commit)) {
        type = VersionType.Major;
      } else if (this.minorPattern(commit)) {
        type = VersionType.Minor;
      } else if (
        this.patchPattern(commit) ||
        (major === 0 &&
          minor === 0 &&
          patch === 0 &&
          commitSet.commits.length > 0)
      ) {
        type = VersionType.Patch;
      } else {
        type = VersionType.None;
      }

      if (this.enablePrereleaseMode && major === 0) {
        switch (type) {
          case VersionType.Major:
          case VersionType.Minor:
            minor += 1;
            patch = 0;
            increment = 0;
            break;
          case VersionType.Patch:
            patch += 1;
            increment = 0;
            break;
          default:
            increment++;
            break;
        }
      } else {
        switch (type) {
          case VersionType.Major:
            major += 1;
            minor = 0;
            patch = 0;
            increment = 0;
            break;
          case VersionType.Minor:
            minor += 1;
            patch = 0;
            break;
          case VersionType.Patch:
            patch += 1;
            increment = 0;
            break;
          default:
            increment++;
            break;
        }
      }
    }

    return new VersionClassification(
      type,
      increment,
      true,
      major,
      minor,
      patch,
    );
  }
}
