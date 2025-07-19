import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as os from 'os';
import { expect, test } from '@jest/globals'
import { runAction } from '../src/action';
import { ConfigurationProvider } from './ConfigurationProvider';
import { ActionConfig } from './ActionConfig';
import { DebugManager } from './DebugManager';

const windows = process.platform === "win32";
const timeout = 30000;

// Creates a randomly named git repository and returns a function to execute commands in it
const createTestRepo = (repoDefaultConfig?: Partial<ActionConfig>) => {
    const repoDirectory = path.join(os.tmpdir(), `test${Math.random().toString(36).substring(2, 15)}`);
    cp.execSync(`mkdir ${repoDirectory}`);
    cp.execSync(`git init --initial-branch=master ${repoDirectory}`);

    const run = (command: string) => {
        return execute(repoDirectory, command);
    }

    // Configure up git user
    run(`git config user.name "Test User"`);
    run(`git config user.email "test@example.com"`);
    run(`git config commit.gpgsign false`);

    let i = 1;

    return {
        makeCommit: (msg: string, path: string = '') => {
            if (windows) {
                run(`fsutil file createnew ${path !== '' ? path.trim() + '/' : ''}test${i++} 0`);
            } else {
                run(`touch ${path !== '' ? path.trim() + '/' : ''}test${i++}`);
            }
            run(`git add --all`);
            run(`git commit -m "${msg}"`);
        },
        merge: (branch: string) => {
            run(`git merge ${branch}`);
        },
        runAction: async (inputs?: Partial<ActionConfig>) => {
            DebugManager.clearState();
            let config = new ActionConfig();
            config = { ...config, ...{ versionFormat: "${major}.${minor}.${patch}+${increment}" }, ...repoDefaultConfig, ...inputs };
            process.chdir(repoDirectory);
            return await runAction(new ConfigurationProvider(config));
        },
        exec: run
    };
};

// Executes a set of commands in the specified directory
const execute = (workingDirectory: string, command: string, env?: any) => {
    try {
        return String(cp.execSync(command, { env: { ...process.env, ...env }, cwd: workingDirectory }));
    }
    catch (e: any) {
        throw e;
    }
};

test('Empty repository version is correct', async () => {
    const repo = createTestRepo(); // 0.0.0+0
    var result = await repo.runAction();

    expect(result.formattedVersion).toBe('0.0.0+0');
}, timeout);

test('Repository with commits shows increment', async () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit(`Second Commit`); // 0.0.1+1
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('0.0.1+1');
}, timeout);

test('Repository show commit for checked out commit', async () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit(`Second Commit`); // 0.0.1+1
    let result = await repo.runAction();
    expect(result.formattedVersion).toBe('0.0.1+1');

    repo.exec(`git checkout HEAD~1`); // 0.0.1+1
    result = await repo.runAction();
    expect(result.formattedVersion).toBe('0.0.1+0');
}, timeout);

test('Tagging does not break version', async () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit(`Second Commit`); // 0.0.1+1
    repo.makeCommit(`Third Commit`); // 0.0.1+2
    repo.exec('git tag v0.0.1')
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('0.0.1+2');
}, timeout);


test('Tagging does not break version from previous tag', async () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.exec('git tag v0.0.1')
    repo.makeCommit(`Second Commit`); // 0.0.2+0
    repo.makeCommit(`Third Commit`); // 0.0.2+1
    repo.exec('git tag v0.0.2')
    const result = await repo.runAction();
    expect(result.formattedVersion).toBe('0.0.2+1');
}, timeout);

test('Minor update bumps minor version and resets increment', async () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('feat: Second Commit'); // 0.1.0+0
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('0.1.0+0');
}, timeout);

test('Major update bumps major version and resets increment', async () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('feat!: Second Commit'); // 1.0.0+0
    const result = await repo.runAction();


    expect(result.formattedVersion).toBe('1.0.0+0');
}, timeout);

test('Multiple major commits are idempotent', async () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('feat!: Second Commit'); // 1.0.0+0
    repo.makeCommit('fix!: Third Commit'); // 1.0.0+1
    const result = await repo.runAction();


    expect(result.formattedVersion).toBe('1.0.0+1');
}, timeout);

test('Minor commits after a major commit are ignored', async () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('feat!: Second Commit'); // 1.0.0+0
    repo.makeCommit('feat: Third Commit'); // 1.0.0+1
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('1.0.0+1');
}, timeout);

test('Tags start new version', async () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit'); // 0.0.1+1
    repo.exec('git tag v0.0.1');
    repo.makeCommit('Third Commit'); // 0.0.2+0
    const result = await repo.runAction();


    expect(result.formattedVersion).toBe('0.0.2+0');
}, timeout);

test('Version pulled from last release branch', async () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.exec('git tag v0.0.1');
    repo.makeCommit('Second Commit'); // 0.0.2+0
    repo.exec('git tag v5.6.7');
    repo.makeCommit('Third Commit'); // 5.6.7+0
    const result = await repo.runAction();


    expect(result.formattedVersion).toBe('5.6.8+0');
}, timeout);

test('Merged tags do not affect version', async () => {

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
    repo.merge('release/0.0.1');
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('0.0.3+1');
}, timeout);

test('Format input is respected', async () => {
    const repo = createTestRepo({ versionFormat: 'M${major}m${minor}p${patch}i${increment}' }); // M0m0p0i0

    repo.makeCommit('Initial Commit'); // M1m2p3i0
    repo.exec('git tag v1.2.3');
    repo.makeCommit(`Second Commit`); // M1m2p4i0
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('M1m2p4i0');
}, timeout);

test('Version prefixes are not required/can be empty', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.makeCommit(`Second Commit`); // 0.0.2
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('0.0.2+0');
}, timeout);

test('Tag order comes from commit order, not tag create order', async () => {
    const repo = createTestRepo(); // 0.0.0+0

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit'); // 0.0.1+1
    repo.makeCommit('Third Commit'); // 0.0.1+2
    repo.exec('git tag v2.0.0');
    // Can't timeout in this context on Windows, ping localhost to delay
    repo.exec(windows ? 'ping 127.0.0.1 -n 2' : 'sleep 2');
    repo.exec('git tag v1.0.0 HEAD~1');
    repo.makeCommit('Fourth Commit'); // 0.0.1+2

    const result = await repo.runAction();


    expect(result.formattedVersion).toBe('2.0.1+0');
}, timeout);


test('Change detection is true by default', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.makeCommit(`Second Commit`); // 0.0.2
    const result = await repo.runAction();

    expect(result.changed).toBe(true);
}, timeout);

test('Changes to monitored path is true when change is in path', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.exec('mkdir project1');
    repo.makeCommit(`Second Commit`, 'project1'); // 0.0.2
    const result = await repo.runAction({ changePath: "project1" });

    expect(result.changed).toBe(true);
}, timeout);

test('Changes to monitored path is false when changes are not in path', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.exec('mkdir project1');
    repo.exec('mkdir project2');
    repo.makeCommit(`Second Commit`, 'project2'); // 0.0.2
    const result = await repo.runAction({ changePath: "project1" });

    expect(result.changed).toBe(false);
}, timeout);

test('Changes can be detected without tags', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('mkdir project1');
    repo.makeCommit(`Second Commit`, 'project1'); // 0.0.2
    const result = await repo.runAction({ changePath: "project1" });

    expect(result.changed).toBe(true);
}, timeout);

test('Changes to multiple monitored path is true when change is in path', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.exec('mkdir project1');
    repo.exec('mkdir project2');
    repo.makeCommit(`Second Commit`, 'project2'); // 0.0.2
    const result = await repo.runAction({ changePath: "project1 project2" });

    expect(result.changed).toBe(true);
}, timeout);

test('Changes to multiple monitored path is false when change is not in path', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.exec('mkdir project1');
    repo.exec('mkdir project2');
    repo.exec('mkdir project3');
    repo.makeCommit(`Second Commit`, 'project3'); // 0.0.2
    const result = await repo.runAction({ changePath: "project1 project2" });

    expect(result.changed).toBe(false);
}, timeout);


test('Namespace is tracked separately', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.makeCommit('Second Commit'); // 0.0.2
    repo.exec('git tag 0.1.0-subproject');
    repo.makeCommit('Third Commit'); // 0.0.2 / 0.1.1

    const result = await repo.runAction();
    const subprojectResult = await repo.runAction({ namespace: "subproject" });

    expect(result.formattedVersion).toBe('0.0.2+1');
    expect(subprojectResult.formattedVersion).toBe('0.1.1+0');
}, timeout);


test('Version Namespace is tracked separately', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.makeCommit('Second Commit'); // 0.0.2
    repo.exec('git tag subproject0.1.0');
    repo.makeCommit('Third Commit'); // 0.0.2 / 0.1.1

    const result = await repo.runAction();
    const subprojectResult = await repo.runAction({ tagPrefix: "subproject" });

    expect(result.formattedVersion).toBe('0.0.2+1');
    expect(subprojectResult.formattedVersion).toBe('0.1.1+0');
}, timeout);

test('Namespace allows dashes', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.makeCommit('Second Commit'); // 0.0.2
    repo.exec('git tag "0.1.0-sub/project"');
    repo.makeCommit('Third Commit'); // 0.0.2 / 0.1.1

    const result = await repo.runAction();
    const subprojectResult = await repo.runAction({ namespace: "sub/project" });

    expect(result.formattedVersion).toBe('0.0.2+1');
    expect(subprojectResult.formattedVersion).toBe('0.1.1+0');
}, timeout);

test('Commits outside of path are not counted', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Second Commit');
    repo.makeCommit('Third Commit');

    const result = await repo.runAction({ changePath: "project1" });

    expect(result.formattedVersion).toBe('0.0.0+0');
}, timeout);

test('Commits inside path are counted', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Second Commit');
    repo.makeCommit('Third Commit');
    repo.exec('mkdir project1');
    repo.makeCommit('Fourth Commit', 'project1'); // 0.0.1+0
    repo.makeCommit('Fifth Commit', 'project1'); // 0.0.1+1
    repo.makeCommit('Sixth Commit', 'project1'); // 0.0.1+2

    const result = await repo.runAction({ changePath: "project1" });

    expect(result.formattedVersion).toBe('0.0.1+2');
}, timeout);

test('Current tag is used', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Second Commit');
    repo.makeCommit('Third Commit');
    repo.exec('git tag 7.6.5');

    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('7.6.5+0');
}, timeout);

test('Bump each commit works', async () => {

    const repo = createTestRepo({ tagPrefix: '', bumpEachCommit: true }); // 0.0.0

    expect((await repo.runAction()).formattedVersion).toBe('0.0.0+0');
    repo.makeCommit('Initial Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.1+0');
    repo.makeCommit('Second Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.2+0');
    repo.makeCommit('Third Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.3+0');
    repo.makeCommit('feat: Fourth Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.1.0+0');
    repo.makeCommit('Fifth Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.1.1+0');
    repo.makeCommit('feat!: Sixth Commit');
    expect((await repo.runAction()).formattedVersion).toBe('1.0.0+0');
    repo.makeCommit('Seventh Commit');
    expect((await repo.runAction()).formattedVersion).toBe('1.0.1+0');
}, timeout);

test('Bump each commit picks up tags', async () => {
    const repo = createTestRepo({ tagPrefix: '', bumpEachCommit: true }); // 0.0.0

    expect((await repo.runAction()).formattedVersion).toBe('0.0.0+0');
    repo.makeCommit('Initial Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.1+0');
    repo.makeCommit('Second Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.2+0');
    repo.makeCommit('Third Commit');
    repo.exec('git tag 3.0.0');
    expect((await repo.runAction()).formattedVersion).toBe('3.0.0+0');
    repo.makeCommit('Fourth Commit');
    expect((await repo.runAction()).formattedVersion).toBe('3.0.1+0');
}, timeout);

test('Increment not affected by matching tag', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.1

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit'); // 0.0.1+1
    repo.exec('git tag 0.0.1');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.1+1');
}, timeout);

test('Regular expressions can be used as major tag', async () => {
    const repo = createTestRepo({ tagPrefix: '', majorPattern: '/S[a-z]+Value/' }); // 0.0.1

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit SomeValue'); // 1.0.0+0
    expect((await repo.runAction()).formattedVersion).toBe('1.0.0+0');
}, timeout);

test('Regular expressions can be used as minor tag', async () => {
    const repo = createTestRepo({ tagPrefix: '', minorPattern: '/S[a-z]+Value/' }); // 0.0.1

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit SomeValue'); // 0.0.1+1
    expect((await repo.runAction()).formattedVersion).toBe('0.1.0+0');
}, timeout);

test('Regular expressions and flags can be used as major tag', async () => {
    const repo = createTestRepo({ tagPrefix: '', majorPattern: '/s[a-z]+value/', majorFlags: 'i' }); // 0.0.1

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit SomeValue'); // 1.0.0+0
    expect((await repo.runAction()).formattedVersion).toBe('1.0.0+0');
}, timeout);

test('Regular expressions and flags can be used as minor tag', async () => {
    const repo = createTestRepo({ tagPrefix: '', minorPattern: '/s[a-z]+value/', minorFlags: 'i' }); // 0.0.1

    repo.makeCommit('Initial Commit'); // 0.0.1+0
    repo.makeCommit('Second Commit SomeValue'); // 0.0.1+1
    expect((await repo.runAction()).formattedVersion).toBe('0.1.0+0');
}, timeout);

test('Tag prefix can include forward slash', async () => {
    const repo = createTestRepo({ tagPrefix: 'version/' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.exec('git tag version/1.2.3');
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('1.2.3+0');
}, timeout);

test('Tags immediately before merge are detected', async () => {
    const repo = createTestRepo({ tagPrefix: 'v' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Commit 1');
    repo.exec('git tag v1.0.0');
    repo.makeCommit('Commit 2');
    repo.exec('git checkout -b feature/branch');
    repo.makeCommit('Commit 3');
    repo.makeCommit('Commit 4');
    repo.exec('git tag v2.0.0');
    repo.exec('git checkout master');
    repo.makeCommit('Commit 5');
    repo.merge('feature/branch');
    const result = await repo.runAction();

    expect(result.versionTag).toBe('v2.0.1');
}, timeout);

test('Correct tag is detected on merged branches', async () => {
    const repo = createTestRepo({ tagPrefix: 'v' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Commit 1');
    repo.exec('git tag v1.0.0');
    repo.makeCommit('Commit 2');
    repo.exec('git checkout -b feature/branch');
    repo.makeCommit('Commit 3');
    repo.exec('git tag v2.0.0');
    repo.makeCommit('Commit 4');
    repo.exec('git checkout master');
    repo.makeCommit('Commit 5');
    repo.merge('feature/branch');
    const result = await repo.runAction();

    expect(result.versionTag).toBe('v2.0.1');
}, timeout);

test('Correct tag is detected on multiple branches', async () => {
    const repo = createTestRepo({ tagPrefix: 'v' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Commit 1');
    repo.exec('git checkout -b feature/branch1');
    repo.exec('git tag v1.0.0');
    repo.makeCommit('Commit 2');
    repo.exec('git checkout master');
    repo.merge('feature/branch1');
    repo.exec('git checkout -b feature/branch2');
    repo.makeCommit('Commit 3');
    repo.exec('git tag v2.0.0');
    repo.makeCommit('Commit 4');
    repo.exec('git checkout master');
    repo.makeCommit('Commit 5');
    repo.merge('feature/branch2');
    const result = await repo.runAction();

    expect(result.versionTag).toBe('v2.0.1');
}, timeout);

test('Correct tag is detected when versions pass 10s place', async () => {
    const repo = createTestRepo({ tagPrefix: 'v' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Commit 1');
    repo.exec('git checkout -b feature/branch1');
    repo.exec('git tag v10.15.0');
    repo.makeCommit('Commit 2');
    repo.exec('git checkout master');
    repo.merge('feature/branch1');
    repo.exec('git checkout -b feature/branch2');
    repo.makeCommit('Commit 3');
    repo.exec('git tag v10.7.0');
    repo.makeCommit('Commit 4');
    repo.exec('git checkout master');
    repo.makeCommit('Commit 5');
    repo.merge('feature/branch2');
    const result = await repo.runAction();

    expect(result.versionTag).toBe('v10.15.1');
}, timeout);

test('Tags on unmerged branches are not considered', async () => {
    const repo = createTestRepo({ tagPrefix: 'v' }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Commit 1');
    repo.exec('git checkout -b feature/branch1');
    repo.makeCommit('Commit 2');
    repo.exec('git tag v2.0.0');
    repo.makeCommit('Commit 3');
    repo.exec('git checkout master');
    repo.makeCommit('Commit 4');
    repo.exec('git tag v1.0.0');
    repo.makeCommit('Commit 5');
    const result = await repo.runAction();

    expect(result.versionTag).toBe('v1.0.1');
}, timeout);

test('Can use branches instead of tags', async () => {
    const repo = createTestRepo({ tagPrefix: 'release/', useBranches: true }); // 0.0.0

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Commit 1');
    repo.exec('git checkout -b release/1.0.0');
    repo.makeCommit('Commit 2');
    repo.exec('git checkout master');
    repo.merge('release/1.0.0');
    repo.makeCommit('Commit 3');
    const result = await repo.runAction();

    expect(result.versionTag).toBe('release/1.0.1');
}, timeout);

test('Correct previous version is returned', async () => {
    const repo = createTestRepo();

    repo.makeCommit('Initial Commit');
    repo.exec('git tag v2.0.1');
    repo.makeCommit(`Second Commit`);
    repo.makeCommit(`Third Commit`);
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('2.0.2+1');
    expect(result.previousVersion).toBe('2.0.1');
}, timeout);

test('Correct previous version is returned when multiple tags are present', async () => {
    const repo = createTestRepo();

    repo.makeCommit('Initial Commit');
    repo.exec('git tag v1.0.1');
    repo.makeCommit(`Second Commit`);
    repo.exec('git tag v2.0.1');
    repo.makeCommit(`Third Commit`);
    repo.exec('git tag v3.0.1');
    repo.makeCommit(`Fourth Commit`);
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('3.0.2+0');
    expect(result.previousVersion).toBe('3.0.1');
}, timeout);

test('Correct previous version is returned when using branches', async () => {
    const repo = createTestRepo({ tagPrefix: 'release/', useBranches: true });

    repo.makeCommit('Initial Commit');
    repo.exec('git checkout -b release/2.0.1');
    repo.makeCommit(`Second Commit`);
    repo.exec('git checkout master');
    repo.merge('release/2.0.1');
    repo.makeCommit(`Third Commit`);
    const result = await repo.runAction();

    expect(result.previousVersion).toBe('2.0.1');
    expect(result.formattedVersion).toBe('2.0.2+0');
}, timeout);

test('Correct previous version is returned when directly tagged', async () => {
    const repo = createTestRepo();

    repo.makeCommit('Initial Commit');
    repo.exec('git tag v2.0.1')
    repo.makeCommit(`Second Commit`);
    repo.makeCommit(`Third Commit`);
    repo.exec('git tag v2.0.2')
    const result = await repo.runAction();

    expect(result.previousVersion).toBe('2.0.1');
    expect(result.formattedVersion).toBe('2.0.2+1');
}, timeout);

test('Correct previous version is returned when directly tagged with multiple previous tags', async () => {
    const repo = createTestRepo();

    repo.makeCommit('Initial Commit');
    repo.exec('git tag v2.0.1')
    repo.makeCommit(`Second Commit`);
    repo.exec('git tag v2.0.2')
    repo.makeCommit(`Third Commit`);
    repo.exec('git tag v2.0.3')
    const result = await repo.runAction();

    expect(result.previousVersion).toBe('2.0.2');
    expect(result.formattedVersion).toBe('2.0.3+0');
}, timeout);

test('Prerelease suffixes are ignored', async () => {
    const repo = createTestRepo();

    repo.makeCommit('feat!: Initial Commit');
    repo.makeCommit(`Second Commit`);
    repo.exec('git tag v1.0.0-alpha.1')
    repo.makeCommit(`Third Commit`);
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('1.0.0+2');
}, timeout);

test('Prerelease suffixes are ignored when namespaces are set', async () => {
    const repo = createTestRepo({ namespace: 'test' });

    repo.makeCommit('feat!: Initial Commit');
    repo.exec('git tag v1.0.0-test')
    repo.makeCommit(`Second Commit`);
    repo.exec('git tag v1.0.1-test-alpha.1')
    repo.makeCommit(`Third Commit`);
    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('1.0.1+1');
}, timeout);

test('Namespace can contains a slash', async () => {
    const repo = createTestRepo({ tagPrefix: '' }); // 0.0.0

    repo.makeCommit('Initial Commit'); // 0.0.1
    repo.exec('git tag 0.0.1');
    repo.makeCommit('Second Commit'); // 0.0.2
    repo.exec('git tag 0.1.0-sub/project');
    repo.makeCommit('Third Commit'); // 0.0.2 / 0.1.1

    const result = await repo.runAction();
    const subprojectResult = await repo.runAction({ namespace: "sub/project" });

    expect(result.formattedVersion).toBe('0.0.2+1');
    expect(subprojectResult.formattedVersion).toBe('0.1.1+0');
}, timeout);

test('Namespace can contains a dot', async () => {
    const repo = createTestRepo({ tagPrefix: '' });

    repo.makeCommit('Initial Commit');
    repo.exec('git tag 0.0.1');
    repo.makeCommit('Second Commit');
    repo.exec('git tag 0.1.0-sub.project');
    repo.makeCommit('Third Commit');
    repo.exec('git tag 0.2.0-sub/project');
    repo.makeCommit('fourth Commit');

    const result = await repo.runAction();
    const subprojectResult = await repo.runAction({ namespace: "sub.project" });

    expect(result.formattedVersion).toBe('0.0.2+2');
    expect(subprojectResult.formattedVersion).toBe('0.1.1+1');
}, timeout);

test('Patch increments only once', async () => {
    const repo = createTestRepo({ tagPrefix: '', versionFormat: "${major}.${minor}.${patch}" });

    repo.makeCommit('Initial Commit');
    repo.exec('git tag 0.0.1');
    const firstResult = await repo.runAction();
    repo.makeCommit('Second Commit');
    const secondResult = await repo.runAction();
    repo.makeCommit('Third Commit');
    const thirdResult = await repo.runAction();
    repo.makeCommit('fourth Commit');
    const fourthResult = await repo.runAction();


    expect(firstResult.formattedVersion).toBe('0.0.1');
    expect(secondResult.formattedVersion).toBe('0.0.2');
    expect(thirdResult.formattedVersion).toBe('0.0.2');
    expect(fourthResult.formattedVersion).toBe('0.0.2');

}, timeout);

test('Patch increments each time when bump each commit is set', async () => {
    const repo = createTestRepo({ tagPrefix: '', versionFormat: "${major}.${minor}.${patch}", bumpEachCommit: true });

    repo.makeCommit('Initial Commit');
    repo.exec('git tag 0.0.1');
    const firstResult = await repo.runAction();
    repo.makeCommit('Second Commit');
    const secondResult = await repo.runAction();
    repo.makeCommit('Third Commit');
    const thirdResult = await repo.runAction();
    repo.makeCommit('fourth Commit');
    const fourthResult = await repo.runAction();


    expect(firstResult.formattedVersion).toBe('0.0.1');
    expect(secondResult.formattedVersion).toBe('0.0.2');
    expect(thirdResult.formattedVersion).toBe('0.0.3');
    expect(fourthResult.formattedVersion).toBe('0.0.4');

}, timeout);

test('Patch does not increment on bump each commit if a patch pattern is set', async () => {
    const repo = createTestRepo({ tagPrefix: '', versionFormat: "${major}.${minor}.${patch}+${increment}", bumpEachCommit: true, bumpEachCommitPatchPattern: '(PATCH)' });

    repo.makeCommit('Initial Commit');
    repo.exec('git tag 0.0.1');
    const firstResult = await repo.runAction();
    repo.makeCommit('Second Commit');
    const secondResult = await repo.runAction();
    repo.makeCommit('Third Commit');
    const thirdResult = await repo.runAction();
    repo.makeCommit('fourth Commit');
    const fourthResult = await repo.runAction();


    expect(firstResult.formattedVersion).toBe('0.0.1+0');
    expect(secondResult.formattedVersion).toBe('0.0.1+1');
    expect(thirdResult.formattedVersion).toBe('0.0.1+2');
    expect(fourthResult.formattedVersion).toBe('0.0.1+3');

}, timeout);

test('Patch pattern increment is correct on empty repo', async () => {
    const repo = createTestRepo({ tagPrefix: '', versionFormat: "${major}.${minor}.${patch}+${increment}", bumpEachCommit: true, bumpEachCommitPatchPattern: '(PATCH)' });


    const initialResult = await repo.runAction();
    repo.makeCommit('Initial Commit');
    const firstResult = await repo.runAction();
    repo.makeCommit('Second Commit');
    const secondResult = await repo.runAction();
    repo.makeCommit('Third Commit');
    const thirdResult = await repo.runAction();
    repo.makeCommit('fourth Commit');
    const fourthResult = await repo.runAction();

    expect(initialResult.formattedVersion).toBe('0.0.0+0');
    expect(firstResult.formattedVersion).toBe('0.0.1+0');
    expect(secondResult.formattedVersion).toBe('0.0.1+1');
    expect(thirdResult.formattedVersion).toBe('0.0.1+2');
    expect(fourthResult.formattedVersion).toBe('0.0.1+3');

}, timeout);

test('Patch pattern increment is correct/matches non-bumped on empty repo', async () => {
    const repo = createTestRepo({ tagPrefix: '', versionFormat: "${major}.${minor}.${patch}+${increment}", bumpEachCommit: true, bumpEachCommitPatchPattern: '(PATCH)' });


    repo.makeCommit('Initial Commit');
    const firstResult = await repo.runAction();
    repo.makeCommit('Second Commit');
    const secondResult = await repo.runAction();
    repo.makeCommit('Third Commit');
    const thirdResult = await repo.runAction();
    repo.makeCommit('fourth Commit');
    const fourthResult = await repo.runAction();

    expect(firstResult.formattedVersion).toBe('0.0.1+0');
    expect(secondResult.formattedVersion).toBe('0.0.1+1');
    expect(thirdResult.formattedVersion).toBe('0.0.1+2');
    expect(fourthResult.formattedVersion).toBe('0.0.1+3');

}, timeout);

test('Patch pattern applied when present using tag as initial version', async () => {
    const repo = createTestRepo({ tagPrefix: '', versionFormat: "${major}.${minor}.${patch}+${increment}", bumpEachCommit: true, bumpEachCommitPatchPattern: '(PATCH)' });


    repo.makeCommit('Initial Commit');
    repo.exec('git tag 1.0.1');
    const firstResult = await repo.runAction(); // 1.0.1+0
    repo.makeCommit('Second Commit');
    const secondResult = await repo.runAction(); // 1.0.1+1
    repo.makeCommit('Third Commit (PATCH)');
    const thirdResult = await repo.runAction(); // 1.0.2+0
    repo.makeCommit('fourth Commit');
    const fourthResult = await repo.runAction(); // 1.0.2+1

    expect(firstResult.formattedVersion).toBe('1.0.1+0');
    expect(secondResult.formattedVersion).toBe('1.0.1+1');
    expect(thirdResult.formattedVersion).toBe('1.0.2+0');
    expect(fourthResult.formattedVersion).toBe('1.0.2+1');

}, timeout);

test('Current commit is provided', async () => {
    const repo = createTestRepo({ tagPrefix: '', versionFormat: "${major}.${minor}.${patch}" });

    repo.makeCommit('Initial Commit');
    repo.makeCommit('Second Commit');
    repo.makeCommit('Third Commit');
    repo.makeCommit('fourth Commit');
    repo.exec('git tag 0.0.1');
    const result = await repo.runAction();


    expect(result.currentCommit).toBeTruthy();

}, timeout);

test('Prerelease tags are ignored on current commit', async () => {
    const repo = createTestRepo({
        minorPattern: '/.*/'
    });

    let i = 0;

    const validate = async (version: string, changed: boolean = true) => {
        const result = await repo.runAction();
        expect(result.formattedVersion).toBe(version);
        expect(result.changed).toBe(changed);
    }

    await validate('0.0.0+0', false);
    repo.makeCommit(`Commit ${i++}`);
    await validate('0.1.0+0');
    repo.exec('git tag v0.0.0');
    await validate('0.0.0+0', false);
    repo.makeCommit(`Commit ${i++}`);
    await validate('0.1.0+0');
    repo.exec('git tag v1.0.0-rc1');
    await validate('0.1.0+0');
    repo.makeCommit(`Commit ${i++}`);
    await validate('0.1.0+1');
    repo.exec('git tag v1.0.0-rc2');
    await validate('0.1.0+1');
    repo.makeCommit(`Commit ${i++}`);
    await validate('0.1.0+2');
    repo.exec('git tag v1.0.0-rc3');
    await validate('0.1.0+2');
    repo.makeCommit(`Commit ${i++}`);
    await validate('0.1.0+3');
    repo.exec('git tag v1.0.0');
    await validate('1.0.0+0', false);
    repo.makeCommit(`Commit ${i++}`);
    await validate('1.1.0+0');
    repo.exec('git tag v1.1.0-rc2');
    await validate('1.1.0+0');
    repo.makeCommit(`Commit ${i++}`);
    await validate('1.1.0+1');
    repo.exec('git tag v1.1.0-rc4');
    await validate('1.1.0+1');
    repo.makeCommit(`Commit ${i++}`);
    await validate('1.1.0+2');
    repo.exec('git tag v1.1.0-rc8');
    await validate('1.1.0+2');
    repo.makeCommit(`Commit ${i++}`);
    await validate('1.1.0+3');
    repo.exec('git tag v1.1.0-rc9');
    await validate('1.1.0+3');
    repo.makeCommit(`Commit ${i++}`);
    await validate('1.1.0+4');
}, timeout);

test('Pre-release mode does not update major version if major version is 0', async () => {
    const repo = createTestRepo({ tagPrefix: '', versionFormat: "${major}.${minor}.${patch}", enablePrereleaseMode: true });

    repo.makeCommit('Initial Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.1');
    repo.makeCommit('feat: Second Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.1');
    repo.makeCommit('feat!: Third Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.1.0');
    repo.exec('git tag 0.1.0');
    repo.makeCommit('feat!: Fourth Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.2.0');
}, timeout);

test('Pre-release mode updates major version if major version is not 0', async () => {
    const repo = createTestRepo({ tagPrefix: '', versionFormat: "${major}.${minor}.${patch}", enablePrereleaseMode: true });

    repo.makeCommit('Initial Commit');
    repo.exec('git tag 1.0.0');
    repo.makeCommit('Second Commit');
    expect((await repo.runAction()).formattedVersion).toBe('1.0.1');
    repo.makeCommit('feat: Third Commit');
    expect((await repo.runAction()).formattedVersion).toBe('1.1.0');
    repo.makeCommit('feat!: Fourth Commit');
    expect((await repo.runAction()).formattedVersion).toBe('2.0.0');
    repo.exec('git tag 2.0.0');
    repo.makeCommit('feat!: Fifth Commit');
    expect((await repo.runAction()).formattedVersion).toBe('3.0.0');
}, timeout);

test('Tagged commit is flagged as release', async () => {
    const repo = createTestRepo({ tagPrefix: 'v', versionFormat: "${major}.${minor}.${patch}-prerelease.${increment}", enablePrereleaseMode: true });

    repo.makeCommit('Initial Commit');
    repo.exec('git tag v1.0.0');
    var result = await repo.runAction();
    expect(result.formattedVersion).toBe('1.0.0-prerelease.0');
    expect(result.isTagged).toBe(true);

    repo.makeCommit('Second Commit');
    result = await repo.runAction();
    expect(result.formattedVersion).toBe('1.0.1-prerelease.0')
    expect(result.isTagged).toBe(false);

    repo.makeCommit('feat: Third Commit');
    result = await repo.runAction();
    expect(result.formattedVersion).toBe('1.1.0-prerelease.0');
    expect(result.isTagged).toBe(false);

    repo.makeCommit('feat: Fourth Commit');
    repo.exec('git tag v1.1.0')
    result = await repo.runAction();
    expect(result.formattedVersion).toBe('1.1.0-prerelease.1');
    expect(result.isTagged).toBe(true);
}, timeout);


test('Pre-release mode with bump each commit does not update major version if major version is 0', async () => {
    const repo = createTestRepo({ tagPrefix: '', versionFormat: "${major}.${minor}.${patch}", enablePrereleaseMode: true, bumpEachCommit: true });

    repo.makeCommit('Initial Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.1');
    repo.makeCommit('feat: Second Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.1.0');
    repo.makeCommit('feat!: Third Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.2.0');
    repo.exec('git tag 0.1.0');
    repo.makeCommit('feat!: Fourth Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.2.0');
}, timeout);

test('Pre-release mode with bump each commit does not update major version if major version is 0, respecting patch pattern', async () => {
    const repo = createTestRepo({
        tagPrefix: '', 
        versionFormat: "${major}.${minor}.${patch}.${increment}",
        enablePrereleaseMode: true,
        bumpEachCommit: true,
        bumpEachCommitPatchPattern: '(PATCH)',
    });

    repo.makeCommit('Initial Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.1.0');
    repo.makeCommit('Second Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.1.1');
    repo.makeCommit('Third Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.0.1.2');
    repo.makeCommit('feat!: Fourth Commit');
    expect((await repo.runAction()).formattedVersion).toBe('0.1.0.0');
}, timeout);


test('Highest tag is chosen when multiple tags are present', async () => {
    const repo = createTestRepo();

    repo.makeCommit('Initial Commit');
    repo.exec('git tag v2.0.0');
    repo.exec('git tag v1.0.0');
    repo.exec('git tag v1.5.0');
    var result = await repo.runAction();
    expect(result.formattedVersion).toBe('2.0.0+0');

    repo.exec('git tag v3.0.0');
    repo.exec('git tag v2.1.0');
    result = await repo.runAction();
    expect(result.formattedVersion).toBe('3.0.0+0');

    repo.makeCommit('Additional Commit');
    result = await repo.runAction();
    expect(result.formattedVersion).toBe('3.0.1+0');

}, timeout);


test('Debug records and replays expected data', async () => {
    const repo = createTestRepo();

    repo.makeCommit('Initial Commit');
    repo.exec('git tag v3.0.0');
    repo.makeCommit(`Second Commit`);
    const result = await repo.runAction({ debug: true });

    repo.makeCommit(`Breaking Commit`);
    repo.exec('git tag v9.9.9');

    var replayResult = await repo.runAction({ replay: result.debugOutput });

    expect(replayResult.major).toBe(result.major);
    expect(replayResult.minor).toBe(result.minor);
    expect(replayResult.patch).toBe(result.patch);
    expect(replayResult.increment).toBe(result.increment);

}, timeout);

test('Version branch using major version ignores other tags', async () => {
    const repo = createTestRepo({ versionFromBranch: true });

    repo.makeCommit('Initial Commit');
    repo.makeCommit(`Second Commit`);
    repo.exec("git checkout -b release/v3");
    repo.exec('git tag v3.0.0');
    repo.makeCommit(`Third Commit`);
    repo.exec('git tag v4.0.0');
    repo.makeCommit(`Fourth Commit`);
    repo.makeCommit(`Fifth Commit`);

    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('3.0.1+2');

}, timeout);

test('Versioning from branch always takes version from branch name even without tags', async () => {
    const repo = createTestRepo({ versionFromBranch: true });

    repo.makeCommit('Initial Commit');
    repo.makeCommit(`Second Commit`);
    repo.exec("git checkout -b release/v3.2");
    repo.makeCommit(`Third Commit`);
    repo.makeCommit(`Fourth Commit`);
    repo.makeCommit(`Fifth Commit`);

    const result = await repo.runAction();

    expect(result.formattedVersion).toBe('3.2.1+4');

}, timeout);


test('Prerelease mode does not increment to 1.x.x', async () => {
    const repo = createTestRepo({ tagPrefix: 'v', versionFormat: "${major}.${minor}.${patch}-prerelease.${increment}", enablePrereleaseMode: true });

    repo.makeCommit('Initial Commit');
    repo.exec('git tag v1.0.0');
    var result = await repo.runAction();
    expect(result.formattedVersion).toBe('1.0.0-prerelease.0');
    expect(result.isTagged).toBe(true);

    repo.makeCommit('Second Commit');
    result = await repo.runAction();
    expect(result.formattedVersion).toBe('1.0.1-prerelease.0')
    expect(result.isTagged).toBe(false);

    repo.makeCommit('feat: Third Commit');
    result = await repo.runAction();
    expect(result.formattedVersion).toBe('1.1.0-prerelease.0');
    expect(result.isTagged).toBe(false);

    repo.makeCommit('feat: Fourth Commit');
    repo.exec('git tag v1.1.0')
    result = await repo.runAction();
    expect(result.formattedVersion).toBe('1.1.0-prerelease.1');
    expect(result.isTagged).toBe(true);
}, timeout);