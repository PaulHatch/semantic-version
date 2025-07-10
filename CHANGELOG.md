# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.4.0] - 2024-01-31

### Changed
- Updated to Node.js v20 runtime
- Updated all dependencies to latest versions

## [5.3.0] - 2023-09-30

### Added
- **Branch-based versioning mode** (`version_from_branch` input) - Major/minor versions can now be derived from branch names (e.g., `release/v1`, `release/1.2`). Only considers tags matching the branch version, useful for maintaining multiple release lines
- Enhanced diagnostics documentation in contributing guide
- Improved warning messages to clarify when no tags are found vs when tags exist but don't match criteria

### Fixed
- `GITHUB_REF_NAME` environment variable no longer causes failures during testing
- `bump_each_commit` now properly respects `enable_prerelease_mode` setting
- Non-version branches are properly ignored when using branch-based versioning

### Changed
- Updated Jest configuration for better test isolation
- Rebuilt distribution files with latest changes

### Deprecated
- `use_branches` input is deprecated and will be removed in v6.0.0 - use `version_from_branch` instead

## [5.2.1] - 2023-08-24

### Fixed
- Diagnostic mode output was not being properly included in the action's output, preventing debugging

## [5.2.0] - 2023-08-20

### Added
- **Debug/diagnostic mode** (`debug` input) - Captures and outputs diagnostic information for troubleshooting version calculations. Useful when the source repository isn't available for direct inspection

## [5.1.0] - 2023-08-09

### Added
- **Patch pattern filtering** (`bump_each_commit_patch_pattern` input) - When using `bump_each_commit`, patch version only increments if commit matches specified pattern. Supports JavaScript regex syntax with flags (e.g., `/fix\(.*\)/i`)
- **Pre-release mode** (`enable_prerelease_mode` input) - Prevents automatic major version bumps for 0.x.x versions. When enabled, "major" changes become "minor" and "minor" become "patch", preventing premature 1.0.0 releases
- `is_tagged` output - Boolean indicating if the current commit already has a version tag
- Previous version commit information outputs (`previous_commit`, `previous_version`) for better version tracking

### Fixed
- Corrected tag ordering when determining previous version (was using reverse order incorrectly)
- Increased test timeout for Windows environments to prevent CI failures
- Fixed test failures in environments with global GPG signing enabled
- Documentation typo: "version" output name was incorrectly documented

## [5.0.3] - 2023-01-10

### Fixed
- Pre-release tags on current commit were not being handled correctly when determining version increments
- Fixed incorrect parameter name mapping that was causing action failures

### Changed
- Updated dependencies to latest versions

## [5.0.2] - 2022-12-31

### Fixed
- Build output mapping was incorrect, causing the action to fail when generating outputs

## [5.0.1] - 2022-12-27

### Fixed
- Tag prefix and namespace values are now properly escaped when constructing regex patterns, preventing regex errors with special characters
- Fixed unescaped dots in regex patterns that could cause incorrect matching
- Test suite now consistently uses 'master' as branch name to avoid CI failures

### Added
- Syntax highlighting for code examples in documentation
- Contributing.md guide for developers
- Test coverage for namespaces containing forward slashes

### Changed
- Documentation updated to reflect correct input parameter names
- Version calculation no longer limits the number of tags retrieved, ensuring accurate version determination in repos with many tags

## [5.0.0] - 2022-12-20 - Major Rewrite

### Added
- **Complete TypeScript rewrite** - Action rewritten from JavaScript to TypeScript with modular architecture
- **Author tracking** - New `authors` output lists all commit authors since last release, formatted as CSV (JSON option available via `user_format_type`)
- **Commit body searching** - `search_commit_body` input allows searching commit message bodies for version patterns, not just the subject line
- **Branch support** - Can now use branch names instead of tags for versioning with `use_branches` input
- **Improved outputs** - Additional metadata including `version_type`, commit hashes, and more detailed version information
- **Namespace support without tags** - Namespaces now work even when no existing tags match the namespace

### Fixed
- Pre-release tags (alpha, beta, rc) are now properly excluded from version calculations unless explicitly included
- Fixed issue where current commit's tag wasn't properly considered when calculating previous version
- Tag ordering now uses git's version sort instead of author date, providing more accurate version ordering

### Changed
- Architecture completely redesigned with providers, resolvers, classifiers, and formatters for better extensibility
- Short tag support has been completely removed (was deprecated in v4)
- Updated to actions/core@1.10.0 and modernized all dependencies
- Node.js 16 compatibility

## [4.0.3] - 2021-10-29

### Changed
- Version output now properly uses the user-supplied version format template combined with namespace
- Updated dependencies and improved test coverage
- Documentation clarifications for better user understanding

## [4.0.2] - 2021-04-22

### Fixed
- Tag prefixes can now contain forward slashes (e.g., `releases/v`), enabling more flexible tagging schemes

## [4.0.1] - 2021-02-25

### Fixed
- Fixed regex pattern for matching full version tags when `short_tags` is disabled

## [4.0.0] - 2021-02-08

### Changed
- **Breaking**: Branch parameter now defaults to `HEAD` instead of requiring explicit branch name
- Branch names no longer include `origin/` prefix, simplifying branch-based versioning
- Reintroduced support for using `HEAD` as branch parameter (was removed in v3)

### Deprecated
- `branch` input is now deprecated in favor of automatic HEAD detection

## [3.3.1] - 2021-01-28

### Added
- `version_tag` output now includes namespace value, making it easier to identify versioned releases in multi-project repositories

### Changed
- Improved documentation clarity for namespace feature
- Enhanced readme formatting and examples

## [3.3.0] - 2021-01-23

### Added
- **Regular expression support** for `major_pattern` and `minor_pattern` - Wrap patterns in `/` to use regex (e.g., `/breaking:\s/i`)

### Fixed
- Fixed logic that prevented version tags from being properly matched when calculating increments

## [3.2.1] - 2021-01-16

### Fixed
- Tagged commits now properly preserve their increment value instead of resetting to 0
- SVG diagrams now have proper background color for better visibility

### Changed
- Updated dependencies
- Documentation improvements

## [3.2.0] - 2020-12-20

### Added
- **`bump_each_commit` mode** - Every commit creates a new patch version, useful for continuous deployment scenarios
- **`short_tags` toggle** - When set to `false`, only full semantic version tags (e.g., v1.2.3) are considered, ignoring short tags (e.g., v1)

### Changed
- Improved documentation with visual diagrams
- Removed deprecated parameters from documentation
- Enhanced readme clarity with better examples

## [3.1.2] - 2020-10-07

### Fixed
- **Full Windows support** - Fixed line ending issues and command execution on Windows
- Action now properly exits when current commit already has a version tag
- Current commit's tag is now used as the version when applicable

### Added
- Complete Windows support in test suite with OS-specific temp directories
- Windows runner added to CI pipeline alongside Linux

### Changed
- Commands now run silently to reduce log noise
- Improved error handling for command execution failures
- Added warning about actions/checkout@v2 shallow clone behavior that can affect version detection

## [3.1.1] - 2020-09-05

### Fixed
- Change detection now works correctly when no previous tags exist in the repository

## [3.1.0] - 2020-09-05

### Added
- **`version_tag` output** - Returns the complete version tag including prefix and namespace

### Changed
- Improved logging for change detection to help with debugging
- Command execution failures are now logged as info rather than errors (they're handled gracefully)
- Updated package dependencies

## [3.0.0] - 2020-09-02 - Multi-Project Support

### Added
- **Namespace support** (`namespace` input) - Enables multiple projects/components in same repo with isolated versioning
- **Improved mono-repo support** - Each namespace maintains its own version sequence

### Changed
- **Breaking**: `change_path` input now filters which paths trigger version changes rather than just detecting changes
- Removed verbose action output for cleaner logs
- Modernized codebase and dependencies for GitHub Actions runner compatibility

### Removed
- Deprecated action inputs from v2

## [2.1.1] - 2020-02-07

### Fixed
- Release link generation now uses correct branch name format

## [2.1.0] - 2020-01-25

### Added
- **Path-based change detection** (`change_path` input) - Specify paths to monitor for changes, useful for mono-repos where not all changes should trigger version bumps

### Changed
- Release link now uses branch name from action input rather than GitHub environment variable
- Release link is now output to action logs for visibility

## [2.0.0] - 2019-12-24

### Changed
- **Breaking**: Now uses `git describe` for more reliable tag detection instead of `git log`
- Added warning when repository has no tags, helping users understand why versioning starts at 0.0.0

## [1.0.1] - 2019-12-11

### Fixed
- Empty tag prefixes are now supported (useful for repos that use plain version numbers without 'v' prefix)

### Added
- Documentation for `version_format` input parameter

## [1.0.0] - 2019-12-11 - Initial Release

### Added
- Automatic semantic versioning based on git commit history
- Version bumping through commit message markers: `(MAJOR)` and `(MINOR)`
- Customizable version output format via `version_format` input
- Support for both short (v1) and full (v1.0.0) version tags
- Increment counter for commits since last version tag
- No manual version maintenance required - fully automated from git history

[5.4.0]: https://github.com/PaulHatch/semantic-version/compare/v5.3.0...v5.4.0
[5.3.0]: https://github.com/PaulHatch/semantic-version/compare/v5.2.1...v5.3.0
[5.2.1]: https://github.com/PaulHatch/semantic-version/compare/v5.2.0...v5.2.1
[5.2.0]: https://github.com/PaulHatch/semantic-version/compare/v5.1.0...v5.2.0
[5.1.0]: https://github.com/PaulHatch/semantic-version/compare/v5.0.3...v5.1.0
[5.0.3]: https://github.com/PaulHatch/semantic-version/compare/v5.0.2...v5.0.3
[5.0.2]: https://github.com/PaulHatch/semantic-version/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/PaulHatch/semantic-version/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/PaulHatch/semantic-version/compare/v4.0.3...v5.0.0
[4.0.3]: https://github.com/PaulHatch/semantic-version/compare/v4.0.2...v4.0.3
[4.0.2]: https://github.com/PaulHatch/semantic-version/compare/v4.0.1...v4.0.2
[4.0.1]: https://github.com/PaulHatch/semantic-version/compare/v4...v4.0.1
[4.0.0]: https://github.com/PaulHatch/semantic-version/compare/v3.3.1...v4
[3.3.1]: https://github.com/PaulHatch/semantic-version/compare/v3.3...v3.3.1
[3.3.0]: https://github.com/PaulHatch/semantic-version/compare/v3.2.1...v3.3
[3.2.1]: https://github.com/PaulHatch/semantic-version/compare/v3.2...v3.2.1
[3.2.0]: https://github.com/PaulHatch/semantic-version/compare/v3.1.2...v3.2
[3.1.2]: https://github.com/PaulHatch/semantic-version/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/PaulHatch/semantic-version/compare/v3.1...v3.1.1
[3.1.0]: https://github.com/PaulHatch/semantic-version/compare/v3...v3.1
[3.0.0]: https://github.com/PaulHatch/semantic-version/compare/v2.1.1...v3
[2.1.1]: https://github.com/PaulHatch/semantic-version/compare/v2.1...v2.1.1
[2.1.0]: https://github.com/PaulHatch/semantic-version/compare/v2...v2.1
[2.0.0]: https://github.com/PaulHatch/semantic-version/compare/v1.0.1...v2
[1.0.1]: https://github.com/PaulHatch/semantic-version/compare/v1...v1.0.1
[1.0.0]: https://github.com/PaulHatch/semantic-version/releases/tag/v1