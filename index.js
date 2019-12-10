const core = require('@actions/core');
const exec = require("@actions/exec");
const eol = require('os').EOL;

const cmd = async (command, ...args) => {
  let output = '';
  const options = {
    silent: true
  };
  options.listeners = {
    stdout: (data) => { output += data.toString(); }
  };

  await exec.exec(command, args, options)
    .catch(err => { core.error(`${command} ${args.join(' ')} failed: ${err}`); throw err; });
  return output;
};

async function run() {
  try {
    const remote = await cmd('git', 'remote');
    const remoteExists = remote !== '';
    const remotePrefix = remoteExists ? 'origin/' : '';

    const tagPrefix = core.getInput('tag_prefix', { required: true });
    const branch = `${remotePrefix}${core.getInput('branch', { required: true })}`;
    const majorPattern = core.getInput('major_pattern', { required: true });
    const minorPattern = core.getInput('minor_pattern', { required: true });

    const releasePattern = `refs/tags/${tagPrefix}*`;
    let major = 0, minor = 0, patch = 0, increment = 0;

    let tag = (await cmd(
      'git',
      `for-each-ref`,
      `--format='%(refname:short)'`,
      `--sort=-committerdate`,
      releasePattern
    )).split(eol)[0].trim().replace(/'/g, "");

    let root;
    if (tag === '') {
      const isEmpty = (await cmd('git', `status`)).includes('No commits yet');
      if (isEmpty) {
        // empty repo
        core.info('Version is 0.0.0+0');
        core.setOutput("version", '0.0.0+0');
        core.setOutput("major", '0');
        core.setOutput("minor", '0');
        core.setOutput("patch", '0');
        core.setOutput("increment", '0');
        return;
      } else {
        // no release tags yet, use the initial commit as the root
        root = '';
      }
    } else {
      // parse the version tag
      let tagParts = tag.split('/');
      let versionValues = tagParts[tagParts.length - 1]
        .substr(tagPrefix.length)
        .split('.');

      major = parseInt(versionValues[0]);
      minor = parseInt(versionValues[1]);
      patch = parseInt(versionValues[2]);

      if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
        throw `Invalid tag ${tag}`;
      }

      root = await cmd('git', `merge-base`, tag, branch);
    }
    root = root.trim();

    const log = await cmd(
      'git',
      'log',
      '--pretty="%s"',
      '--author-date-order',
      root === '' ? branch : `${root}..${branch}`);

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

    let version = `${major}.${minor}.${patch}`;
    core.info(`Version is ${version}+${increment}`);
    core.setOutput("version", version);
    core.setOutput("major", major.toString());
    core.setOutput("minor", minor.toString());
    core.setOutput("patch", patch.toString());
    core.setOutput("increment", increment.toString());

  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
