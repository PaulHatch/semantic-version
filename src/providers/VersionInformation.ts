import { CommitInfo } from "./CommitInfo";
import { VersionType } from "./VersionType";

/**
 * Represents the "resolved" information about a version change, serves
 * as the input to formatters that produce the final output
 */
export class VersionInformation {
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
  constructor(
    public major: number,
    public minor: number,
    public patch: number,
    public increment: number,
    public type: VersionType,
    public commits: CommitInfo[],
    public changed: boolean,
    public isTagged: boolean,
  ) {}
}
