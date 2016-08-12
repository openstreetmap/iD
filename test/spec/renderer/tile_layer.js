describe('iD.TileLayer', function() {
    var context, d, c;

    beforeEach(function() {
        context = iD.Context(window);
        d = d3.select(document.createElement('div'));
        c = iD.TileLayer(context).projection(d3.geoMercator());
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
