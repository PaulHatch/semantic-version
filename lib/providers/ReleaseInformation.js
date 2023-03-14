"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleaseInformation = void 0;
// Finds the hash of the last commit
class ReleaseInformation {
    /**
     * Creates a new instance
     * @param major - the major version number
     * @param minor - the minor version number
     * @param patch - the patch version number
     * @param hash - the hash of commit of the last release
     * @param currentMajor - the major version number from the current commit
     * @param currentMinor - the minor version number from the current commit
     * @param currentPatch - the patch version number from the current commit
     * @param isTagged - whether the current commit is tagged with a version
     */
    constructor(major, minor, patch, hash, currentMajor, currentMinor, currentPatch, isTagged) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.hash = hash;
        this.currentMajor = currentMajor;
        this.currentMinor = currentMinor;
        this.currentPatch = currentPatch;
        this.isTagged = isTagged;
    }
}
exports.ReleaseInformation = ReleaseInformation;
