"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitInfoSet = void 0;
/** Represents information about a set of commits */
class CommitInfoSet {
    constructor(changed, commits) {
        this.changed = changed;
        this.commits = commits;
    }
}
exports.CommitInfoSet = CommitInfoSet;
