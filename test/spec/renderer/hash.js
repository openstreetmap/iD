describe("iD.Hash", function () {
    var hash, map, controller;

    beforeEach(function () {
        hash = iD.Hash();
        map = {
            on:     function () { return map; },
            zoom:   function () { return arguments.length ? map : 0; },
            center: function () { return arguments.length ? map : [0, 0]; },
            centerZoom: function () { return arguments.length ? map : [0, 0]; }
        };
        controller = {
            on: function () { return controller; }
        };
    });

    afterEach(function () {
        hash.map(null);
        location.hash = "";
    });

    describe("#map()", function () {
        it("gets and sets map", function () {
            expect(hash.controller(controller).map(map)).to.equal(hash);
            expect(hash.map()).to.equal(map);
        });

        it("sets hadHash if location.hash is present", function () {
            location.hash = "map=20.00/38.87952/-77.02405";
            hash.map(map);
            expect(hash.hadHash).to.be.true;
        });

        it("centerZooms map to requested level", function () {
            location.hash = "map=20.00/38.87952/-77.02405";
            sinon.spy(map, 'centerZoom');
            hash.map(map);
            expect(map.centerZoom).to.have.been.calledWith([-77.02405,38.87952], 20.0);
        });

        it("binds the map's move event", function () {
            sinon.spy(map, 'on');
            hash.map(map);
            expect(map.on).to.have.been.calledWith('move.hash', sinon.match.instanceOf(Function));
        });

        it("unbinds the map's move event", function () {
            sinon.spy(map, 'on');
            hash.map(map);
            hash.map(null);
            expect(map.on).to.have.been.calledWith('move.hash', null);
        });
    });

    describe("on window hashchange events", function () {
        beforeEach(function () {
            hash.map(map);
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
            hash.map(map);
            expect(location.hash).to.equal("#map=0.00/0/0");
        });
    });
});
