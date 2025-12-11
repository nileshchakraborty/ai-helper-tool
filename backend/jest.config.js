module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    modulePathIgnorePatterns: ['<rootDir>/tests/e2e.test.ts'],
};
