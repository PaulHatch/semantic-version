/** Represents information about a commit */
export class CommitInfo {
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
  constructor(
    public hash: string,
    public subject: string,
    public body: string,
    public author: string,
    public authorEmail: string,
    public authorDate: Date,
    public committer: string,
    public committerEmail: string,
    public committerDate: Date,
    public tags: string[],
  ) {}
}
