import { jest } from '@jest/globals';

// Import modules asynchronously
let Run: any;
let createConfig: any;

// Load all dynamic imports before tests
beforeAll(async () => {
    Run = await import('../src/run.js');
    createConfig = Run.createConfig;
});

describe('run', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createConfig', () => {

        it('should set dryRun and verbose flags correctly', () => {
            const options = {
                dryRun: true,
                verbose: true
            };

            const config = createConfig(options);

            expect(config.dryRun).toBe(true);
            expect(config.verbose).toBe(true);
        });

        it('should use default values when dryRun and verbose are not provided', () => {
            const options = {};

            const config = createConfig(options);

            expect(config.dryRun).toBe(false);
            expect(config.verbose).toBe(false);
        });


    });
});
