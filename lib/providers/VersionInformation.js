"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionInformation = void 0;
/**
 * Represents the "resolved" information about a version change, serves
 * as the input to formatters that produce the final output
 */
class VersionInformation {
    /**
     * Creates a new version information instance
     * @param major - The major version number
     * @param minor - The minor version number
     * @param patch - The patch version number
     * @param increment - The number of commits for this version
     * @param type - The type of change the current range represents
     * @param commits - The list of commits for this version
     * @param changed - True if the version has changed, false otherwise
     * @param isTagged - True if the current commit is a version-tagged commit
     */
    constructor(major, minor, patch, increment, type, commits, changed, isTagged) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.increment = increment;
        this.type = type;
        this.commits = commits;
        this.changed = changed;
        this.isTagged = isTagged;
    }
}
exports.VersionInformation = VersionInformation;
