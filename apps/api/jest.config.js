/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    // ts-jest berjalan di CommonJS, sedangkan source memakai import ESM berekstensi .js
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@toko/contracts$': '<rootDir>/../../packages/contracts/src/index.ts',
  },
};
