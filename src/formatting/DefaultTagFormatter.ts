import { TagFormatter } from './TagFormatter';
import { VersionInformation } from "../providers/VersionInformation";
import { ActionConfig } from '../ActionConfig';

/** Default tag formatter which allows a prefix to be specified */
export class DefaultTagFormatter implements TagFormatter {

  private tagPrefix: string;
  private namespace: string;
  private namespaceSeperator: string;

  constructor(config: ActionConfig) {
    this.namespace = config.namespace;
    this.tagPrefix = config.tagPrefix;
    this.namespaceSeperator = '-'; // maybe make configurable in the future
  }

  public Format(versionInfo: VersionInformation): string {
    const result = `${this.tagPrefix}${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch}`;

    if (!!this.namespace) {
      return `${result}${this.namespaceSeperator}${this.namespace}`;
    }

    return result;
  }

  public GetPattern(): string {

    if (!!this.namespace) {
      return `${this.tagPrefix}*[0-9].*[0-9].*[0-9]${this.namespaceSeperator}${this.namespace}`;
    }

    return `${this.tagPrefix}*[0-9].*[0-9].*[0-9]`;
  }

  public Parse(tag: string): [major: number, minor: number, patch: number] {

    let tagParts = tag
      .replace(this.tagPrefix, '<--!PREFIX!-->')
      .replace(this.namespace, '<--!NAMESPACE!-->')
      .split('/');

    const stripedTag = tagParts[tagParts.length - 1]
      .replace('<--!PREFIX!-->', this.tagPrefix)
      .replace('<--!NAMESPACE!-->', this.namespace);

    let versionValues = stripedTag
      .substring(this.tagPrefix.length)
      .slice(0, this.namespace === '' ? 999 : -(this.namespace.length + 1))
      .split('.');

    let major = parseInt(versionValues[0]);
    let minor = versionValues.length > 1 ? parseInt(versionValues[1]) : 0;
    let patch = versionValues.length > 2 ? parseInt(versionValues[2]) : 0;

    if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
      throw `Invalid tag ${tag} (${versionValues})`;
    }

    return [major, minor, patch];
  };

  public IsValid(tag: string): boolean {
    const regexEscape = (literal: string) => literal.replace(/\W/g, '\\$&');
    const tagPrefix = regexEscape(this.tagPrefix);
    const namespaceSeperator = regexEscape(this.namespaceSeperator);
    const namespace = regexEscape(this.namespace);

    if (!!this.namespace) {
      return new RegExp(`^${tagPrefix}[0-9]+\.[0-9]+\.[0-9]+${namespaceSeperator}${namespace}$`).test(tag);
    }

    return new RegExp(`^${tagPrefix}[0-9]+\.[0-9]+\.[0-9]+$`).test(tag);
  }
}
