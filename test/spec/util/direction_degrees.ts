describe('iD.direction_degrees util', () => {
    function parseIdentity(s: string): number {
        return parseFloat(s);
    }

    describe('utilNormalizeAzimuthDegrees', () => {
        it('maps negative angles into [0, 360)', () => {
            expect(iD.utilNormalizeAzimuthDegrees(-10)).to.equal(350);
            expect(iD.utilNormalizeAzimuthDegrees(-360)).to.equal(0);
        });

        it('reduces angles >= 360', () => {
            expect(iD.utilNormalizeAzimuthDegrees(360)).to.equal(0);
            expect(iD.utilNormalizeAzimuthDegrees(370)).to.equal(10);
        });

        it('leaves canonical values unchanged', () => {
            expect(iD.utilNormalizeAzimuthDegrees(0)).to.equal(0);
            expect(iD.utilNormalizeAzimuthDegrees(90)).to.equal(90);
        });
    });

    describe('utilParseDirectionDegreesString', () => {
        it('returns null for empty input', () => {
            expect(iD.utilParseDirectionDegreesString('', parseIdentity)).to.equal(null);
            expect(iD.utilParseDirectionDegreesString('   ', parseIdentity)).to.equal(null);
        });

        it('parses cardinal shortcuts', () => {
            expect(iD.utilParseDirectionDegreesString('n', parseIdentity)).to.equal(0);
            expect(iD.utilParseDirectionDegreesString('E', parseIdentity)).to.equal(90);
        });

        it('parses numeric strings and normalizes', () => {
            expect(iD.utilParseDirectionDegreesString('90', parseIdentity)).to.equal(90);
            expect(iD.utilParseDirectionDegreesString('-10', parseIdentity)).to.equal(350);
            expect(iD.utilParseDirectionDegreesString('370', parseIdentity)).to.equal(10);
        });

        it('returns null for non-direction text', () => {
            expect(iD.utilParseDirectionDegreesString('foo', parseIdentity)).to.equal(null);
        });
    });

    describe('utilDirectionSegmentFractionDigits', () => {
        it('uses decimal places from raw dot notation', () => {
            expect(
                iD.utilDirectionSegmentFractionDigits('12.345678', () => 0)
            ).to.equal(6);
        });

        it('falls back to countDecimalPlaces for non-raw strings', () => {
            expect(
                iD.utilDirectionSegmentFractionDigits('1,5', () => 1)
            ).to.equal(1);
        });

        it('returns 0 when fraction digit count is not finite', () => {
            expect(
                iD.utilDirectionSegmentFractionDigits('x', () => NaN)
            ).to.equal(0);
        });
    });
});
