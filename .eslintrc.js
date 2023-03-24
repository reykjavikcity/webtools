module.exports = require('@hugsmidjan/hxmstyle')({
  // Place your project-specific additions or overrides here
  // using standard ESLint config syntax...

  env: {
    node: true,
    es2020: true,
  },
  rules: {
    // Require file extensions for all local imports.
    // Otherwise tsc emits ESM modules that don't work with Next.js
    // (and possibly other bundlers)
    'import/extensions': ['error', 'ignorePackages'],
  },
});
