module.exports = {
  testsEnvironment: 'node',
  testsMatch: ['**/tests/**/*.tests.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: ['/node_modules/']
};
