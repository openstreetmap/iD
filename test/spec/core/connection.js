describe('iD.Connection', function () {
    var c;

    beforeEach(function () {
        c = new iD.Connection();
    });

    it('is instantiated', function () {
        expect(c).to.be.ok;
    });

    it('allows insecure connections', function () {
        expect(c.changesetURL(2)).to.match(/^http:/);

        c = new iD.Connection(false);
        expect(c.changesetURL(2)).to.match(/^http:/);
    });

    it('allows secure connections', function () {
        c = new iD.Connection(true);
        expect(c.changesetURL(2)).to.match(/^https:/);
    });

    describe('#changesetUrl', function() {
        it('provides a changeset url', function() {
            expect(c.changesetURL(2)).to.eql('http://www.openstreetmap.org/changeset/2');
        });
    });

    describe('#userURL', function() {
        it('provides a user url', function() {
            expect(c.userURL('bob')).to.eql('http://www.openstreetmap.org/user/bob');
        });
    });

    describe('#flush', function() {
        it('flushes the connection', function() {
            expect(c.flush()).to.eql(c);
        });
    });

    describe("#switch", function() {
        it("changes the URL", function() {
            c.switch({
                url: "http://example.com"
            });
            expect(c.changesetURL(1)).to.equal("http://example.com/changeset/1")
        });

        it("emits an auth event", function(done) {
            c.on('auth', function() {
                done();
            });
            c.switch({
                url: "http://example.com"
            });
        });
    });

    describe('#loadFromURL', function () {
        it('loads test data', function (done) {
            c.loadFromURL('data/node.xml', done);
        });

        it('returns an object', function (done) {
            c.loadFromURL('data/node.xml', function (err, graph) {
                expect(err).to.not.be.ok;
                expect(typeof graph).to.eql('object');
                done();
            });
        });

        it('parses a node', function (done) {
            c.loadFromURL('data/node.xml', function (err, entities) {
                expect(entities[0]).to.be.instanceOf(iD.Entity);
                done();
            });
        });

        it('parses a way', function (done) {
            c.loadFromURL('data/way.xml', function (err, entities) {
                expect(entities[0]).to.be.instanceOf(iD.Entity);
                done();
            });
        });
    });

    describe('#loadEntity', function () {
        var server,
            nodeXML = '<?xml version="1.0" encoding="UTF-8"?><osm>' +
                '<node id="1" version="1" changeset="1" lat="0" lon="0" visible="true" timestamp="2009-03-07T03:26:33Z"></node>' +
                '</osm>',
            wayXML = '<?xml version="1.0" encoding="UTF-8"?><osm>' +
                '<node id="1" version="1" changeset="2817006" lat="0" lon="0" visible="true" timestamp="2009-10-11T18:03:23Z"/>' +
                '<way id="1" visible="true" timestamp="2008-01-03T05:24:43Z" version="1" changeset="522559"><nd ref="1"/></way>' +
                '</osm>';

        beforeEach(function() {
            server = sinon.fakeServer.create();
        });

        afterEach(function() {
            server.restore();
        });

        it('loads a node', function(done) {
            var id = 'n1';
            c.loadEntity(id, function(err, result) {
                var entity = _.find(result.data, function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.Node);
                done();
            });

            server.respondWith("GET", "http://www.openstreetmap.org/api/0.6/node/1",
                [200, { "Content-Type": "text/xml" }, nodeXML]);
            server.respond();
        });

        it('loads a way', function(done) {
            var id = 'w1';
            c.loadEntity(id, function(err, result) {
                var entity = _.find(result.data, function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.Way);
                done();
            });

            server.respondWith("GET", "http://www.openstreetmap.org/api/0.6/way/1/full",
                [200, { "Content-Type": "text/xml" }, wayXML]);
            server.respond();
        });
    });

    describe('#loadEntityVersion', function () {
        var server,
            nodeXML = '<?xml version="1.0" encoding="UTF-8"?><osm>' +
                '<node id="1" version="1" changeset="1" lat="0" lon="0" visible="true" timestamp="2009-03-07T03:26:33Z"></node>' +
                '</osm>',
            wayXML = '<?xml version="1.0" encoding="UTF-8"?><osm>' +
                '<way id="1" visible="true" timestamp="2008-01-03T05:24:43Z" version="1" changeset="522559"><nd ref="1"/></way>' +
                '</osm>';

        beforeEach(function() {
            server = sinon.fakeServer.create();
        });

        afterEach(function() {
            server.restore();
        });

        it('loads a node', function(done) {
            var id = 'n1';
            c.loadEntityVersion(id, 1, function(err, result) {
                var entity = _.find(result.data, function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.Node);
                done();
            });

            server.respondWith("GET", "http://www.openstreetmap.org/api/0.6/node/1/1",
                [200, { "Content-Type": "text/xml" }, nodeXML]);
            server.respond();
        });

        it('loads a way', function(done) {
            var id = 'w1';
            c.loadEntityVersion(id, 1, function(err, result) {
                var entity = _.find(result.data, function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.Way);
                done();
            });

            server.respondWith("GET", "http://www.openstreetmap.org/api/0.6/way/1/1",
                [200, { "Content-Type": "text/xml" }, wayXML]);
            server.respond();
        });
    });

    describe('#loadMultiple', function () {
        beforeEach(function() {
            server = sinon.fakeServer.create();
        });

        afterEach(function() {
            server.restore();
        });

        it('loads nodes');
        it('loads ways');

    });


    describe('#osmChangeJXON', function() {
        it('converts change data to JXON', function() {
            var jxon = c.osmChangeJXON('1234', {created: [], modified: [], deleted: []});

            expect(jxon).to.eql({
                osmChange: {
                    '@version': 0.6,
                    '@generator': 'iD',
                    'create': {},
                    'modify': {},
                    'delete': {'@if-unused': true}
                }
            });
        });

        it('includes creations ordered by nodes, ways, relations', function() {
            var n = iD.Node({loc: [0, 0]}),
                w = iD.Way(),
                r = iD.Relation(),
                changes = {created: [r, w, n], modified: [], deleted: []},
                jxon = c.osmChangeJXON('1234', changes);

            expect(d3.entries(jxon.osmChange['create'])).to.eql([
                {key: 'node', value: [n.asJXON('1234').node]},
                {key: 'way', value: [w.asJXON('1234').way]},
                {key: 'relation', value: [r.asJXON('1234').relation]}
            ]);
        });

        it('includes modifications', function() {
            var n = iD.Node({loc: [0, 0]}),
                w = iD.Way(),
                r = iD.Relation(),
                changes = {created: [], modified: [r, w, n], deleted: []},
                jxon = c.osmChangeJXON('1234', changes);

            expect(jxon.osmChange['modify']).to.eql({
                node: [n.asJXON('1234').node],
                way: [w.asJXON('1234').way],
                relation: [r.asJXON('1234').relation]
            });
        });

        it('includes deletions ordered by relations, ways, nodes', function() {
            var n = iD.Node({loc: [0, 0]}),
                w = iD.Way(),
                r = iD.Relation(),
                changes = {created: [], modified: [], deleted: [n, w, r]},
                jxon = c.osmChangeJXON('1234', changes);

            expect(d3.entries(jxon.osmChange['delete'])).to.eql([
                {key: 'relation', value: [r.asJXON('1234').relation]},
                {key: 'way', value: [w.asJXON('1234').way]},
                {key: 'node', value: [n.asJXON('1234').node]},
                {key: '@if-unused', value: true}
            ]);
        });
    });

    describe('#userChangesets', function() {
        var server,
            changesetsXML = '<?xml version="1.0" encoding="UTF-8"?><osm>' +
                '<changeset id="36777543" user="Steve" uid="1" created_at="2016-01-24T15:02:06Z" closed_at="2016-01-24T15:02:07Z" open="false" min_lat="39.3823819" min_lon="-104.8639728" max_lat="39.3834184" max_lon="-104.8618622" comments_count="0">' +
                '<tag k="comment" v="Caprice Court has been extended"/>' +
                '<tag k="created_by" v="iD 1.8.5"/>' +
                '</changeset>' +
                '</osm>';

        beforeEach(function() {
            server = sinon.fakeServer.create();
        });

        afterEach(function() {
            server.restore();
        });

        it('loads user changesets', function(done) {
            c.userDetails = function (callback) {
                callback(undefined, { id: 1 });
            };

            c.userChangesets(function(err, changesets) {
                expect(changesets).to.deep.equal([{
                    tags: {
                        comment: 'Caprice Court has been extended',
                        created_by: 'iD 1.8.5'
                    }
                }]);
                done();
            });

            server.respondWith("GET", "http://www.openstreetmap.org/api/0.6/changesets?user=1",
                [200, { "Content-Type": "text/xml" }, changesetsXML]);
            server.respond();
        });
    });

    describe('#changesetTags', function() {
        it('omits comment when empty', function() {
            expect(c.changesetTags('', [])).not.to.have.property('comment');
        })
    })
});
