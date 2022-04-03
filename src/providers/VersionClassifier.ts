import { CommitInfoSet } from "./CommitInfoSet";
import { ReleaseInformation } from "./ReleaseInformation";
import { VersionClassification } from "./VersionClassification";

/**
 * Defines the 'business logic' to turn commits into parameters for creating
 * output values
 */
export interface VersionClassifier {
  /**
   * Produces the version classification for a given commit set
   * @param lastRelease - The last release information
   * @param commitSet - The commits to classify, ordered from most recent to oldest
   * @returns - The version classification
   */
  ClassifyAsync(lastRelease: ReleaseInformation, commitSet: CommitInfoSet): Promise<VersionClassification>;
}
