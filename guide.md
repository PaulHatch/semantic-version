# Configuration Guide

## Choosing a Release Strategy

This section is designed to help you choose a release strategy for your project and help you configure GitHub Workflow to use that strategy. It is organized starting from the most simple with each strategy supporting more complex needs, allowing you to start at the top and continue until you find the simplest strategy that meets your needs.

Note that in the examples given `latest` is used, but you will likely want to pin your version to a specific version.

### Increment Every Release

If your project has no gating requirements and you want to release every time a commit is pushed to the default branch, you can use the _Increment Every Release_ strategy. This may be appropriate for documentation projects, very small projects, or in cases where "shipping" a broken version isn't a big deal. The key limitation of this strategy is that once you push a commit, the version is going to increments no matter what. If you push a version and your build or automated tests fail, you'll have a version that is broken and you'll have to increment the version again to fix it.

```yaml
- uses: paulhatch/semantic-version@latest
  with:
    bump_each_commit: true
```

### Increment from Commit Message

Very similar to the strategy above, using the _Increment from Commit Message_ means that you are making the decision to increment the version at the time you commit the code, however by using the `bump_each_commit_patch_pattern` parameter introduced in v5.1.0, you can prevent the version from incrementing for a commit unless it matches one of the patters (major, minor, or patch).

Compared to the _Increment Every Release_ strategy, this strategy allows you to make a decision about whether or not to increment the version for a particular commit, allowing you to add commits to a repo that do not increment the version. Again, you make the decision to increment the version at the time you commit the code, so this strategy may not be appropriate for some project types.

On the other hand, if you have a fast deployment strategy, such as "every commit goes to prod" and don't mind versions being created for failed builds, this may be the right choice.

```yaml
- uses: paulhatch/semantic-version@latest
  with:
    bump_each_commit: true
    bump_each_commit_patch_pattern: "(PATCH)"
```


### Tag Versioning

This strategy is the most common and is the best option for many projects. It allows you to make the decision to release a version after the build has run, which is essentially the primary motivation and main purpose for this action.

The only real limitation of this strategy is that it does not allow for multiple versions to receive ongoing updates, which may be necessary for certain types of projects which are distributed and receive ongoing maintenance of older versions. This is in contrast to projects that are developed only for a single deployment and are not distributed.

Tags should generally not be created automatically as part of the build, which can cause strange behavior unless you've taken care to prevent race conditions. Creating tags automatically also largely negates the purpose of this strategy as only build automated test.

_This is the default behavior, so no special options are required._

```yaml
- uses: paulhatch/semantic-version@latest
```


### Branch + Tag Versioning

So far all the options considered have assumed that a single, ever incrementing version is being released, and that once a new major or minor version is tagged no further updates are made for previous versions. This is appropriate for many projects such as web applications and most libraries, however if you need to support on-going update to multiple major or major+minor versions, using only the approaches above can lead to problems if you are merging updates into multiple branches, as any tags may be picked up and cause the version of an older branch to unexpectedly jump.

To accomplish this, we can enable the `version_from_branch`, which will cause the major and optionally the minor version to be taken from the current branch name rather than the tag, and to filter out tags that do not begin with the same version number(s). The `version_from_branch` input can be either a boolean or a regex string to be used to identify the version from the branch name. By default this will be `[0-9]+.[0-9]+$|[0-9]+$` e.g. match the final number or pair of numbers separated by a `.`. This default is probably appropriate for the majority of cases as it will match any prefix, for example branches named:

- `release/v1`
- `release/v1.2`
- `v1`
- `v1.2`
- `1`
- `1.2`

Note that when using this strategy you should always tag at the same time as the branch is created to ensure that the increment value is correct.

```yaml
- uses: paulhatch/semantic-version@latest
  with:
    version_from_branch: true
```

Alternately, you can override the branch pattern.

```yaml
- uses: paulhatch/semantic-version@latest
  with:
    version_from_branch: "/v([0-9]+.[0-9]+$|[0-9]+)$/"
```

## Namespace Services / "Monorepo" Support

If your project contains multiple services which you wish to version independently, you can use the `namespace` and `change_path` inputs to provide a version for a specific service which increments only when a file in the specified path is changed.

```yaml
- id: version
  uses: paulhatch/semantic-version@latest
  with:
    change_path: "src/my-service"
    namespace: my-service
- name: Cancel if Unchanged
  run: |
    gh run cancel ${{ github.run_id }}
    gh run watch ${{ github.run_id }}
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
