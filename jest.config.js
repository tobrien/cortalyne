/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    rootDir: '.',
    collectCoverageFrom: ['src/**/*.ts'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 85,
            lines: 85,
            statements: 85,
        }
    },
    extensionsToTreatAsEsm: ['.ts'],
    maxWorkers: '50%',
    moduleDirectories: ['node_modules', 'src'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@vite/(.*)$': '<rootDir>/src/$1'
    },
    modulePaths: ['<rootDir>/src/'],
    preset: 'ts-jest/presets/default-esm',
    roots: ['<rootDir>/src/', '<rootDir>/tests/'],
    // setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    silent: false,
    testEnvironment: 'node',
    testEnvironmentOptions: {
        url: 'http://localhost'
    },
    testTimeout: 30000,
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
                useESM: true,
                diagnostics: {
                    ignoreCodes: [1343]
                }
            }
        ]
    },
    transformIgnorePatterns: [
        'node_modules/(?!(dayjs)/)'
    ],
    verbose: true,
    workerIdleMemoryLimit: '512MB',
}; 