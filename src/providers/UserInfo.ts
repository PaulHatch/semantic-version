/** Represents information about a user (e.g. committer, author, tagger) */
export class UserInfo {
  /**
   * Creates a new instance
   * @param name - User's name
   * @param email - User's email
   * @param commits - Number of commits in the scope evaluated
   */
  constructor(
    public name: string,
    public email: string,
    public commits: number,
  ) {}
}
