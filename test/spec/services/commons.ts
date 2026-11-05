import { parseExifNumber, parseExifDate } from '../../../modules/services/commons';

describe('iD.serviceCommons', () => {
    describe('parseExifNumber', () => {
        it.each`
            input         | output
            ${12}         | ${12}
            ${'12'}       | ${12}
            ${'0.34'}     | ${0.34}
            ${'90/360'}   | ${0.25}
            ${''}         | ${undefined}
            ${'invalidd'} | ${undefined}
            ${undefined}  | ${undefined}
        `('parses $input into $output', ({ input, output }) => {
            expect(parseExifNumber(input)).toBe(output);
        });
    });

    describe('parseExifDate', () => {
        it.each`
            input                    | output
            ${'2009:06:08 12:34:56'} | ${'2009-06-08T12:34:56.000Z'}
            ${'2009:06:08 00:00:00'} | ${'2009-06-08T00:00:00.000Z'}
            ${'1234:56:78'}          | ${undefined}
            ${'0000:00:00 00:00:00'} | ${undefined}
            ${'0000:00:00'}          | ${undefined}
            ${''}                    | ${undefined}
            ${'invalidd'}            | ${undefined}
            ${undefined}             | ${undefined}
        `('parses $input into $output', ({ input, output }) => {
            expect(parseExifDate(input)?.toISOString()).toBe(output);
        });
    });
});
