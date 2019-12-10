const cp = require('child_process');
const path = require('path');
const process = require('process');

// Action input variables
process.env['INPUT_BRANCH'] = "master";
process.env['INPUT_TAG_PREFIX'] = "v";
process.env['INPUT_MAJOR_PATTERN'] = "(MAJOR)";
process.env['INPUT_MINOR_PATTERN'] = "(MINOR)";
process.env['INPUT_FORMAT'] = "${major}.${minor}.${patch}";

// Creates a randomly named git repository and returns a function to execute commands in it
const createTestRepo = (inputs) => {
    const repoDirectory = `/tmp/test${Math.random().toString(36).substring(2, 15)}`;
    cp.execSync(`mkdir ${repoDirectory} && git init ${repoDirectory}`);

    let env = {};
    if (inputs !== undefined) {
        for (let key in inputs) {
            env[`INPUT_${key.toUpperCase()}`] = inputs[key];
        }
    }

    const run = (command) => execute(repoDirectory, command, env);

    // Configure up git user
    run(`git config user.name "Test User"`);
    run(`git config user.email "test@example.com"`);

    let i = 1;

    return {
        clean: () => execute('/tmp', `rm -rf ${repoDirectory}`),
        makeCommit: (msg) => {
            run(`touch test${i++}`);
            run(`git add --all`);
            run(`git commit -m '${msg}'`);
        },
        runAction: () => run(`node ${path.join(__dirname, 'index.js')}`),
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

test('Tagging does not break version', () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit(`Second Commit`); // 0.0.1+1
    repo.exec('git tag v0.0.1')
    const result = repo.runAction();

    expect(result).toMatch('Version is 0.0.1+1');

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
})
