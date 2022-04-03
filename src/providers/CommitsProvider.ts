import { CommitInfoSet } from "./CommitInfoSet";

/**
 * Defines a provider to retrieve commit information for a range of commits
 */

export interface CommitsProvider {
  /**
   * Gets the commit information for a range of commits
   * @param startHash - The hash of commit of the last release, result should be exclusive
   * @param endHash - The hash of the current commit, result should be inclusive
   */
  GetCommitsAsync(startHash: string, endHash: string): Promise<CommitInfoSet>;
}
