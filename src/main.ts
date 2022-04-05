import { runAction } from './action';
import { ActionConfig } from './ActionConfig';
import { ConfigurationProvider } from './ConfigurationProvider';
import { VersionResult } from './VersionResult';
import * as core from '@actions/core';

function setOutput(versionResult: VersionResult) {
  const { major, minor, patch, increment, formattedVersion, versionTag, changed, authors, currentCommit, previousCommit, previousVersion } = versionResult;

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
  core.setOutput("changed", changed.toString());
  core.setOutput("version_tag", versionTag);
  core.setOutput("authors", authors);
  core.setOutput("lastVersion", authors);
  core.setOutput("previous_commit", previousCommit);
  core.setOutput("previous_version", previousVersion);
}

export async function run() {

  const config: ActionConfig = {
    branch: core.getInput('branch'),
    tagPrefix: core.getInput('tag_prefix'),
    majorPattern: core.getInput('major_pattern'),
    minorPattern: core.getInput('minor_pattern'),
    versionFormat: core.getInput('version_format'),
    changePath: core.getInput('change_path'),
    namespace: core.getInput('namespace'),
    bumpEachCommit: core.getInput('bump_each_commit') === 'true',
    searchCommitBody: core.getInput('search_commit_body') === 'true',
    userFormatType: core.getInput('user_format_type')
  };

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