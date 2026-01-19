// Finds the hash of the last commit
export class ReleaseInformation {
  /**
   * Creates a new instance
   * @param major - the major version number
   * @param minor - the minor version number
   * @param patch - the patch version number
   * @param hash - the hash of commit of the last release
   * @param currentMajor - the major version number from the current commit
   * @param currentMinor - the minor version number from the current commit
   * @param currentPatch - the patch version number from the current commit
   * @param isTagged - whether the current commit is tagged with a version
   */
  constructor(
    public major: number,
    public minor: number,
    public patch: number,
    public hash: string,
    public currentMajor: number | null,
    public currentMinor: number | null,
    public currentPatch: number | null,
    public isTagged: boolean,
  ) {}
}
