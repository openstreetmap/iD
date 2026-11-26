describe('iD.units', function() {
    describe('dmsMatcher', function() {
        it('parses D M SS format', function() {
            var result = iD.dmsMatcher('35 11 10.1 , 136 49 53.8');
            expect(result[0]).to.be.closeTo( 35.18614, 0.00001);
            expect(result[1]).to.be.closeTo(136.83161, 0.00001);
        });
        it('parses D M SS format, with negative value', function() {
            var result = iD.dmsMatcher('-35 11 10.1 , -136 49 53.8');
            expect(result[0]).to.be.closeTo( -35.18614, 0.00001);
            expect(result[1]).to.be.closeTo(-136.83161, 0.00001);
        });

        it('parses D MM format', function() {
            var result = iD.dmsMatcher('35 11.1683 , 136 49.8966');
            expect(result[0]).to.be.closeTo( 35.18614, 0.00001);
            expect(result[1]).to.be.closeTo(136.83161, 0.00001);
        });
        it('parses D MM format, with negative value', function() {
            var result = iD.dmsMatcher('-35 11.1683 , -136 49.8966');
            expect(result[0]).to.be.closeTo( -35.18614, 0.00001);
            expect(result[1]).to.be.closeTo(-136.83161, 0.00001);
        });

        it('handles invalid input', function() {
            var result = iD.dmsMatcher('!@#$');
            expect(result).to.be.null;
        });
    });

    describe('dmsCoordinatePair', function() {
        it('formats coordinate pair', function () {
            var result = iD.dmsCoordinatePair([90 + 0.5/3600, 45]);
            expect(result).to.be.eql('45°N, 90°0′1″E');
        });
        it('formats 0°', function () {
            var result = iD.dmsCoordinatePair([0, 0]);
            expect(result).to.be.eql('0°, 0°');
        });
        it('formats negative value', function () {
            var result = iD.dmsCoordinatePair([-179, -90]);
            expect(result).to.be.eql('90°S, 179°W');
        });
        it('formats 180° lng, should be E or W', function () {
            // The longitude at this line can be given as either east or west.
            var result = iD.dmsCoordinatePair([180, 0]);
            expect(result).to.be.oneOf(['0°, 180°W', '0°, 180E°']);
        });
        it('formats value over 90°lat or 180°lng', function () {
            var result = iD.dmsCoordinatePair([181, 91]);
            expect(result).to.be.oneOf(['90°N, 179°W']);
        });
    });
});

