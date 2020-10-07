const core = require('@actions/core');
const exec = require("@actions/exec");
const eol = '\n';

const tagPrefix = core.getInput('tag_prefix') || '';
const namespace = core.getInput('namespace') || '';

const cmd = async (command, ...args) => {
  let output = '', errors = '';
  const options = {
    silent: true
  };
  options.listeners = {
    stdout: (data) => { output += data.toString(); },
    stderr: (data) => { errors += data.toString(); },
    ignoreReturnCode: true,
    silent: true
  };

  await exec.exec(command, args, options)
    .catch(err => { core.info(`The command '${command} ${args.join(' ')}' failed: ${err}`); });

  if (errors !== '') {
    core.info(`stderr: ${errors}`);
  }

  return output;
};

const setOutput = (major, minor, patch, increment, changed, branch, namespace) => {
  const format = core.getInput('format', { required: true });
  var version = format
    .replace('${major}', major)
    .replace('${minor}', minor)
    .replace('${patch}', patch)
    .replace('${increment}', increment);

  if (namespace !== '') {
    version += `-${namespace}`
  }

  let tag;
  if (major === 0 || patch !== 0) {
    // Always tag pre-release/major version 0 as full version
    tag = `${tagPrefix}${major}.${minor}.${patch}`;
  } else if (minor !== 0) {
    tag = `${tagPrefix}${major}.${minor}`;
  } else {
    tag = `${tagPrefix}${major}`;
  }

  const repository = process.env.GITHUB_REPOSITORY;

  if (!changed) {
    core.info('No changes detected for this commit');
  }

  core.info(`Version is ${major}.${minor}.${patch}+${increment}`);
  if (repository !== undefined && !namespace) {
    core.info(`To create a release for this version, go to https://github.com/${repository}/releases/new?tag=${tag}&target=${branch.split('/').reverse()[0]}`);
  }

  core.setOutput("version", version);
  core.setOutput("major", major.toString());
  core.setOutput("minor", minor.toString());
  core.setOutput("patch", patch.toString());
  core.setOutput("increment", increment.toString());
  core.setOutput("changed", changed.toString());
  core.setOutput("version_tag", tag);

};

const parseVersion = (tag) => {

  console.log(tag);
  let tagParts = tag.split('/');
  let versionValues = tagParts[tagParts.length - 1]
    .substr(tagPrefix.length)
    .slice(0, namespace === '' ? 999 : -(namespace.length + 1))
    .split('.');

  let major = parseInt(versionValues[0]);
  let minor = versionValues.length > 1 ? parseInt(versionValues[1]) : 0;
  let patch = versionValues.length > 2 ? parseInt(versionValues[2]) : 0;

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    throw `Invalid tag ${tag} (${versionValues})`;
  }

  return [major, minor, patch];
};

async function run() {
  try {
    const remote = await cmd('git', 'remote');
    const remoteExists = remote !== '';
    const remotePrefix = remoteExists ? 'origin/' : '';

    const branch = `${remotePrefix}${core.getInput('branch', { required: true })}`;
    const majorPattern = core.getInput('major_pattern', { required: true });
    const minorPattern = core.getInput('minor_pattern', { required: true });
    const changePath = core.getInput('change_path') || '';

    const releasePattern = namespace === '' ? `${tagPrefix}*[0-9.]` : `${tagPrefix}*[0-9.]-${namespace}`;
    let major = 0, minor = 0, patch = 0, increment = 0;
    let changed = true;

    let lastCommitAll = (await cmd('git', 'rev-list', '-n1', '--all')).trim();

    if (lastCommitAll === '') {
      // empty repo
      setOutput('0', '0', '0', '0', changed, branch, namespace);
      return;
    }

    let currentTag = (await cmd(
      `git tag --points-at ${branch} ${releasePattern}`
    )).trim();

    if (currentTag) {
      [major, minor, patch] = parseVersion(currentTag);
      setOutput(major, minor, patch, 0, false, branch, namespace);
    }

    let tag = '';
    try {
      tag = (await cmd(
        'git',
        `describe`,
        `--tags`,
        `--abbrev=0`,
        `--match=${releasePattern}`,
        `${branch}~1`
      )).trim();
    }
    catch (err) {
      tag = '';
    }

    let root;
    if (tag === '') {
      if (remoteExists) {
        core.warning('No tags are present for this repository. If this is unexpected, check to ensure that tags have been pulled from the remote.');
      }
      // no release tags yet, use the initial commit as the root
      root = '';
    } else {
      // parse the version tag
      [major, minor, patch] = parseVersion(tag);

      root = await cmd('git', `merge-base`, tag, branch);
    }
    root = root.trim();

    var logCommand = `git log --pretty="%s" --author-date-order ${(root === '' ? branch : `${root}..${branch}`)}`;

    if (changePath !== '') {
      logCommand += ` -- ${changePath}`;
    }

    const log = await cmd(logCommand);

    if (changePath !== '') {
      if (root === '') {
        const changedFiles = await cmd(`git log --name-only --oneline ${branch} -- ${changePath}`);
        changed = changedFiles.length > 0;
      } else {
        const changedFiles = await cmd(`git diff --name-only ${root}..${branch} -- ${changePath}`);
        changed = changedFiles.length > 0;
      }
    }

    let history = log
      .trim()
      .split(eol)
      .reverse();

    // Discover the change time from the history log by finding the oldest log
    // that could set the version.

    const majorIndex = history.findIndex(x => x.includes(majorPattern));
    const minorIndex = history.findIndex(x => x.includes(minorPattern));

    if (majorIndex !== -1) {
      increment = history.length - (majorIndex + 1);
      patch = 0;
      minor = 0;
      major++;
    } else if (minorIndex !== -1) {
      increment = history.length - (minorIndex + 1);
      patch = 0;
      minor++;
    } else {
      increment = history.length - 1;
      patch++;
    }

    setOutput(major, minor, patch, increment, changed, branch, namespace);

  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();

