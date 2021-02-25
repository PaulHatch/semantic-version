const cp = require('child_process');
const path = require('path');
const process = require('process');
const os = require('os');
const windows = process.platform === "win32";

// Action input variables
const defaultInputs = {
    branch: "HEAD",
    tag_prefix: "v",
    major_pattern: "(MAJOR)",
    minor_pattern: "(MINOR)",
    format: "${major}.${minor}.${patch}",
    short_tags: true,
    bump_each_commit: false
};

// Creates a randomly named git repository and returns a function to execute commands in it
const createTestRepo = (inputs) => {
    const repoDirectory = path.join(os.tmpdir(), `test${Math.random().toString(36).substring(2, 15)}`);
    cp.execSync(`mkdir ${repoDirectory}`);
    cp.execSync(`git init ${repoDirectory}`);

    const run = (command, extraInputs) => {
        const allInputs = Object.assign({ ...defaultInputs }, inputs, extraInputs);
        let env = {};
        for (let key in allInputs) {
            env[`INPUT_${key.toUpperCase()}`] = allInputs[key];
        }
        return execute(repoDirectory, command, env);
    }

    // Configure up git user
    run(`git config user.name "Test User"`);
    run(`git config user.email "test@example.com"`);

    let i = 1;

    return {
        clean: () => execute(os.tmpdir(), windows ? `rmdir /s /q ${repoDirectory}` : `rm -rf ${repoDirectory}`),
        makeCommit: (msg, path) => {
            if (windows) {
                run(`fsutil file createnew ${path !== undefined ? path.trim('/') + '/' : ''}test${i++} 0`);
            } else {
                run(`touch ${path !== undefined ? path.trim('/') + '/' : ''}test${i++}`);
            }
            run(`git add --all`);
            run(`git commit -m "${msg}"`);
        },
        runAction: (inputs) => run(`node ${path.join(__dirname, 'index.js')}`, inputs),
        exec: run
    };
};

// Executes a set of commands in the specified directory
const execute = (workingDirectory, command, env) => {
    try {
        return String(cp.execSync(command, { env: { ...process.env, ...env }, cwd: workingDirectory }));
    }
    catch (e) {
        console.error(String(e.stdout));
        console.error(String(e.stderr));
        throw e;
    }
};

test('Empty repository version is correct', () => {
    const repo = createTestRepo(); // 0.0.0+0
    var result = repo.runAction();

    expect(result).toMatch('Version is 0.0.0+0');

    repo.clean();
});

test('Repository with commits shows increment', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit(`Second Commit`); // 0.0.1+1
    const result = repo.runAction();

    expect(result).toMatch('Version is 0.0.1+1');

    repo.clean();
});

test('Repository show commit for checked out commit', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit(`Second Commit`); // 0.0.1+1
    let result = repo.runAction();
    expect(result).toMatch('Version is 0.0.1+1');

    repo.exec(`git checkout HEAD~1`); // 0.0.1+1
    result = repo.runAction();
    expect(result).toMatch('Version is 0.0.1+0');


    repo.clean();
});

test('Tagging does not break version', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit(`Second Commit`); // 0.0.1+1
    repo.makeCommit(`Third Commit`); // 0.0.1+2
    repo.exec('git tag v0.0.1')
    const result = repo.runAction();

    expect(result).toMatch('Version is 0.0.1+2');

    repo.clean();
});

test('Minor update bumps minor version and resets increment', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit (MINOR)'); // 0.1.0+0
    const result = repo.runAction();

    expect(result).toMatch('Version is 0.1.0+0');

    repo.clean();
});

test('Major update bumps major version and resets increment', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit (MAJOR)'); // 1.0.0+0
    const result = repo.runAction();


    expect(result).toMatch('Version is 1.0.0+0');

    repo.clean();
});

test('Multiple major commits are idempotent', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit (MAJOR)'); // 1.0.0+0
    repo.makeCommit('Third Commit (MAJOR)'); // 1.0.0+1
    const result = repo.runAction();


    expect(result).toMatch('Version is 1.0.0+1');

    repo.clean();
});

test('Minor commits after a major commit are ignored', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit (MAJOR)'); // 1.0.0+0
    repo.makeCommit('Third Commit (MINOR)'); // 1.0.0+1
    const result = repo.runAction();

    expect(result).toMatch('Version is 1.0.0+1');

    repo.clean();
});

test('Tags start new version', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit'); // 0.0.1+1
    repo.exec('git tag v0.0.1');
    repo.makeCommit('Third Commit'); // 0.0.2+0
    const result = repo.runAction();


    expect(result).toMatch('Version is 0.0.2+0');

    repo.clean();
});

test('Version pulled from last release branch', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.exec('git tag v0.0.1');
    repo.makeCommit('Second Commit'); // 0.0.2+0
    repo.exec('git tag v5.6.7');
    repo.makeCommit('Third Commit'); // 5.6.7+0
    const result = repo.runAction();


    expect(result).toMatch('Version is 5.6.8+0');

    repo.clean();
});

/* Removed for now
test('Tags on branches are used', () => {

    // This test checks that tags are counted correctly even if they are not on
    // the main branch:
    //  master    o--o--o--o <- expecting v0.0.2
    //                   \
    //  release           o--o <- taged v0.0.1


    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit'); // 0.0.1+1
    repo.makeCommit('Third Commit'); // 0.1.1+2
    repo.exec('git checkout -b release/0.0.1')
    repo.makeCommit('Fourth Commit'); // 0.1.1+3
    repo.exec('git tag v0.0.1');
    repo.exec('git checkout master');
    repo.makeCommit('Fifth Commit'); // 0.0.2.0
    const result = repo.runAction();

    expect(result).toMatch('Version is 0.0.2+0');

    repo.clean();
});
*/

test('Merged tags do not affect version', () => {

    // This test checks that merges don't override tags

    //                  Tagged v0.0.2
    //                      v
    //  master    o--o--o---o---o <- expecting v0.0.3+1
    //                   \     /
    //  release           o---o <- taged v0.0.1


    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit'); // 0.0.1+1
    repo.makeCommit('Third Commit'); // 0.1.1+2
    repo.exec('git checkout -b release/0.0.1')
    repo.makeCommit('Fourth Commit'); // 0.1.1+3
    repo.exec('git tag v0.0.1');
    repo.exec('git checkout master');
    repo.makeCommit('Fifth Commit'); // 0.0.2.0
    repo.exec('git tag v0.0.2');
    repo.exec('git merge release/0.0.1');
    const result = repo.runAction();

    expect(result).toMatch('Version is 0.0.3+1');

    repo.clean();
});

test('Version tags do not require all three version numbers', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit (MAJOR)'); // 1.0.0+0
    repo.exec('git tag v1');
    repo.makeCommit(`Second Commit`); // 1.0.1+0
    const result = repo.runAction();

    expect(result).toMatch('Version is 1.0.1+0');

    repo.clean();
});

test('Format input is respected', () => {
    const repo = createTestRepo({ format: 'M${major}m${minor}p${patch}i${increment}' }); // M0m0p0i0

    repo.makeCommit('Initial Commit'); // M1m2p3i0
    repo.exec('git tag v1.2.3');
    repo.makeCommit(`Second Commit`); // M1m2p4i0
    const result = repo.runAction();

    expect(result).toMatch('M1m2p4i0');

    repo.clean();
});

test('Version prefixes are not required/can be empty', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.makeCommit(`Second Commit`); // 0.0.2
    const result = repo.runAction();

    expect(result).toMatch('Version is 0.0.2');

    repo.clean();
});

test('Tag order comes from commit order, not tag create order', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit'); // 0.0.1+1
    repo.makeCommit('Third Commit'); // 0.0.1+2
    repo.exec('git tag v2.0.0');
    // Can't timeout in this context on Windows, ping localhost to delay
    repo.exec(windows ? 'ping 127.0.0.1 -n 2' : 'sleep 2');
    repo.exec('git tag v1.0.0 HEAD~1');
    repo.makeCommit('Fourth Commit'); // 0.0.1+2

    const result = repo.runAction();


    expect(result).toMatch('Version is 2.0.1+0');

    repo.clean();
});


test('Change detection is true by default', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.makeCommit(`Second Commit`); // 0.0.2
    const result = repo.runAction();

    expect(result).toMatch('::set-output name=changed::true');

    repo.clean();
});

test('Changes to monitored path is true when change is in path', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.exec('mkdir project1');
    repo.makeCommit(`Second Commit`, 'project1'); // 0.0.2
    const result = repo.runAction({ change_path: "project1" });

    expect(result).toMatch('::set-output name=changed::true');

    repo.clean();
});

test('Changes to monitored path is false when changes are not in path', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.exec('mkdir project1');
    repo.exec('mkdir project2');
    repo.makeCommit(`Second Commit`, 'project2'); // 0.0.2
    const result = repo.runAction({ change_path: "project1" });

    expect(result).toMatch('::set-output name=changed::false');

    repo.clean();
});

test('Changes can be detected without tags', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('mkdir project1');
    repo.makeCommit(`Second Commit`, 'project1'); // 0.0.2
    const result = repo.runAction({ change_path: "project1" });

    expect(result).toMatch('::set-output name=changed::true');

    repo.clean();
});

test('Changes to multiple monitored path is true when change is in path', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.exec('mkdir project1');
    repo.exec('mkdir project2');
    repo.makeCommit(`Second Commit`, 'project2'); // 0.0.2
    const result = repo.runAction({ change_path: "project1 project2" });

    expect(result).toMatch('::set-output name=changed::true');

    repo.clean();
});

test('Changes to multiple monitored path is false when change is not in path', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.exec('mkdir project1');
    repo.exec('mkdir project2');
    repo.exec('mkdir project3');
    repo.makeCommit(`Second Commit`, 'project3'); // 0.0.2
    const result = repo.runAction({ change_path: "project1 project2" });

    expect(result).toMatch('::set-output name=changed::false');

    repo.clean();
});

test('Namespace is tracked separately', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.makeCommit('Second Commit'); // 0.0.2
    repo.exec('git tag 0.1.0-subproject');
    repo.makeCommit('Third Commit'); // 0.0.2 / 0.1.1

    const result = repo.runAction();
    const subprojectResult = repo.runAction({ namespace: "subproject" });

    expect(result).toMatch('Version is 0.0.2+1');
    expect(subprojectResult).toMatch('Version is 0.1.1+0');

    repo.clean();
});

test('Commits outside of path are not counted', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Second Commit');
    repo.makeCommit('Third Commit');

    const result = repo.runAction({ change_path: "project1" });

    expect(result).toMatch('Version is 0.0.1+0');

    repo.clean();
});

test('Commits inside path are counted', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Second Commit');
    repo.makeCommit('Third Commit');
    repo.exec('mkdir project1');
    repo.makeCommit('Fourth Commit', 'project1'); // 0.0.1+0
    repo.makeCommit('Fifth Commit', 'project1'); // 0.0.1+1
    repo.makeCommit('Sixth Commit', 'project1'); // 0.0.1+2

    const result = repo.runAction({ change_path: "project1" });

    expect(result).toMatch('Version is 0.0.1+2');

    repo.clean();
});

test('Current tag is used', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Second Commit');
    repo.makeCommit('Third Commit');
    repo.exec('git tag 7.6.5');

    const result = repo.runAction();

    expect(result).toMatch('Version is 7.6.5+0');

    repo.clean();
});

test('Short tag can be switched off', () => {
    const repo = createTestRepo({ tag_prefix: '', short_tags: 'false' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Second Commit');
    repo.makeCommit('Third Commit');
    repo.exec('git tag 7');

    const result = repo.runAction();

    expect(result).toMatch('Version is 0.0.1+2');

    repo.clean();
});

test('Bump each commit works', () => {
    const repo = createTestRepo({ tag_prefix: '', bump_each_commit: true }); // 0.0.0

    expect(repo.runAction()).toMatch('Version is 0.0.0+0');
    repo.makeCommit('Initial Commit');
    expect(repo.runAction()).toMatch('Version is 0.0.1+0');
    repo.makeCommit('Second Commit');
    expect(repo.runAction()).toMatch('Version is 0.0.2+0');
    repo.makeCommit('Third Commit');
    expect(repo.runAction()).toMatch('Version is 0.0.3+0');
    repo.makeCommit('Fourth Commit (MINOR)');
    expect(repo.runAction()).toMatch('Version is 0.1.0+0');
    repo.makeCommit('Fifth Commit');
    expect(repo.runAction()).toMatch('Version is 0.1.1+0');
    repo.makeCommit('Sixth Commit (MAJOR)');
    expect(repo.runAction()).toMatch('Version is 1.0.0+0');
    repo.makeCommit('Seventh Commit');
    expect(repo.runAction()).toMatch('Version is 1.0.1+0');

    repo.clean();
});

test('Bump each commit picks up tags', () => {
    const repo = createTestRepo({ tag_prefix: '', bump_each_commit: true }); // 0.0.0

    expect(repo.runAction()).toMatch('Version is 0.0.0+0');
    repo.makeCommit('Initial Commit');
    expect(repo.runAction()).toMatch('Version is 0.0.1+0');
    repo.makeCommit('Second Commit');
    expect(repo.runAction()).toMatch('Version is 0.0.2+0');
    repo.makeCommit('Third Commit');
    repo.exec('git tag 3.0.0');
    expect(repo.runAction()).toMatch('Version is 3.0.0+0');
    repo.makeCommit('Fourth Commit');
    expect(repo.runAction()).toMatch('Version is 3.0.1+0');

    repo.clean();
});

test('Increment not affected by matching tag', () => {
    const repo = createTestRepo({ tag_prefix: '' }); // 0.0.1

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit'); // 0.0.1+1
    repo.exec('git tag 0.0.1');
    expect(repo.runAction()).toMatch('Version is 0.0.1+1');

    repo.clean();
});

test('Regular expressions can be used as major tag', () => {
    const repo = createTestRepo({ tag_prefix: '', major_pattern: '/S[a-z]+Value/' }); // 0.0.1

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit SomeValue'); // 0.0.1+1
    expect(repo.runAction()).toMatch('Version is 1.0.0+0');

    repo.clean();
});

test('Regular expressions can be used as minor tag', () => {
    const repo = createTestRepo({ tag_prefix: '', minor_pattern: '/S[a-z]+Value/' }); // 0.0.1

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit SomeValue'); // 0.0.1+1
    expect(repo.runAction()).toMatch('Version is 0.1.0+0');

    repo.clean();
});

test('Short tags disabled matches full tags', () => {
    const repo = createTestRepo({ short_tags: 'false' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Second Commit');
    repo.makeCommit('Third Commit');
    repo.exec('git tag v1.2.3');

    const result = repo.runAction();

    expect(result).toMatch('Version is 1.2.3+0');

    repo.clean();
});