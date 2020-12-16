![Build](https://github.com/PaulHatch/semantic-version/workflows/Build/badge.svg)

# Git-Based Semantic Versioning

This action produces a [semantic version](https://semver.org) for a repository
using the repository's git history.

This action is designed to facilitate assigning version numbers during a build
automatically while publishing version that only increment by one value per
release. To accomplish this, the next version number is calculated along with
a commit increment indicating the number of commits for this version. The
commit messages are inspected to determine the type of version change the next
version represents. Including the term `(MAJOR)` or `(MINOR)` in the commit
message alters the type of change the next version will represent.

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
a label to be created to mark pre-release versions.

![Commits Graph](versioning.drawio.svg?raw=true)

## Major and Minor Versions

The commit messages for the span of commits from the last tag are checked for the
presence of the designated terms (`(MAJOR)` or `(MINOR)` by default), if a term
is encountered that commit is treated as the start of a major or minor version
instead of the default patch level. As with normal commits the implied version
will only increment by one value since the last tag regardless of how many major
or minor commits are encountered. Major commits override minor commits, so a set
of commits containing both will result in a major version increment. 

![Commits Graph](minor.drawio.svg?raw=true)

## A Note Regarding Tags

Adding a tag to an older commit changes the implicit version of commits since the
tagged commit. If a tag is assigned to an older commit, the commits that come after
it will be given the new version if the build were to be retriggered, for example:

![Commits Graph](tagging.drawio.svg?raw=true)

# Usage

<!-- start usage -->

```yaml
- uses: paulhatch/semantic-version@v3.1.2
  with:
    # The prefix to use to identify tags
    tag_prefix: "v"
    # A string which, if present in a git commit, indicates that a change represents a
    # major (breaking) change
    major_pattern: "(MAJOR)"
    # Same as above except indicating a minor change
    minor_pattern: "(MINOR)"
    # A string to determine the format of the version output
    format: "${major}.${minor}.${patch}-prerelease.${increment}"
    # Optional path to check for changes. If any changes are detected in the path the
    # 'changed' output will true. Enter multiple paths separated by spaces.
    change_path: "src/my-service"
    # Named version, will be used as suffix for name version tag
    namespace: project-b
```

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
If this value is set, it will be appended to the end of tags for the version,
and only tags with this value appended will be considered when determining the
version.

Finally, set different values for `major_pattern` and `minor_pattern` than the
other projects in order to be able to mark these commits independently.

To use secondary versions in a workflow, simply create additional steps in a
job referencing semantic version multiple times. For example:

```yaml
- name: Application Version
  id: version
  uses: paulhatch/semantic-version@v3.1.2
  with:
    change_path: "src/service"
- name: Database Version
  id: db-version
  uses: paulhatch/semantic-version@v3.1.2
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

```
  - name: Checkout
    uses: actions/checkout@v2
    with:
      fetch-depth: 0
```

