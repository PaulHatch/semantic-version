<p align="center">
  <a href="https://github.com/paulhatch/semantic-version"><img alt="GitHub Actions status" src="https://github.com/paulhatch/semantic-version/workflows/test-local/badge.svg"></a>
</p>

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

# Usage

<!-- start usage -->

```yaml
- uses: paulhatch/semantic-version@v1-beta
  with:
    # The branch to count commits on
    branch: "master"
    # The prefix to use to identify tags
    tag_prefix: "v"
    # A string which, if present in a git commit, indicates that a change represents a major (breaking) change
    major_pattern: "(MAJOR)"
    # Same as above except indicating a minor change
    minor_pattern: "(MINOR)"
    # A string to determine the format of the version output
    format: "${major}.${minor}.${patch}-prerelease.${increment}"
    # Path to check for changes. If any changes are detected in the path the 'changed' output will true. Enter multiple paths separated by spaces.
    change_path: "src/my-service"
```
