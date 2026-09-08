describe('iD.util direction degrees helpers', () => {
    describe('utilNormalizeAzimuthDegrees', () => {
        it('wraps into [0, 360)', () => {
            expect(iD.utilNormalizeAzimuthDegrees(0)).toEqual(0);
            expect(iD.utilNormalizeAzimuthDegrees(360)).toEqual(0);
            expect(iD.utilNormalizeAzimuthDegrees(-15)).toEqual(345);
            expect(iD.utilNormalizeAzimuthDegrees(370)).toEqual(10);
        });
    });

    describe('utilParseDirectionDegreesSegment', () => {
        it('parses numbers and cardinals', () => {
            expect(iD.utilParseDirectionDegreesSegment('90')).toEqual(90);
            expect(iD.utilParseDirectionDegreesSegment('N')).toEqual(0);
            expect(iD.utilParseDirectionDegreesSegment('ne')).toEqual(45);
            expect(iD.utilParseDirectionDegreesSegment(' 270 ')).toEqual(270);
        });

        it('rejects empty and relative/junk values', () => {
            expect(iD.utilParseDirectionDegreesSegment('')).toBeNull();
            expect(iD.utilParseDirectionDegreesSegment('forward')).toBeNull();
            expect(iD.utilParseDirectionDegreesSegment('error')).toBeNull();
        });
    });

    describe('utilHasDirectionDegrees', () => {
        it('detects any parseable semicolon segment', () => {
            expect(iD.utilHasDirectionDegrees('120;300')).toBeTruthy();
            expect(iD.utilHasDirectionDegrees('N')).toBeTruthy();
            expect(iD.utilHasDirectionDegrees('forward;90')).toBeTruthy();
            expect(iD.utilHasDirectionDegrees('forward')).toBeFalsy();
            expect(iD.utilHasDirectionDegrees(undefined)).toBeFalsy();
            expect(iD.utilHasDirectionDegrees('')).toBeFalsy();
        });
    });

    describe('utilRetargetDirectionDegreesValue', () => {
        it('sets an absent or empty value to the target', () => {
            expect(iD.utilRetargetDirectionDegreesValue(undefined, 123.4)).toEqual('123');
            expect(iD.utilRetargetDirectionDegreesValue('', 90)).toEqual('90');
        });

        it('applies a shared delta across multi-value tags', () => {
            expect(iD.utilRetargetDirectionDegreesValue('120;300', 90)).toEqual('90;270');
            expect(iD.utilRetargetDirectionDegreesValue('N;90', 45)).toEqual('45;135');
        });

        it('preserves unparsable segments', () => {
            expect(iD.utilRetargetDirectionDegreesValue('120;error;300', 90)).toEqual('90;error;270');
        });

        it('leaves all-junk values unchanged', () => {
            expect(iD.utilRetargetDirectionDegreesValue('forward', 45)).toEqual('forward');
        });

        it('converts cardinals to numeric degrees', () => {
            expect(iD.utilRetargetDirectionDegreesValue('N', 45)).toEqual('45');
            expect(iD.utilRetargetDirectionDegreesValue('ne', 90)).toEqual('90');
        });
    });
});
