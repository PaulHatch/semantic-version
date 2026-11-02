import { VersionInformation } from "../providers/VersionInformation.js";

// Formatters
export interface VersionFormatter {
  Format(versionInfo: VersionInformation): string;
}
