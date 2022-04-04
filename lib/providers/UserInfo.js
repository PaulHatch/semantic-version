"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInfo = void 0;
/** Represents information about a user (e.g. committer, author, tagger) */
class UserInfo {
    /**
     * Creates a new instance
     * @param name - User's name
     * @param email - User's email
     * @param commits - Number of commits in the scope evaluated
     */
    constructor(name, email, commits) {
        this.name = name;
        this.email = email;
        this.commits = commits;
    }
}
exports.UserInfo = UserInfo;
