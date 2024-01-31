describe('iD.units', function() {
    it('parses D M SS format', function() {
        var result = iD.dmsMatcher('35 11 10.1 , 136 49 53.8');
        expect(result[0]).to.be.closeTo( 35.18614, 0.00001);
        expect(result[1]).to.be.closeTo(136.83161, 0.00001);
    });

    it('parses D MM format', function() {
        var result = iD.dmsMatcher('35 11.1683 , 136 49.8966');
        expect(result[0]).to.be.closeTo( 35.18614, 0.00001);
        expect(result[1]).to.be.closeTo(136.83161, 0.00001);
    });

    it('formats coordinate pair', function() {
        var result = iD.dmsCoordinatePair([90 + 0.5/3600, 45]);
        expect(result).to.be.eql('45°N, 90°0′1″E');
    });
});

