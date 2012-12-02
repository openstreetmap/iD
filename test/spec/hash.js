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
      expect(hash.map(map)).toBe(hash);
      expect(hash.map()).toBe(map);
    });

    it("sets hadHash if location.hash is present", function () {
      location.hash = "?map=20.00/38.87952/-77.02405";
      hash.map(map);
      expect(hash.hadHash).toBeTruthy();
    });

    it("zooms map to requested level", function () {
      location.hash = "?map=20.00/38.87952/-77.02405";
      spyOn(map, 'zoom').andCallThrough();
      hash.map(map);
      expect(map.zoom).toHaveBeenCalledWith(20.0);
    });

    it("centers map at requested coordinates", function () {
      location.hash = "?map=20.00/38.87952/-77.02405";
      spyOn(map, 'center').andCallThrough();
      hash.map(map);
      expect(map.center).toHaveBeenCalledWith([-77.02405, 38.87952]);
    });

    it("binds the map's move event", function () {
      spyOn(map, 'on');
      hash.map(map);
      expect(map.on).toHaveBeenCalledWith('move', jasmine.any(Function));
    });

    it("unbinds the map's move event", function () {
      spyOn(map, 'on');
      spyOn(map, 'off');
      hash.map(map);
      hash.map(null);
      expect(map.off).toHaveBeenCalledWith('move', map.on.mostRecentCall.args[1]);
    });
  });

  describe("on window hashchange events", function () {
    var hashchanged,
        hashchange = function () { return hashchanged; };

    beforeEach(function() {
      hash.map(map);
      hashchanged = false;
      window.addEventListener("hashchange", function () { hashchanged = true; }, false);
    });

    it("zooms map to requested level", function () {
      spyOn(map, 'zoom').andCallThrough();
      location.hash = "#?map=20.00/38.87952/-77.02405";
      waitsFor(hashchange);
      runs(function () {
        expect(map.zoom).toHaveBeenCalledWith(20.0);
      });
    });

    it("centers map at requested coordinates", function () {
      spyOn(map, 'center').andCallThrough();
      location.hash = "#?map=20.00/38.87952/-77.02405";
      waitsFor(hashchange);
      runs(function () {
        expect(map.center).toHaveBeenCalledWith([-77.02405, 38.87952]);
      });
    });
  });

  describe("on map move events", function () {
    it("stores the current zoom and coordinates in location.hash", function () {
      spyOn(map, 'on');
      hash.map(map);
      map.on.mostRecentCall.args[1]();
      expect(location.hash).toEqual("#?map=0.00/0/0");
    });
  });
});
