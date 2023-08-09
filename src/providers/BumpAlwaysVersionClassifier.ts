import { ActionConfig } from "../ActionConfig";
import { CommitInfo } from "./CommitInfo";
import { CommitInfoSet } from "./CommitInfoSet";
import { DefaultVersionClassifier } from "./DefaultVersionClassifier";
import { ReleaseInformation } from "./ReleaseInformation";
import { VersionClassification } from "./VersionClassification";
import { VersionType } from "./VersionType";

export class BumpAlwaysVersionClassifier extends DefaultVersionClassifier {

    protected patchPattern: (commit: CommitInfo) => boolean;

    constructor(config: ActionConfig) {
        super(config);

        this.patchPattern = !config.bumpEachCommitPatchPattern ?
            _ => true :
            this.parsePattern(config.bumpEachCommitPatchPattern, "", config.searchCommitBody);
    }

    public override async ClassifyAsync(lastRelease: ReleaseInformation, commitSet: CommitInfoSet): Promise<VersionClassification> {

        if (lastRelease.currentPatch !== null) {
            return new VersionClassification(VersionType.None, 0, false, <number>lastRelease.currentMajor, <number>lastRelease.currentMinor, <number>lastRelease.currentPatch);
        }

        let { major, minor, patch } = lastRelease;
        let type = VersionType.None;
        let increment = 0;

        if (commitSet.commits.length === 0) {
            return new VersionClassification(type, 0, false, major, minor, patch);
        }

        for (let commit of commitSet.commits.reverse()) {
            if (this.majorPattern(commit)) {
                major += 1;
                minor = 0;
                patch = 0;
                type = VersionType.Major;
                increment = 0;
            } else if (this.minorPattern(commit)) {
                minor += 1;
                patch = 0;
                type = VersionType.Minor;
                increment = 0;
            } else {
                if (this.patchPattern(commit) ||
                    (major === 0 && minor === 0 && patch === 0 && commitSet.commits.length > 0)) {
                    patch += 1;
                    type = VersionType.Patch;
                    increment = 0;
                } else {
                    type = VersionType.None;
                    increment++;
                }
            }
        }

        return new VersionClassification(type, increment, true, major, minor, patch);
    }
}