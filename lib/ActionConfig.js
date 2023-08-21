"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionConfig = void 0;
/** Represents the input configuration for the semantic-version action */
class ActionConfig {
    constructor() {
        /** Set to specify a specific branch, default is the current HEAD */
        this.branch = "HEAD";
        /** The prefix to use to identify tags */
        this.tagPrefix = "v";
        /** Use branches instead of tags */
        this.useBranches = false;
        /** A string which, if present in a git commit, indicates that a change represents a major (breaking) change. Wrap with '/' to match using a regular expression. */
        this.majorPattern = "(MAJOR)";
        /** A string which indicates the flags used by the `majorPattern` regular expression. */
        this.majorFlags = "";
        /** A string which, if present in a git commit, indicates that a change represents a minor (feature) change. Wrap with '/' to match using a regular expression. */
        this.minorPattern = "(MINOR)";
        /** A string which indicates the flags used by the `minorPattern` regular expression. */
        this.minorFlags = "";
        /** Pattern to use when formatting output version */
        this.versionFormat = '${major}.${minor}.${patch}';
        /** Path to check for changes. If any changes are detected in the path the 'changed' output will true. Enter multiple paths separated by spaces. */
        this.changePath = '';
        /** Use to create a named sub-version. This value will be appended to tags created for this version. */
        this.namespace = "";
        /** If true, every commit will be treated as a bump to the version. */
        this.bumpEachCommit = false;
        /** If true, the body of commits will also be searched for major/minor patterns to determine the version type */
        this.searchCommitBody = false;
        /** The output method used to generate list of users, 'csv' or 'json'. Default is 'csv'. */
        this.userFormatType = "csv";
        /** Prevents pre-v1.0.0 version from automatically incrementing the major version. If enabled, when the major version is 0, major releases will be treated as minor and minor as patch. Note that the versionType output is unchanged.  */
        this.enablePrereleaseMode = false;
        /** If bump_each_commit is also set to true, setting this value will cause the version to increment only if the pattern specified is matched. */
        this.bumpEachCommitPatchPattern = "";
        /** If enabled, diagnostic information will be added to the action output. */
        this.debug = false;
        /** Diagnostics to replay */
        this.replay = null;
    }
}
exports.ActionConfig = ActionConfig;
