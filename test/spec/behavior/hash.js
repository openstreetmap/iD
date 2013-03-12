describe("iD.behavior.Hash", function () {
    mocha.globals('__onhashchange.hash');

    var hash, context;

    beforeEach(function () {
        context = iD();

        // Neuter connection
        context.connection().loadTiles = function () {};

        hash = iD.behavior.Hash(context);

        d3.select(document.createElement('div'))
            .call(context.map());
    });

    afterEach(function () {
        hash.off();
    });

    it("sets hadHash if location.hash is present", function () {
        location.hash = "map=20.00/38.87952/-77.02405";

        hash();

        expect(hash.hadHash).to.be.true;
    });

    it("centerZooms map to requested level", function () {
        location.hash = "map=20.00/38.87952/-77.02405";

        hash();

        expect(context.map().center()[0]).to.be.closeTo(-77.02405, 0.1);
        expect(context.map().center()[1]).to.be.closeTo(38.87952, 0.1);
        expect(context.map().zoom()).to.equal(20.0);
    });

    it("centerZooms map at requested coordinates on hash change", function (done) {
        hash();

        d3.select(window).on('hashchange', function () {
            expect(context.map().center()[0]).to.be.closeTo(-77.02405, 0.1);
            expect(context.map().center()[1]).to.be.closeTo(38.87952, 0.1);
            expect(context.map().zoom()).to.equal(20.0);
            d3.select(window).on('hashchange', null);
            done();
        });

        location.hash = "#map=20.00/38.87952/-77.02405";
    });

    it("stores the current zoom and coordinates in location.hash on map move events", function () {
        location.hash = "";

        hash();

        context.map().center([38.9, -77.0]);
        context.map().zoom(2.0);

        expect(location.hash).to.equal("#map=2.00/-77.0/38.9");
    });
});
