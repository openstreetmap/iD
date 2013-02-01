describe("iD.behavior.Hash", function () {
    var hash, map, controller;

    beforeEach(function () {
        map = {
            on:     function () { return map; },
            zoom:   function () { return arguments.length ? map : 0; },
            center: function () { return arguments.length ? map : [0, 0]; },
            centerZoom: function () { return arguments.length ? map : [0, 0]; }
        };

        controller = {
            on: function () { return controller; }
        };

        hash = iD.behavior.Hash(controller, map);
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
        sinon.spy(map, 'centerZoom');
        hash();
        expect(map.centerZoom).to.have.been.calledWith([-77.02405,38.87952], 20.0);
    });

    describe("on window hashchange events", function () {
        beforeEach(function () {
            hash();
        });

        function onhashchange(fn) {
            d3.select(window).one("hashchange", fn);
        }

        it("centerZooms map at requested coordinates", function (done) {
            onhashchange(function () {
                expect(map.centerZoom).to.have.been.calledWith([-77.02405,38.87952], 20.0);
                done();
            });

            sinon.spy(map, 'centerZoom');
            location.hash = "#map=20.00/38.87952/-77.02405";
        });
    });

    describe("on map move events", function () {
        it("stores the current zoom and coordinates in location.hash", function () {
            sinon.stub(map, 'on')
                .withArgs("move.hash", sinon.match.instanceOf(Function))
                .yields();
            hash();
            expect(location.hash).to.equal("#map=0.00/0/0");
        });
    });
});
