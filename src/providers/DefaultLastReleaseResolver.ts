import { cmd } from "../CommandRunner";
import { TagFormatter } from "../formatting/TagFormatter";
import { LastReleaseResolver } from "./LastReleaseResolver";
import { ReleaseInformation } from "./ReleaseInformation";
import { ActionConfig } from "../ActionConfig";
import * as core from '@actions/core';

export class DefaultLastReleaseResolver implements LastReleaseResolver {

    private changePath: string;
    private useBranches: boolean;

    constructor(config: ActionConfig) {
        this.changePath = config.changePath;
        this.useBranches = config.useBranches;
    }

    async ResolveAsync(current: string, tagFormatter: TagFormatter): Promise<ReleaseInformation> {
        const releasePattern = tagFormatter.GetPattern();

        let currentTag = (await cmd(
            `git tag --points-at ${current} ${releasePattern}`
        )).trim();

        currentTag = tagFormatter.IsValid(currentTag) ? currentTag : '';
        const isTagged = currentTag !== '';

        const [currentMajor, currentMinor, currentPatch] = !!currentTag ? tagFormatter.Parse(currentTag) : [null, null, null];
        core.info("VAGO DefaultLastReleaseResolver.ResolveAsync: currentTag: " + currentTag + ", currentMajor: " + currentMajor + ", currentMinor: " + currentMinor + ", currentPatch: " + currentPatch);

        let tagsCount = 0;

        let tag = '';
        try {
            const refPrefixPattern = this.useBranches ? 'refs/heads/' : 'refs/tags/';
            if (!!currentTag) {
                // If we already have the current branch tagged, we are checking for the previous one
                // so that we will have an accurate increment (assuming the new tag is the expected one)
                const command = `git for-each-ref --sort=-v:*refname --format=%(refname:short) --merged=${current} ${refPrefixPattern}${releasePattern}`;
                const tags = (await cmd(command)).split('\n')
                tagsCount = tags.length;
                tag = tags
                    .find(t => tagFormatter.IsValid(t) && t !== currentTag) || '';

            } else {
                const command = `git for-each-ref --sort=-v:*refname --format=%(refname:short) --merged=${current} ${refPrefixPattern}${releasePattern}`;
                const tags = (await cmd(command)).split('\n')
                tagsCount = tags.length;
                tag = tags
                    .find(t => tagFormatter.IsValid(t)) || '';
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

                if (tagsCount > 0) {
                    core.warning(`None of the ${tagsCount} tags(s) found were valid version tags for the present configuration. If this is unexpected, check to ensure that the configuration is correct and matches the tag format you are using.`);
                } else {
                    core.warning('No tags are present for this repository. If this is unexpected, check to ensure that tags have been pulled from the remote.');
                }
            }
            const [major, minor, patch] = tagFormatter.Parse('');
            core.info("VAGO tag was empty: " + major + ", " + minor + ", " + patch);
            // no release tags yet, use the initial commit as the root
            return new ReleaseInformation(major, minor, patch, '', currentMajor, currentMinor, currentPatch, isTagged);
        }

        // parse the version tag
        const [major, minor, patch] = tagFormatter.Parse(tag);
        core.info("VAGO tag was not empty: "+ tag + ", " + major + ", " + minor + ", " + patch);
        const root = await cmd('git', `merge-base`, tag, current);
        return new ReleaseInformation(major, minor, patch, root.trim(), currentMajor, currentMinor, currentPatch, isTagged);
    }

}