![Build](https://github.com/PaulHatch/semantic-version/workflows/Build/badge.svg)

See the [configuration guide](guide.md) for help getting started, selecting a versioning strategy and example configurations, or [contributing.md](contributing.md) for information on how to get help or contribute to this project.

# Git-Based Semantic Versioning

This action produces a [semantic version](https://semver.org) for a repository
using the repository's git history without ever requiring a human to choose or
manually assign the version number.

This action is designed to facilitate assigning version numbers during a build
automatically while publishing version that only increment by one value per
release. To accomplish this, the next version number is calculated along with
a commit increment indicating the number of commits for this version. The
commit messages are inspected to determine the type of version change the next
version represents. By default, this action follows [Conventional Commits](https://www.conventionalcommits.org/)
patterns: commits with `feat:` trigger minor version bumps, and commits with a `!` suffix
(e.g., `feat!:`, `fix!:`) or containing `BREAKING CHANGE:` trigger major version bumps.

# Background

Automatic versioning during a build presents a chicken-and-egg problem--we
want the version to increase by a single value between each release, but we
usually do not know at build time whether a new build will be released or not.
Generally a build is tagged as part of a release step after passing testing and
other quality controls, so if we want to use the version number in the build
itself, especially for a build triggered by a commit, we cannot rely on having
a proper tag for the build. Most CI systems offer a "build number", but this
does not correspond to our semantic version and relies on the state of the CI
tool. It is with this in mind that this tool was developed with the following
goals:

- Allow the version to be injected into the build
- Derive the version only from the git repository itself
- Do not require the version to be maintained by hand
- Resolve the version deterministically for a given commit (see caveats below)
- Provide an easy mechanism for incrementing major and minor versions by developers

To solve this problem, this action calculates the next _implied_ version based on
the most recently tagged version and the commit messages. An additional value called
the "increment" tracks the count of commits since the last version change, allowing
a label to be created to mark pre-release versions. The version produced by this
action is always the implied version (unless `bump_each_commit` is set to `true`).
Subsequently tagging a commit that is chosen as the implied version is what bumps
the version for future commits.

![Commits Graph](versioning.drawio.svg?raw=true)

_Unless the current commit is already tagged, the version produced by this action will be one value ahead of the last tag._

## Major and Minor Versions

The commit messages for the span of commits from the last tag are checked for the
presence of version bump patterns. By default, `feat:` triggers a minor version bump,
while `!:` (e.g., `feat!:`, `fix!:`) or `BREAKING CHANGE:` triggers a major version bump. If a pattern
is encountered that commit is treated as the start of a major or minor version
instead of the default patch level. As with normal commits the implied version
will only increment by one value since the last tag regardless of how many major
or minor commits are encountered. Major commits override minor commits, so a set
of commits containing both major and minor tags will result in a major version
increment. 

![Commits Graph](minor.drawio.svg?raw=true)

## Tags on Previous Commits

Adding a tag to an older commit changes the implicit version of commits since the
tagged commit. If a tag is assigned to an older commit, the commits that come after
it will be given the new version if the build were to be retriggered, for example:

![Commits Graph](tagging.drawio.svg?raw=true)

# Usage

<!-- start usage -->

```yaml
- uses: paulhatch/semantic-version@v5.4.0
  with:
    # The prefix to use to identify tags
    tag_prefix: "v"
    # A string which, if present in a git commit, indicates that a change represents a
    # major (breaking) change, supports regular expressions wrapped with '/'
    major_pattern: "/!:|BREAKING CHANGE:/"
    # A string which indicates the flags used by the `major_pattern` regular expression. Supported flags: idgs
    major_regexp_flags: ""
    # Same as above except indicating a minor change, supports regular expressions wrapped with '/'
    minor_pattern: "/feat:/"
    # A string which indicates the flags used by the `minor_pattern` regular expression. Supported flags: idgs
    minor_regexp_flags: ""
    # A string to determine the format of the version output
    version_format: "${major}.${minor}.${patch}-prerelease${increment}"
    # Optional path to check for changes. If any changes are detected in the path the
    # 'changed' output will true. Enter multiple paths separated by spaces.
    change_path: "src/my-service"
    # Named version, will be used as suffix for name version tag
    namespace: my-service
    # If this is set to true, *every* commit will be treated as a new version.
    bump_each_commit: false
    # If bump_each_commit is also set to true, setting this value will cause the version to increment only if the pattern specified is matched.
    bump_each_commit_patch_pattern: ""
    # If true, the body of commits will also be searched for major/minor patterns to determine the version type.
    search_commit_body: false
    # The output method used to generate list of users, 'csv' or 'json'.
    user_format_type: "csv"
    # Prevents pre-v1.0.0 version from automatically incrementing the major version.
    # If enabled, when the major version is 0, major releases will be treated as minor and minor as patch. Note that the version_type output is unchanged.
    enable_prerelease_mode: true
    # If enabled, diagnostic information will be added to the action output.
    debug: false
    # If true, the branch will be used to select the maximum version.
    version_from_branch: false
```

## Outputs 

- *major*, *minor*, and *patch* provide the version numbers that have been determined for this commit
- *increment* is an additional value indicating the number of commits for the current version, starting at zero. This can be used as part of a pre-release label. 
- *version_type* is the type of version change the new version represents, e.g. `major`, `minor`, `patch`, or `none`.
- *version* is a formatted version string created using the format input. This is a convenience value to provide a preformatted representation of the data generated by this action.
- *version_tag* is a string identifier that would be used to tag the current commit as the "released" version. Typically this would only be used to generate a Git tag name.
- *changed* indicates whether there was a change since the last version if change_path was specified. If no `change_path` was specified this value will always be true since the entire repo is considered. (It is possible to create a commit with no changes, but the Git cli rejects this by default and this case is not considered here)
- *is_tagged* indicates whether the current commit has a tag matching `tag_prefix`
- *authors* is a list of authors that have committed to this version, formatted as either csv or json.
- *current_commit* is the current commit hash.
- *previous_commit* is the previous commit hash.
- *previous_version* is the previous version.
- *debug_output* will show diagnostic information, if debug is enabled

There are two types of "version" string, one is the semantic version output that can be used to identify a build and can include prerelease data and metadata specific to the commit such as `v2.0.1-pre001+cf6e75` (you would produce this string yourself using the version information from this action plus whatever metadata you wanted to add), the other is the tag version string, which identifies a specific commit as being a specific version.

## Using Multiple Versions in the Same Repository

It is possible to create additional versions for multiple project co-existing
in one repository, for example you may have a Helm chart, database migration,
or simply be hosting multiple projects in the same repository and want them to
be versioned independently. There are a few settings that can be used to
accomplish this:

First, you can set the `change_path` input to specify a path that will be
inspected for changes. Commits which do no change any files in this path will
not increase the `increment` output. In addition, if there are no changes in
a given commit with this path specified, the `changed` value will be false.

Second, the input `namespace` can be set to create an additional named version.
If this value is set, it will be appended (separated by a hyphen) to the end of
tags for the version, and only tags with this value appended will be considered
when determining the version.  The namespace will be pruned from the string
output as "version" within the action.

Finally, set different values for `major_pattern` and `minor_pattern` than the
other projects in order to be able to mark these commits independently.

To use secondary versions in a workflow, simply create additional steps in a
job referencing semantic version multiple times. For example, a project tagged
like `v1.2.3+0-db` could be configured like this:

```yaml
- name: Application Version
  id: version
  uses: paulhatch/semantic-version@v5.4.0
  with:
    change_path: "src/service"
- name: Database Version
  id: db-version
  uses: paulhatch/semantic-version@v5.4.0
  with:
    major_pattern: "(MAJOR-DB)"
    minor_pattern: "(MINOR-DB)"
    change_path: "src/migrations"
    namespace: db
```

## Important Note Regarding the Checkout action

Beginning in v2, `actions/checkout` [does not include tags/history by default](https://github.com/actions/checkout/issues/100).
This history is required to determine the version correctly. To include the history
and tags, specify the fetch-depth parameter in your checkout action declaration. Specify
zero to pull the full history and tags.

```yaml
  - name: Checkout
    uses: actions/checkout@v2
    with:
      fetch-depth: 0
```

Alternatively, you can set this number to a value high enough to pull all the commits
you'd expect to have in a release.
