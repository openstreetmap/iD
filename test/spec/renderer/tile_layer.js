describe('iD.TileLayer', function() {
    var c, d;

    beforeEach(function() {
        d = d3.select(document.createElement('div'));
        c = iD.TileLayer().projection(d3.geo.mercator());
        d.call(c);
    });

    afterEach(function() {
        d.remove();
    });

    describe('iD.TileLayer', function() {
        it('is instantiated', function() {
            expect(c).to.be.ok;
        });

        it('#dimensions', function() {
            expect(c.dimensions([100, 100])).to.equal(c);
            expect(c.dimensions()).to.eql([100,100]);
        });
    });
});
