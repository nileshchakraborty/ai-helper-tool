module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
    },
};
