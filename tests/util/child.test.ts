import { jest } from '@jest/globals';

// Mock modules
const mockExec = jest.fn();
const mockPromisify = jest.fn();

jest.unstable_mockModule('child_process', () => ({
    exec: mockExec
}));

jest.unstable_mockModule('util', () => ({
    default: {
        promisify: mockPromisify
    }
}));

// Create the mock function to be returned by promisify with appropriate type assertion
const mockExecPromise = jest.fn() as jest.Mock<any>;

// Import the module under test (must be after mocks)
let run: any;

describe('child util', () => {
    beforeAll(async () => {
        // Set default mock implementation
        mockPromisify.mockReturnValue(mockExecPromise);

        // Default success case
        mockExecPromise.mockImplementation((_command: string, _options: any) => {
            return Promise.resolve({
                stdout: 'success output',
                stderr: ''
            });
        });

        // Import the module after mocks are set up
        const childModule = await import('../../src/util/child.js');
        run = childModule.run;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('run', () => {
        it('should execute a command and return stdout/stderr', async () => {
            const result = await run('test command');

            // Verify promisify was called with exec
            expect(mockPromisify).toHaveBeenCalledWith(mockExec);

            // Verify the promisified exec was called with correct arguments
            expect(mockExecPromise).toHaveBeenCalledWith('test command', {});

            // Verify the result contains expected output
            expect(result).toEqual({
                stdout: 'success output',
                stderr: ''
            });
        });

        it('should pass options to exec', async () => {
            const options = { cwd: '/tmp', env: { NODE_ENV: 'test' } };
            await run('test command', options);

            expect(mockExecPromise).toHaveBeenCalledWith('test command', options);
        });

        it('should handle command failures', async () => {
            // Override the implementation for this test
            const error = new Error('Command failed');
            mockExecPromise.mockImplementationOnce(() => Promise.reject(error));

            await expect(run('failing command')).rejects.toThrow('Command failed');
        });
    });
});
