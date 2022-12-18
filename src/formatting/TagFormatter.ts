import { VersionInformation } from "../providers/VersionInformation";

export interface TagFormatter {
  Format(versionInfo: VersionInformation): string;
  GetPattern(): string;
  Parse(tag: string): [major: number, minor: number, patch: number];
  IsValid(tag: string): boolean;
}
