# Contributing

Fixes and enhancements are welcome, but if you are planning to do a lot of work, it is a good idea to raise an issue first to discuss it. Generally enhancements should follow the goals of the project described in the main readme:

- Allow the version to be injected into the build
- Derive the version only from the git repository itself
- Do not require the version to be maintained by hand
- Resolve the version deterministically for a given commit
- Provide an easy mechanism for incrementing major and minor versions by developers

## Getting Help

If you have found or believe you have found a bug please open a ticket. If you are having trouble using the action and need help please use the discussions page.

Since nearly all questions are related to a specific repository it can be difficult to diagnose issues from a description alone. There are a few ways to provide additional information that can help diagnose the problem.

### Creating Diagnostic Information

There is a debug option which produces diagnostic information. This information can be used to troubleshoot and even to rerun the action without access to the original repository, for example with a debugger attached. To enable this option set the `debug` input to `true` and then use the `debug_output` output to access the information. The following configuration will print the debug output to the console:

```
- name: Version
  uses: paulhatch/semantic-version@v5.4.0
  id: version
  with:
    tag_prefix: ""
    version_format: "${major}.${minor}.${patch}.${increment}"
    debug: true

- name: Print Diagnostic Output
  run: echo "$DEBUG_OUTPUT"
  env:
    DEBUG_OUTPUT: ${{ steps.version.outputs.debug_output }}
```

Please review the information before posting it to avoid disclosing any sensitive information. In particular the output may contain names and email addresses of the committers, as well as commit messages for recent commits.

### Providing a Test Case

If you are planning to open a ticket or post to discussions, it is extremely helpful if you can provide a test case that demonstrates the problem. This project includes a test helper than makes it very easy to create new tests with just a few lines of code.

To get started simply:

- Ensure you have the latest version of NodeJS installed (https://nodejs.org)
- Clone the repository, `git clone https://github.com/PaulHatch/semantic-version.git` or `git@github.com:PaulHatch/semantic-version.git`
- Run `npm install` in the root of the repository to install the dependencies
- Run `npm run test` to run the tests

The src/main.test.ts file contains integration tests that validate all the features of this action, to add a new test case simply add a new function to the bottom of this file.

```typescript
test('Name of test goes here', async () => {
    // This method creates a test repository in your temp directory, the repo
    // object returned provides methods to interact with the repository
    const repo = createTestRepo({
        // Specify any config options you want to set, the options available can be found
        // in the src/ActionConfig.ts file
        tagPrefix: ''
    });

    // the make commit method creates a commit with the specified message, an empty file will be
    // automatically created for the commit
    repo.makeCommit('Initial Commit');

    // an optional second parameter can be used to specify the path of the file to commit,
    // which will be created if it does not exist already
    repo.makeCommit('Initial Commit', 'subdir');
    
    // the exec method runs an arbitrary command in the repository
    repo.exec('git tag 0.0.1')

    // the runAction method runs the action and returns the result
    const result = await repo.runAction();

    // finally, the use whatever assertion you want to validate the result
    expect(result.formattedVersion).toBe('0.0.1+0');
}, 15000);
```

This uses the [Jest](https://jestjs.io/) testing framework. Really it is generally not necessary to be very familiar with Jest, just copy the pattern of the existing tests and you should be fine.

Once you have a failing test case that demostrates the problem, you can just past it into the ticket, there is no need to create a repository unless you want to.


### Providing an Example Repository

If you are not able to provide a test case, it is still very helpful to provide an example repository that demonstrates the problem. Many times people are experiencing problems with a configuration of a private repository. This is quite difficult to debug without access to the repository, if you are able to provide a public repository that demonstrates the problem it will make it much easier to debug and can eliminate a great deal of back and forth.

## Forking the Project

If want to do something that does not fit with the project goals, particually if you want to include information from an outside system, it is probably best to fork the project and create your own action. One of the goals of this project starting in 5.0.0 is to be easy to fork and customize, and to that end the action has been broken into individual providers than can be replaced. All providers have been implemented using async calls specifically to support calls to external systems.

The steps of this action are:

- Get the current commit
- Get the last release
- Get commits between the last release and the current commit
- Classify the release

Additionally a few formatter provide modular behavior to these step:
- A tag formmater is used to parse and format the version number
- A version formatter is used to format output version string
- A user formatter is used to format the user information in the output (JSON and CSV are provided in the default implementation)

Each one includes at least one default, but can be replaced by a custom provider by implementing the appropriate interface and updating the `ConfigurationProvider` to return your action instead. This should allow you to continue to merge in changes from the main project as needed with minimal conflict.
