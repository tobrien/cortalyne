import {
    DATE_FORMAT_DAY,
    DATE_FORMAT_HOURS,
    DATE_FORMAT_MILLISECONDS,
    DATE_FORMAT_MINUTES,
    DATE_FORMAT_MONTH,
    DATE_FORMAT_MONTH_DAY,
    DATE_FORMAT_SECONDS,
    DATE_FORMAT_YEAR,
    DATE_FORMAT_YEAR_MONTH,
    DATE_FORMAT_YEAR_MONTH_DAY,
    DATE_FORMAT_YEAR_MONTH_DAY_HOURS_MINUTES,
    DATE_FORMAT_YEAR_MONTH_DAY_HOURS_MINUTES_SECONDS,
    DATE_FORMAT_YEAR_MONTH_DAY_HOURS_MINUTES_SECONDS_MILLISECONDS,
    DATE_FORMAT_YEAR_MONTH_DAY_SLASH,
    DEFAULT_BINARY_TO_TEXT_ENCODING,
    DEFAULT_CHARACTER_ENCODING,
    DEFAULT_DRY_RUN,
    DEFAULT_VERBOSE,
    PROGRAM_NAME
} from '../src/constants.js';

describe('constants', () => {
    it('should have correct string values', () => {
        expect(PROGRAM_NAME).toBe('cortalyne');
        expect(DEFAULT_CHARACTER_ENCODING).toBe('utf-8');
        expect(DEFAULT_BINARY_TO_TEXT_ENCODING).toBe('base64');
    });

    it('should have correct date format strings', () => {
        expect(DATE_FORMAT_MONTH_DAY).toBe('M-D');
        expect(DATE_FORMAT_YEAR).toBe('YYYY');
        expect(DATE_FORMAT_YEAR_MONTH).toBe('YYYY-M');
        expect(DATE_FORMAT_YEAR_MONTH_DAY).toBe('YYYY-M-D');
        expect(DATE_FORMAT_YEAR_MONTH_DAY_SLASH).toBe('YYYY/M/D');
        expect(DATE_FORMAT_YEAR_MONTH_DAY_HOURS_MINUTES).toBe('YYYY-M-D-HHmm');
        expect(DATE_FORMAT_YEAR_MONTH_DAY_HOURS_MINUTES_SECONDS).toBe('YYYY-M-D-HHmmss');
        expect(DATE_FORMAT_YEAR_MONTH_DAY_HOURS_MINUTES_SECONDS_MILLISECONDS).toBe('YYYY-M-D-HHmmss.SSS');
        expect(DATE_FORMAT_MONTH).toBe('M');
        expect(DATE_FORMAT_DAY).toBe('D');
        expect(DATE_FORMAT_HOURS).toBe('HHmm');
        expect(DATE_FORMAT_MINUTES).toBe('mm');
        expect(DATE_FORMAT_SECONDS).toBe('ss');
        expect(DATE_FORMAT_MILLISECONDS).toBe('SSS');
    });

    it('should have correct boolean defaults', () => {
        expect(DEFAULT_VERBOSE).toBe(false);
        expect(DEFAULT_DRY_RUN).toBe(false);
    });
});
