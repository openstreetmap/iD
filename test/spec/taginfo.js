describe("iD.taginfo", function() {
    var server;

    beforeEach(function() {
        server = sinon.fakeServer.create();
    });

    afterEach(function() {
        server.restore();
    });

    function query(url) {
        return iD.util.stringQs(url.substring(url.indexOf('?') + 1));
    }

    describe("#keys", function() {
        it("calls the given callback with the results of the keys query", function() {
            var taginfo = iD.taginfo(),
                callback = sinon.spy();

            taginfo.keys({query: "amen"}, callback);

            server.respondWith("GET", new RegExp("http://taginfo.openstreetmap.org/api/2/db/keys"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"count_all":5190337,"key":"amenity"}]}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {query: "amen", page: "1", rp: "20", sortname: "count_all", sortorder: "desc"});
            expect(callback).to.have.been.calledWith(null,
                {"data":[{"count_all":5190337,"key":"amenity"}]});
        });
    });

    describe("#values", function() {
        it("calls the given callback with the results of the values query", function() {
            var taginfo = iD.taginfo(),
                callback = sinon.spy();

            taginfo.values({key: "amenity", query: "par"}, callback);

            server.respondWith("GET", new RegExp("http://taginfo.openstreetmap.org/api/2/db/keys/values"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"value":"parking","description":"A place for parking cars"}]}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {key: "amenity", query: "par", page: "1", rp: "20", sortname: 'count_all', sortorder: 'desc'});
            expect(callback).to.have.been.calledWith(null,
                {"data":[{"value":"parking","description":"A place for parking cars"}]});
        });
    });

    describe("#docs", function() {
        it("calls the given callback with the results of the docs query", function() {
            var taginfo = iD.taginfo(),
                callback = sinon.spy();

            taginfo.docs({key: "amenity", value: "parking"}, callback);

            server.respondWith("GET", new RegExp("http://taginfo.openstreetmap.org/api/2/wiki/tags"),
                [200, { "Content-Type": "application/json" },
                    '[{"on_way":false,"lang":"en","on_area":true,"image":"File:Car park2.jpg"}]']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {key: "amenity", value: "parking"});
            expect(callback).to.have.been.calledWith(null,
                [{"on_way":false,"lang":"en","on_area":true,"image":"File:Car park2.jpg"}]);
        });
    });
});
