/*global test */
const cp = require('child_process');
const path = require('path');
const process = require('process');

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
    process.env['INPUT_MAIN_BRANCH'] = "master";
    process.env['INPUT_RELEASE_BRANCH'] = "release";
    process.env['INPUT_MAJOR_PATTERN'] = "(MAJOR)";
    process.env['INPUT_MINOR_PATTERN'] = "(MINOR)";

    const ip = path.join(__dirname, 'index.js');
    try {
        console.log(cp.execSync(`node ${ip}`, { env: process.env }).toString());
    }
    catch (e) {
        console.error(String(e.stdout));
        console.error(String(e.stderr));
        throw e;
    }
})
