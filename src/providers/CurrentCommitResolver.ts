/** Resolver to obtain information about the repository */
export interface CurrentCommitResolver {
  /**
   * Resolves the current commit.
   * @returns The current commit.
   */
  ResolveAsync(): Promise<string>;
  /**
   * Returns true if the repository is empty
   * @returns True if the repository is empty
   */
  IsEmptyRepoAsync(): Promise<boolean>;
}
