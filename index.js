const core = require('@actions/core');
const exec = require("@actions/exec");
const eol = require('os').EOL;

const cmd = async (command, ...args) => {
  let output = '';
  const options = {};
  options.listeners = {
    silent: true,
    stdout: (data) => { output += data.toString(); }
  };
  await exec.exec(command, args, options)
    .catch(err => core.error(err));
  return output;
};

async function run() {
  try {
    const remotePrefix = 'origin/';

    const releasePattern = `${remotePrefix}${core.getInput('release_branch', { required: true })}/*`;
    const majorPattern = core.getInput('major_pattern', { required: true });
    const minorPattern = core.getInput('minor_pattern', { required: true });
    const mainBranch = `${remotePrefix}${core.getInput('main_branch', { required: true })}`;

    let major = 0, minor = 0, patch = 0;

    let branches = await cmd(
      'git',
      `branch`,
      `-r`,
      `--list`,
      `--format='%(refname:short)'`,
      `--sort=-committerdate`,
      releasePattern
    );

    var root;
    if (branches === '') {
      // no release branches yet, use the initial commit as the root
      root = await cmd('git', `rev-list`, `--max-parents=0`, mainBranch);
    } else {
      // find the merge base between the last 
      var releaseBranch = branches.split(eol)[0];
      var versionValues = releaseBranch.split('/')[1].split('.');
      major = parseInt(versionValues[0]);
      minor = parseInt(versionValues[1]);
      patch = parseInt(versionValues[2]);

      root = await cmd('git', `merge-base`, releaseBranch, mainBranch);
    }
    root = root.trim();

    let history = (await cmd('git', 'log', '--pretty="%s"', root, mainBranch)).split(eol);

    patch++;
    var increment = history.length;
    for (var i = 0; i < history.length; i++) {
      if (history[i].indexOf(majorPattern) !== -1) {
        major++;
        minor = 0;
        patch = 0;
        increment = i + 1;
        break;
      } else if (history[i].indexOf(minorPattern) !== -1) {
        minor++;
        patch = 0;
        increment = i + 1;
        break;
      }
    }

    let version = `${major}.${minor}.${patch}`;
    core.info(`Version is ${version}+${increment}`);
    core.setOutput("version", version);
    core.setOutput("major", major);
    core.setOutput("minor", minor);
    core.setOutput("patch", patch);
    core.setOutput("increment", increment);

  } catch (error) {
    console.log(error);
    core.setFailed(error.message);
  }
}

run();
