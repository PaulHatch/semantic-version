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
        /** A string which, if present in a git commit, indicates that a change represents a major (breaking) change. Wrap with '/' to match using a regular expression. */
        this.majorPattern = "(MAJOR)";
        /** A string which, if present in a git commit, indicates that a change represents a minor (feature) change. Wrap with '/' to match using a regular expression. */
        this.minorPattern = "(MINOR)";
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
    }
}
exports.ActionConfig = ActionConfig;
