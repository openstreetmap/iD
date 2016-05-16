describe("iD.services.taginfo", function() {
    var server, taginfo;

    beforeEach(function() {
        server = sinon.fakeServer.create();
        taginfo = iD.services.taginfo().reset();
    });

    afterEach(function() {
        server.restore();
    });

    function query(url) {
        return iD.util.stringQs(url.substring(url.indexOf('?') + 1));
    }

    describe("#keys", function() {
        it("calls the given callback with the results of the keys query", function() {
            var callback = sinon.spy();
            taginfo.keys({query: "amen"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/keys/all"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"count_all":5190337,"key":"amenity","count_all_fraction":1.0}]}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {query: "amen", page: "1", rp: "10", sortname: "count_all", sortorder: "desc"});
            expect(callback).to.have.been.calledWith(null, [{"title":"amenity", "value":"amenity"}]);
        });

        it("includes popular keys", function() {
            var callback = sinon.spy();
            taginfo.keys({query: "amen"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/keys/all"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"count_all":5190337,"key":"amenity","count_all_fraction":1.0, "count_nodes_fraction":1.0},\
                              {"count_all":1,"key":"amenityother","count_all_fraction":0.0, "count_nodes_fraction":0.0}]}']);
            server.respond();

            expect(callback).to.have.been.calledWith(null, [{"title":"amenity", "value":"amenity"}]);
        });

        it("includes popular keys with an entity type filter", function() {
            var callback = sinon.spy();
            taginfo.keys({query: "amen", filter: "nodes"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/keys/all"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"count_all":5190337,"count_nodes":500000,"key":"amenity","count_all_fraction":1.0, "count_nodes_fraction":1.0},\
                              {"count_all":1,"key":"amenityother","count_all_fraction":0.0, "count_nodes":100}]}']);
            server.respond();

            expect(callback).to.have.been.calledWith(null, [{"title":"amenity", "value":"amenity"}]);
        });

        it("includes unpopular keys with a wiki page", function() {
            var callback = sinon.spy();
            taginfo.keys({query: "amen"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/keys/all"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"count_all":5190337,"key":"amenity","count_all_fraction":1.0, "count_nodes_fraction":1.0},\
                              {"count_all":1,"key":"amenityother","count_all_fraction":0.0, "count_nodes_fraction":0.0, "in_wiki": true}]}']);
            server.respond();

            expect(callback).to.have.been.calledWith(null, [
                {"title":"amenity", "value":"amenity"},
                {"title":"amenityother", "value":"amenityother"}
            ]);
        });

        it("sorts keys with ':' below keys without ':'", function() {
            var callback = sinon.spy();
            taginfo.keys({query: "ref"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/keys/all"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"key":"ref:bag","count_all":9790586,"count_all_fraction":0.0028},\
                              {"key":"ref","count_all":7933528,"count_all_fraction":0.0023}]}']);
            server.respond();

            expect(callback).to.have.been.calledWith(null, [{"title":"ref", "value":"ref"},{"title":"ref:bag", "value":"ref:bag"}]);
        });
    });

    describe("#multikeys", function() {
        it("calls the given callback with the results of the multikeys query", function() {
            var callback = sinon.spy();
            taginfo.multikeys({query: "recycling:"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/keys/all"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"count_all":69593,"key":"recycling:glass","count_all_fraction":0.0}]}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {query: "recycling:", page: "1", rp: "25", sortname: "count_all", sortorder: "desc"});
            expect(callback).to.have.been.calledWith(null, [{"title":"recycling:glass", "value":"recycling:glass"}]);
        });

        it("excludes multikeys with extra colons", function() {
            var callback = sinon.spy();
            taginfo.multikeys({query: "recycling:"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/keys/all"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"count_all":69593,"key":"recycling:glass","count_all_fraction":0.0},\
                              {"count_all":22,"key":"recycling:glass:color","count_all_fraction":0.0}]}']);
            server.respond();

            expect(callback).to.have.been.calledWith(null, [{"title":"recycling:glass", "value":"recycling:glass"}]);
        });
    });

    describe("#values", function() {
        it("calls the given callback with the results of the values query", function() {
            var callback = sinon.spy();
            taginfo.values({key: "amenity", query: "par"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/key/values"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"value":"parking","description":"A place for parking cars", "fraction":0.1}]}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {key: "amenity", query: "par", page: "1", rp: "25", sortname: 'count_all', sortorder: 'desc'});
            expect(callback).to.have.been.calledWith(null, [{"value":"parking","title":"A place for parking cars"}]);
        });

        it("includes popular values", function() {
            var callback = sinon.spy();
            taginfo.values({key: "amenity", query: "par"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/key/values"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"value":"parking","description":"A place for parking cars", "fraction":1.0},\
                              {"value":"party","description":"A place for partying", "fraction":0.0}]}']);
            server.respond();

            expect(callback).to.have.been.calledWith(null, [{"value":"parking","title":"A place for parking cars"}]);
        });

        it("includes unpopular values with a wiki page", function() {
            var callback = sinon.spy();
            taginfo.values({key: "amenity", query: "par"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/key/values"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"value":"parking","description":"A place for parking cars", "fraction":1.0},\
                              {"value":"party","description":"A place for partying", "fraction":0.0, "in_wiki": true}]}']);
            server.respond();

            expect(callback).to.have.been.calledWith(null, [
                {"value":"parking","title":"A place for parking cars"},
                {"value":"party","title":"A place for partying"}
            ]);
        });

        it("excludes values with capital letters and some punctuation", function() {
            var callback = sinon.spy();
            taginfo.values({key: "amenity", query: "par"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/key/values"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"value":"parking","description":"A place for parking cars", "fraction":0.2},\
                              {"value":"PArking","description":"A common mispelling", "fraction":0.2},\
                              {"value":"parking;partying","description":"A place for parking cars *and* partying", "fraction":0.2},\
                              {"value":"parking, partying","description":"A place for parking cars *and* partying", "fraction":0.2},\
                              {"value":"*","description":"", "fraction":0.2}]}']);
            server.respond();

            expect(callback).to.have.been.calledWith(null, [{"value":"parking","title":"A place for parking cars"}]);
        });
    });

    describe("#docs", function() {
        it("calls the given callback with the results of the docs query", function() {
            var callback = sinon.spy();
            taginfo.docs({key: "amenity", value: "parking"}, callback);

            server.respondWith("GET", new RegExp("https://taginfo.openstreetmap.org/api/4/tag/wiki_page"),
                [200, { "Content-Type": "application/json" },
                    '{"data":[{"on_way":false,"lang":"en","on_area":true,"image":"File:Car park2.jpg"}]}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {key: "amenity", value: "parking"});
            expect(callback).to.have.been.calledWith(null,
                [{"on_way":false,"lang":"en","on_area":true,"image":"File:Car park2.jpg"}]);
        });
    });

});
