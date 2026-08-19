#!/usr/bin/env node

// Orchestrates an Nx Release with a build in between versioning and publishing:
// the plugin's dist package.json is generated from the freshly bumped source
// package.json, so the build has to run after `releaseVersion` and before
// `releasePublish`. The composite `nx release` command doesn't allow injecting
// a step in the middle, hence this script instead of a single CLI invocation.
// See https://nx.dev/docs/guides/nx-release/programmatic-api

const { execSync } = require('node:child_process');
const { releaseChangelog, releasePublish, releaseVersion } = require('nx/release');

const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');

function run(command) {
  execSync(command, { stdio: 'inherit' });
}

(async () => {
  const { workspaceVersion, projectsVersionData, releaseGraph } = await releaseVersion({
    dryRun,
    verbose,
  });

  if (!workspaceVersion) {
    console.log('No release-worthy commits since the last release. Skipping.');
    return;
  }

  run('npx nx build aws-cdk-v2');

  // releaseChangelog's own git-commit step only commits changes *it* makes
  // (i.e. a changelog file), which we don't write (see nx.json
  // release.changelog.workspaceChangelog.file: false) - it has nothing of
  // its own to commit and skips the whole step, silently dropping the
  // version bump releaseVersion just staged. So the commit/tag/push for the
  // version bump is done here instead, and releaseChangelog below is only
  // used for changelog notes + the GitHub release, not git operations.
  //
  // This runs after the build on purpose: if the build fails, nothing has
  // been committed, tagged or pushed yet, so the release can simply be
  // retried. Pushing the tag first would leave a released-looking tag
  // pointing at a version that was never actually published.
  if (!dryRun) {
    run(`git commit -m "chore(release): publish ${workspaceVersion}"`);
    run(`git tag ${workspaceVersion}`);
    // Explicit refspec rather than a bare `git push`: the release workflow
    // checks out a specific commit (detached HEAD), not a branch, so there
    // is no upstream to push to implicitly.
    run('git push origin HEAD:main --follow-tags');
  }

  await releaseChangelog({
    releaseGraph,
    versionData: projectsVersionData,
    version: workspaceVersion,
    dryRun,
    verbose,
    gitCommit: false,
    gitTag: false,
    gitPush: false,
  });

  const publishResults = await releasePublish({
    releaseGraph,
    dryRun,
    verbose,
  });

  const failed = Object.entries(publishResults).filter(([, result]) => result.code !== 0);
  if (failed.length > 0) {
    for (const [project, result] of failed) {
      console.error(`Failed to publish ${project} (exit code ${result.code})`);
    }
    process.exit(1);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
