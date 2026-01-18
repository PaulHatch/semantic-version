import { VersionType } from "./VersionType";

/** The result of a version classification */
export class VersionClassification {
  /**
   * Creates a new version classification result instance
   * @param type - The type of change the current range represents
   * @param increment - The number of commits which have this version, usually zero-based
   * @param changed - True if the version has changed, false otherwise
   * @param major - The major version number
   * @param minor - The minor version number
   * @param patch - The patch version number
   */
  constructor(
    public type: VersionType,
    public increment: number,
    public changed: boolean,
    public major: number,
    public minor: number,
    public patch: number,
  ) {}
}
