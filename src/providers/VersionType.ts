
/** Indicates the type of change a particular version change represents */
export enum VersionType {
  /** Indicates a major version change */
  Major,
  /** Indicates a minor version change */
  Minor,
  /** Indicates a patch version change */
  Patch,
  /** Indicates no change--generally this means that the current commit is already tagged with a version */
  None
}
