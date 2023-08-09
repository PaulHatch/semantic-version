# Configuration Guide


## Choosing a Release Strategy

This section is designed to help you choose a release strategy for your project and help you configure GitHub Workflow to use that strategy. It is organized starting from the most simple with each strategy supporting more complex needs, allowing you to start at the top and continue until you find the simplest strategy that meets your needs.

### Increment Every Release

If your project has no gating requirements and you want to release every time a commit is pushed to the default branch, you can use the _Increment Every Release_ strategy. This may be appropriate for documentation projects, very small projects, or in cases where "shipping" a broken version isn't a big deal. The key limitation of this strategy is that once you push a commit, the version is going to increments no matter what. If you push a version and your build or automated tests fail, you'll have a version that is broken and you'll have to increment the version again to fix it.

### Increment from Commit Message

Very similar to the strategy above, using the _Increment from Commit Message_ means that you are making the decision to increment the version at the time you commit the code, however by using the `bump_each_commit_patch_pattern` parameter introduced in v5.1.0, you can prevent the version from incrementing for a commit unless it matches one of the patters (major, minor, or patch).

Compared to the _Increment Every Release_ strategy, this strategy allows you to make a decision about whether or not to increment the version for a particular commit, allowing you to add commits to a repo that do not increment the version. Again, you make the decision to increment the version at the time you commit the code, so this strategy may not be appropriate for some project types.

On the other hand, if you have a fast deployment strategy, such as "every commit goes to prod" and don't mind versions being created for failed builds, this may be the right choice.

### Tag Versioning

This strategy is the most common and is the best option for many projects. It allows you to make the decision to release a version after the build has run, which is essentially the primary motivation and main purpose for this action.

The only real limitation of this strategy is that it does not allow for multiple versions to receive ongoing updates, which may be necessary for certain types of projects which are distributed and receive ongoing maintenance of older versions. This is in contrast to projects that are developed only for a single deployment and are not distributed.

Tags should generally not be created automatically as part of the build, which can cause strange behavior unless you've taken care to prevent race conditions. Creating tags automatically also largely negates the purpose of this strategy as only build automated test.


## Branch Versioning

Moving past tag versioning is where things get a little more complicated, as there are many different ways to version branches.
### Version Branches with Tag Versioning

It is possible to use version branches while still


### Version from Branch Name (Non-Predictive)



### Version from Branch Name (Predictive)

## Branch Versioning: GitFlow


