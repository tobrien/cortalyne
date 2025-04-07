import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/util/dates', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../src/util/storage', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../src/logging', () => ({
    getLogger: jest.fn()
}));

let Dates: any;
let Storage: any;
let Logging: any;
let Output: any;

describe('output', () => {
    let mockDates: any;
    let mockStorage: any;
    let mockLogger: any;
    let outputInstance: any;

    const mockConfig = {
        timezone: 'America/New_York',
        outputStructure: 'year',
        filenameOptions: ['date', 'time']
    };

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        Dates = await import('../src/util/dates');
        Storage = await import('../src/util/storage');
        Logging = await import('../src/logging');
        Output = await import('../src/output');

        // Setup dates mock
        mockDates = {
            format: jest.fn(),
            date: jest.fn()
        };
        (Dates.create as jest.Mock).mockReturnValue(mockDates);

        // Setup storage mock
        mockStorage = {
            createDirectory: jest.fn()
        };
        (Storage.create as jest.Mock).mockReturnValue(mockStorage);

        // Setup logger mock
        mockLogger = {
            debug: jest.fn()
        };
        (Logging.getLogger as jest.Mock).mockReturnValue(mockLogger);

        // Create output instance
        outputInstance = Output.create(
            mockConfig.timezone,
            mockConfig.outputStructure,
            mockConfig.filenameOptions
        );
    });

    describe('constructFilename', () => {
        it('should construct filename with date and time when options are enabled', () => {
            const date = new Date();
            const type = 'note';
            const hash = 'test-hash';
            const subject = 'Test Subject';

            // Mock date formatting
            mockDates.format.mockReturnValueOnce('2024-03-15'); // date
            mockDates.format.mockReturnValueOnce('1430'); // time

            const filename = outputInstance.constructFilename(date, type, hash, { subject });

            expect(filename).toBe('2024-03-15-1430-test-hash-note-Test_Subject');
            expect(mockDates.format).toHaveBeenCalledTimes(2);
        });

        it('should construct filename without date and time when options are disabled', () => {
            const date = new Date();
            const type = 'note';
            const hash = 'test-hash';
            const subject = 'Test Subject';

            // Create output instance without date/time options
            const outputWithoutOptions = Output.create(
                mockConfig.timezone,
                mockConfig.outputStructure,
                []
            );

            const filename = outputWithoutOptions.constructFilename(date, type, hash, { subject });

            expect(filename).toBe('test-hash-note-Test_Subject');
            expect(mockDates.format).not.toHaveBeenCalled();
        });

        it('should sanitize subject in filename', () => {
            const date = new Date();
            const type = 'note';
            const hash = 'test-hash';
            const subject = 'Test Subject with spaces & special chars!@#$';

            const filename = outputInstance.constructFilename(date, type, hash, { subject });

            expect(filename).toContain('Test_Subject_with_spaces___special_chars');
        });
    });

    describe('constructOutputDirectory', () => {
        it('should construct year-based directory structure', () => {
            const creationTime = new Date();
            const baseDirectory = '/test/output';

            // Mock date formatting
            mockDates.date.mockReturnValueOnce(creationTime);
            mockDates.format.mockReturnValueOnce('2024');
            mockDates.format.mockReturnValueOnce('03');
            mockDates.format.mockReturnValueOnce('15');

            const outputPath = outputInstance.constructOutputDirectory(creationTime, baseDirectory);

            expect(outputPath).toBe('/test/output/2024');
            expect(mockStorage.createDirectory).toHaveBeenCalledWith('/test/output/2024');
        });

        it('should construct month-based directory structure', () => {
            const creationTime = new Date();
            const baseDirectory = '/test/output';

            // Create output instance with month structure
            const outputWithMonth = Output.create(
                mockConfig.timezone,
                'month',
                mockConfig.filenameOptions
            );

            // Mock date formatting
            mockDates.date.mockReturnValueOnce(creationTime);
            mockDates.format.mockReturnValueOnce('2024');
            mockDates.format.mockReturnValueOnce('03');
            mockDates.format.mockReturnValueOnce('15');

            const outputPath = outputWithMonth.constructOutputDirectory(creationTime, baseDirectory);

            expect(outputPath).toBe('/test/output/2024/03');
            expect(mockStorage.createDirectory).toHaveBeenCalledWith('/test/output/2024/03');
        });

        it('should construct day-based directory structure', () => {
            const creationTime = new Date();
            const baseDirectory = '/test/output';

            // Create output instance with day structure
            const outputWithDay = Output.create(
                mockConfig.timezone,
                'day',
                mockConfig.filenameOptions
            );

            // Mock date formatting
            mockDates.date.mockReturnValueOnce(creationTime);
            mockDates.format.mockReturnValueOnce('2024');
            mockDates.format.mockReturnValueOnce('03');
            mockDates.format.mockReturnValueOnce('15');

            const outputPath = outputWithDay.constructOutputDirectory(creationTime, baseDirectory);

            expect(outputPath).toBe('/test/output/2024/03/15');
            expect(mockStorage.createDirectory).toHaveBeenCalledWith('/test/output/2024/03/15');
        });
    });
});
