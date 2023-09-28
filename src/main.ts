import { runAction } from './action';
import { ActionConfig } from './ActionConfig';
import { ConfigurationProvider } from './ConfigurationProvider';
import { VersionResult } from './VersionResult';
import * as core from '@actions/core';
import { VersionType } from './providers/VersionType';

function setOutput(versionResult: VersionResult) {
  const { major, minor, patch, increment, versionType, formattedVersion, versionTag, changed, isTagged, authors, currentCommit, previousCommit, previousVersion, debugOutput } = versionResult;

  const repository = process.env.GITHUB_REPOSITORY;

  if (!changed) {
    core.info('No changes detected for this commit');
  }

  core.info(`Version is ${formattedVersion}`);
  if (repository !== undefined) {
    core.info(`To create a release for this version, go to https://github.com/${repository}/releases/new?tag=${versionTag}&target=${currentCommit.split('/').slice(-1)[0]}`);
  }

  core.setOutput("version", formattedVersion);
  core.setOutput("major", major.toString());
  core.setOutput("minor", minor.toString());
  core.setOutput("patch", patch.toString());
  core.setOutput("increment", increment.toString());
  core.setOutput("version_type", VersionType[versionType].toLowerCase());
  core.setOutput("changed", changed.toString());
  core.setOutput("is_tagged", isTagged.toString());
  core.setOutput("version_tag", versionTag);
  core.setOutput("authors", authors);
  core.setOutput("previous_commit", previousCommit);
  core.setOutput("previous_version", previousVersion);
  core.setOutput("current_commit", currentCommit);
  core.setOutput("debug_output", debugOutput);
}

export async function run() {

  function toBool(value: string): boolean {
    if (!value || value.toLowerCase() === 'false') {
      return false;
    } else if (value.toLowerCase() === 'true') {
      return true;
    }
    return false;
  }
  
  function toStringOrBool(value: string): string | boolean {
    if (!value || value === 'false') {
      return false;
    }
    if (value === 'true') {
      return true;
    }
    return value;
  }  

  const config: ActionConfig = {
    branch: core.getInput('branch'),
    tagPrefix: core.getInput('tag_prefix'),
    useBranches: toBool(core.getInput('use_branches')),
    versionFromBranch: toStringOrBool(core.getInput('version_from_branch')),
    majorPattern: core.getInput('major_pattern'),
    minorPattern: core.getInput('minor_pattern'),
    majorFlags: core.getInput('major_regexp_flags'),
    minorFlags: core.getInput('minor_regexp_flags'),
    versionFormat: core.getInput('version_format'),
    changePath: core.getInput('change_path'),
    namespace: core.getInput('namespace'),
    bumpEachCommit: toBool(core.getInput('bump_each_commit')),
    searchCommitBody: toBool(core.getInput('search_commit_body')),
    userFormatType: core.getInput('user_format_type'),
    enablePrereleaseMode: toBool(core.getInput('enable_prerelease_mode')),
    bumpEachCommitPatchPattern: core.getInput('bump_each_commit_patch_pattern'),
    debug: toBool(core.getInput('debug')),
    replay: ''
  };

  if (config.useBranches) {
    core.warning(`The 'use_branches' input option is deprecated, please see the documentation for more information on how to use branches`);
  }

  if (config.versionFormat === '' && core.getInput('format') !== '') {
    core.warning(`The 'format' input is deprecated, use 'versionFormat' instead`);
    config.versionFormat = core.getInput('format');
  }
  if (core.getInput('short_tags') !== '') {
    core.warning(`The 'short_tags' input option is no longer supported`);
  }

  const configurationProvider = new ConfigurationProvider(config);
  const result = await runAction(configurationProvider);
  setOutput(result);
}

run();