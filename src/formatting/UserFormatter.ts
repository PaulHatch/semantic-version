import { UserInfo } from "../providers/UserInfo";

/** Formats a list of users as a string (e.g. JSON, YAML, CSV, etc) */
export interface UserFormatter {
  Format(type: string, users: UserInfo[]): string;
}
