<p align="center">
  <a href="https://github.com/paulhatch/semantic-version"><img alt="GitHub Actions status" src="https://github.com/paulhatch/semantic-version/workflows/test-local/badge.svg"></a>
</p>

# Git-Based Semantic Versioning

This action produces a [semantic version](https://semver.org) for a repository
using the repository's git history.

# Usage

<!-- start usage -->

```yaml
- uses: paulhatch/semantic-version@v1
  with:
    # The main branch to count commits on
    main_branch: "master"
    # The release branch pattern which be be used as a prefix for release branches
    release_branch: "release"
    # A string which, if present in a git commit, indicates that a change represents a major (breaking) change
    major_pattern: "(MAJOR)"
    # Same as above except indicating a minor change
    minor_pattern: "(MINOR)"
```
