describe('iD.behaviorHash', function () {
    mocha.globals('__onhashchange.hash');

    var hash, context;

    beforeEach(function () {
        window.location.hash = '#background=none';   // Try not to load imagery
        var container = d3.select(document.createElement('div'));
        context = iD.coreContext().assetPath('../dist/').init().container(container);
        container.call(context.map());
        hash = iD.behaviorHash(context);
    });

    afterEach(function () {
        hash.off();
        window.location.hash = '#background=none';   // Try not to load imagery
    });


    it('sets hadLocation if window.location.hash is present', function () {
        window.location.hash = '#background=none&map=20.00/38.87952/-77.02405';
        hash();
        expect(hash.hadLocation).to.be.true;
    });

    it('centerZooms map to requested coordinates', function () {
        window.location.hash = '#background=none&map=20.00/38.87952/-77.02405';
        hash();
        expect(context.map().center()[0]).to.be.closeTo(-77.02405, 0.1);
        expect(context.map().center()[1]).to.be.closeTo(38.87952, 0.1);
        expect(context.map().zoom()).to.equal(20.0);
    });

    it('centerZooms map at requested coordinates on hash change', function (done) {
        hash();
        d3.select(window).on('hashchange', function () {
            expect(context.map().center()[0]).to.be.closeTo(-77.02405, 0.1);
            expect(context.map().center()[1]).to.be.closeTo(38.87952, 0.1);
            expect(context.map().zoom()).to.equal(20.0);
            d3.select(window).on('hashchange', null);
            done();
        });
        window.location.hash = '#background=none&map=20.00/38.87952/-77.02405';
    });

    it('sets hadLocation if map-location is in local storage', function () {
        iD.prefs('map-location', '19/43.80082/11.24567');
        hash();
        expect(hash.hadLocation).to.be.true;
        iD.prefs('map-location', null);
    });

    it('centerZooms map to previous map location', function () {
        iD.prefs('map-location', '19/43.80082/11.24567');
        hash();
        expect(context.map().center()[0]).to.be.closeTo(11.24567, 0.1);
        expect(context.map().center()[1]).to.be.closeTo(43.80082, 0.1);
        expect(context.map().zoom()).to.equal(19.0);
        iD.prefs('map-location', null);
    });

    it('centerZooms map to map hash if present previous map location', function () {
        iD.prefs('map-location', '19/43.80082/11.24567');
        window.location.hash = '#background=none&map=20.00/38.87952/-77.02405';
        hash();
        expect(context.map().center()[0]).to.be.closeTo(-77.02405, 0.1);
        expect(context.map().center()[1]).to.be.closeTo(38.87952, 0.1);
        expect(context.map().zoom()).to.equal(20.0);
        iD.prefs('map-location', null);
    });

    it('stores the current zoom and coordinates in window.location.hash on map move events', function (done) {
        hash();
        context.map().center([-77.0, 38.9]);
        context.map().zoom(2.0);
        window.setTimeout(function() {
            expect(window.location.hash).to.equal('#background=none&map=2.00/38.9/-77.0');
            done();
        }, 600);
    });
});
