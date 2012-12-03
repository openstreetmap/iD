describe("hash", function () {
  var hash, map;

  beforeEach(function () {
    hash = iD.Hash();
    map = {
      on:     function () { return map; },
      off:    function () { return map; },
      zoom:   function () { return arguments.length ? map : 0; },
      center: function () { return arguments.length ? map : [0, 0] }
    };
  });

  afterEach(function () {
    hash.map(null);
    location.hash = "";
  });

  describe("#map()", function () {
    it("gets and sets map", function () {
      expect(hash.map(map)).to.equal(hash);
      expect(hash.map()).to.equal(map);
    });

    it("sets hadHash if location.hash is present", function () {
      location.hash = "?map=20.00/38.87952/-77.02405";
      hash.map(map);
      expect(hash.hadHash).to.be.true;
    });

    it("zooms map to requested level", function () {
      location.hash = "?map=20.00/38.87952/-77.02405";
      sinon.spy(map, 'zoom');
      hash.map(map);
      expect(map.zoom).to.have.been.calledWith(20.0);
    });

    it("centers map at requested coordinates", function () {
      location.hash = "?map=20.00/38.87952/-77.02405";
      sinon.spy(map, 'center');
      hash.map(map);
      expect(map.center).to.have.been.calledWith([-77.02405, 38.87952]);
    });

    it("binds the map's move event", function () {
      sinon.spy(map, 'on');
      hash.map(map);
      expect(map.on).to.have.been.calledWith('move', sinon.match.instanceOf(Function));
    });

    it("unbinds the map's move event", function () {
      sinon.spy(map, 'on');
      sinon.spy(map, 'off');
      hash.map(map);
      hash.map(null);
      expect(map.off).to.have.been.calledWith('move', map.on.firstCall.args[1]);
    });
  });

  describe("on window hashchange events", function () {
    beforeEach(function() {
      hash.map(map);
    });

    function onhashchange(fn) {
        d3.select(window).one("hashchange", fn);
    }

    it("zooms map to requested level", function (done) {
      onhashchange(function () {
        expect(map.zoom).to.have.been.calledWith(20.0);
        done();
      });

      sinon.spy(map, 'zoom');
      location.hash = "#?map=20.00/38.87952/-77.02405";
    });

    it("centers map at requested coordinates", function (done) {
      onhashchange(function () {
        expect(map.center).to.have.been.calledWith([-77.02405, 38.87952]);
        done();
      });

      sinon.spy(map, 'center');
      location.hash = "#?map=20.00/38.87952/-77.02405";
    });
  });

  describe("on map move events", function () {
    it("stores the current zoom and coordinates in location.hash", function () {
      sinon.stub(map, 'on').yields();
      hash.map(map);
      expect(location.hash).to.equal("#?map=0.00/0/0");
    });
  });
});
