import { cmd } from "../CommandRunner";
import { TagFormatter } from "../formatting/TagFormatter";
import { LastReleaseResolver } from "./LastReleaseResolver";
import { ReleaseInformation } from "./ReleaseInformation";
import { ActionConfig } from "../ActionConfig";
import * as core from '@actions/core';

export class TagLastReleaseResolver implements LastReleaseResolver {

    private changePath: string;

    constructor(config: ActionConfig) {
        this.changePath = config.changePath;
    }

    async ResolveAsync(current: string, tagFormatter: TagFormatter): Promise<ReleaseInformation> {
        const releasePattern = tagFormatter.GetPattern();

        let currentTag = (await cmd(
            `git tag --points-at ${current} ${releasePattern}`
        )).trim();
        const [currentMajor, currentMinor, currentPatch] = !!currentTag ? tagFormatter.Parse(currentTag) : [null, null, null];

        let tag = '';
        try {
            if (!!currentTag) {
                // If we already have the current branch tagged, we are checking for the previous one
                // so that we will have an accurate increment (assuming the new tag is the expected one)
                const command = `git for-each-ref --count=2 --sort=-v:*refname --format=%(refname:short) --merged=${current} refs/tags/${releasePattern}`;
                tag = await cmd(command);
                tag = tag.split('\n').at(-1) || '';
            } else {
                const command = `git for-each-ref --count=1 --sort=-v:*refname --format=%(refname:short) --merged=${current} refs/tags/${releasePattern}`;
                tag = await cmd(command);
            }

            tag = tag.trim();
        }
        catch (err) {
            tag = '';
        }

        if (tag === '') {
            if (await cmd('git', 'remote') !== '') {

                // Since there is no remote, we assume that there are no other tags to pull. In
                // practice this isn't likely to happen, but it keeps the test output from being
                // polluted with a bunch of warnings.

                core.warning('No tags are present for this repository. If this is unexpected, check to ensure that tags have been pulled from the remote.');
            }
            // no release tags yet, use the initial commit as the root
            return new ReleaseInformation(0, 0, 0, '', currentMajor, currentMinor, currentPatch);
        }

        // parse the version tag
        const [major, minor, patch] = tagFormatter.Parse(tag);
        const root = await cmd('git', `merge-base`, tag, current);
        return new ReleaseInformation(major, minor, patch, root.trim(), currentMajor, currentMinor, currentPatch);
    }

}