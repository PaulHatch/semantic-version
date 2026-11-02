import { VersionFormatter } from "./VersionFormatter.js";
import { VersionInformation } from "../providers/VersionInformation.js";
import { ActionConfig } from "../ActionConfig.js";

export class DefaultVersionFormatter implements VersionFormatter {
  private formatString: string;

  constructor(config: ActionConfig) {
    this.formatString = config.versionFormat;
  }

  public Format(versionInfo: VersionInformation): string {
    return this.formatString
      .replace("${major}", versionInfo.major.toString())
      .replace("${minor}", versionInfo.minor.toString())
      .replace("${patch}", versionInfo.patch.toString())
      .replace("${increment}", versionInfo.increment.toString());
  }
}
