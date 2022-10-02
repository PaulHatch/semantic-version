import { UserInfo } from "./providers/UserInfo";
import { VersionType } from "./providers/VersionType";

/** Represents the total output for the action */
export class VersionResult {
  /**
   * Creates a new result instance
   * @param major - The major version number
   * @param minor - The minor version number
   * @param patch - The patch version number
   * @param increment - The number of commits for this version (usually used to create version suffix)
   * @param versionType - The type of version, e.g. major, minor, patch
   * @param formattedVersion - The formatted semantic version
   * @param versionTag - The string to be used as a Git tag
   * @param changed - True if the version was changed, otherwise false
   * @param authors - Authors formatted according to the format mode (e.g. JSON, CSV, YAML, etc.)
   * @param currentCommit - The current commit hash 
   * @param previousCommit - The previous commit hash
   * @param previousVersion - the previous version
   */
  constructor(
    public major: number,
    public minor: number,
    public patch: number,
    public increment: number,
    public versionType: VersionType,
    public formattedVersion: string,
    public versionTag: string,
    public changed: boolean,
    public authors: string,
    public currentCommit: string,
    public previousCommit: string,
    public previousVersion: string) { }
}
