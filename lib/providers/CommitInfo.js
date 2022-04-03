"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitInfo = void 0;
/** Represents information about a commit */
class CommitInfo {
    /**
     * Creates a new commit information instance
     * @param hash - The hash of the commit
     * @param subject - The subject of the commit message
     * @param body - The body of the commit message
     * @param author - The author's name
     * @param authorEmail - The author's email
     * @param authorDate - The date the commit was authored
     * @param committer - The committer's name
     * @param committerEmail - The committer's email
     * @param committerDate - The date the commit was committed
     * @param tags - List of any tags associated with this commit
     */
    constructor(hash, subject, body, author, authorEmail, authorDate, committer, committerEmail, committerDate, tags) {
        this.hash = hash;
        this.subject = subject;
        this.body = body;
        this.author = author;
        this.authorEmail = authorEmail;
        this.authorDate = authorDate;
        this.committer = committer;
        this.committerEmail = committerEmail;
        this.committerDate = committerDate;
        this.tags = tags;
    }
}
exports.CommitInfo = CommitInfo;
