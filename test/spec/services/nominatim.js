describe("iD.services.nominatim", function() {
    var server, nominatim;

    beforeEach(function() {
        server = sinon.fakeServer.create();
        nominatim = iD.services.nominatim();
        nominatim.reset();
    });

    afterEach(function() {
        server.restore();
    });

    function query(url) {
        return iD.util.stringQs(url.substring(url.indexOf('?') + 1));
    }

    describe("#countryCode", function() {
        it("calls the given callback with the results of the country code query", function() {
            var callback = sinon.spy();
            nominatim.countryCode([16, 48], callback);

            server.respondWith("GET", "https://nominatim.openstreetmap.org/reverse?addressdetails=1&format=json&lat=48&lon=16",
                [200, { "Content-Type": "application/json" },
                    '{"address":{"country_code":"at"}}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {format: "json", addressdetails: "1", lat: "48", lon: "16"});
            expect(callback).to.have.been.calledWith(null, "at");
        });
        it("should not cache the first country code result", function() {
            var callback = sinon.spy();
            nominatim.countryCode([16, 48], callback);

            server.respondWith("GET", "https://nominatim.openstreetmap.org/reverse?addressdetails=1&format=json&lat=48&lon=16",
                [200, { "Content-Type": "application/json" },
                    '{"address":{"country_code":"at"}}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {format: "json", addressdetails: "1", lat: "48", lon: "16"});
            expect(callback).to.have.been.calledWith(null, "at");

            server.restore();
            server = sinon.fakeServer.create();

            nominatim.countryCode([17, 49], callback);

            server.respondWith("GET", "https://nominatim.openstreetmap.org/reverse?addressdetails=1&format=json&lat=49&lon=17",
                [200, { "Content-Type": "application/json" },
                    '{"address":{"country_code":"cz"}}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {format: "json", addressdetails: "1", lat: "49", lon: "17"});
            expect(callback).to.have.been.calledWith(null, "cz");
        });
        it("should cache the first country code result", function() {
            var callback = sinon.spy();
            nominatim.countryCode([16, 48], callback);

            server.respondWith("GET", "https://nominatim.openstreetmap.org/reverse?addressdetails=1&format=json&lat=48&lon=16",
                [200, { "Content-Type": "application/json" },
                    '{"address":{"country_code":"at"}}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {format: "json", addressdetails: "1", lat: "48", lon: "16"});
            expect(callback).to.have.been.calledWith(null, "at");

            server.restore();
            server = sinon.fakeServer.create();

            nominatim.countryCode([16.01, 48.01], callback);

            server.respondWith("GET", "https://nominatim.openstreetmap.org/reverse?addressdetails=1&format=json&lat=48.01&lon=16.01",
                [200, { "Content-Type": "application/json" },
                    '{"address":{"country_code":"cz"}}']);
            server.respond();

            expect(callback).to.have.been.calledWith(null, "at");
        });
        it("calls the given callback with an error", function() {
            var callback = sinon.spy();
            nominatim.countryCode([1000, 1000], callback);

            server.respondWith("GET", "https://nominatim.openstreetmap.org/reverse?addressdetails=1&format=json&lat=1000&lon=1000",
                [200, { "Content-Type": "application/json" },
                    '{"error":"Unable to geocode"}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {format: "json", addressdetails: "1", lat: "1000", lon: "1000"});
            expect(callback).to.have.been.calledWith("Unable to geocode");
        });
    });
});
