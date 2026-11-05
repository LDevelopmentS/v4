// The feature list. One line per feature, one file per feature.
// A bug in one feature cannot break the others.
//
// To add one:
//   1. Copy _template.js to a new file, e.g. report-type-null.js
//   2. Add:  () => import('./report-type-null.js'),
//
export default [
  () => import('./block-angle-brackets.js'),
  () => import('./strip-angle-brackets.js'),
  () => import('./limit-typing.js'),
  () => import('./truncate-overflow.js'),
  () => import('./paste-handler.js'),
  () => import('./paste-link-extractor.js'),
  () => import('./paste-quill-links.js'),
  () => import('./paste-strip-generator-text.js'),
  () => import('./paste-strip-brackets.js'),
  () => import('./copy-report.js'),
  () => import('./metric-digits.js'),
  () => import('./clone-highlight.js'),
  () => import('./discard-all.js'),
  () => import('./delete-clone.js'),
  () => import('./leave-warning.js'),
  () => import('./restore-session.js'),
  // () => import('./report-type-null.js'),
  // () => import('./report-generator.js'),
];
