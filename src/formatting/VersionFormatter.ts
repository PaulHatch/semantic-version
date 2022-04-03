import { VersionInformation } from "../providers/VersionInformation";

// Formatters
export interface VersionFormatter {
  Format(versionInfo: VersionInformation): string;
}
