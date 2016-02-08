describe("iD.services.mapillary", function() {
    var server, mapillary;

    beforeEach(function() {
        server = sinon.fakeServer.create();
        mapillary = iD.services.mapillary();
        mapillary.reset();
    });

    afterEach(function() {
        server.restore();
    });

    function query(url) {
        return iD.util.stringQs(url.substring(url.indexOf('?') + 1));
    }

    describe("#images", function() {
    });

    describe("#signs", function() {
    });

});
