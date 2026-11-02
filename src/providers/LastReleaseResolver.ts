import { TagFormatter } from "../formatting/TagFormatter.js";
import { ReleaseInformation } from "./ReleaseInformation.js";

export interface LastReleaseResolver {
  ResolveAsync(
    current: string,
    tagFormatter: TagFormatter,
  ): Promise<ReleaseInformation>;
}
