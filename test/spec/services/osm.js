describe('iD.serviceOsm', function () {
    var context, connection;


    beforeEach(function () {
        context = iD.Context(window);
        connection = context.connection();
        connection.switch({ urlroot: 'http://www.openstreetmap.org'});
        connection.reset();
    });

    it('is instantiated', function () {
        expect(connection).to.be.ok;
    });

    it('allows insecure connections', function () {
        expect(connection.changesetURL(2)).to.match(/^http:/);
    });

    it('allows secure connections', function () {
        connection.switch({ urlroot: 'https://www.openstreetmap.org'});
        expect(connection.changesetURL(2)).to.match(/^https:/);
    });

    describe('#changesetUrl', function() {
        it('provides a changeset url', function() {
            expect(connection.changesetURL(2)).to.eql('http://www.openstreetmap.org/changeset/2');
        });
    });

    describe('#userURL', function() {
        it('provides a user url', function() {
            expect(connection.userURL('bob')).to.eql('http://www.openstreetmap.org/user/bob');
        });
    });

    describe('#reset', function() {
        it('resets the connection', function() {
            expect(connection.reset()).to.eql(connection);
        });
    });

    describe('#switch', function() {
        it('changes the URL', function() {
            connection.switch({ urlroot: 'http://example.com' });
            expect(connection.changesetURL(1)).to.equal('http://example.com/changeset/1');
        });

        it('emits a change event', function(done) {
            connection.on('change', function() {
                connection.on('change', null);
                done();
            });
            connection.switch({ urlroot: 'http://example.com' });
        });
    });

    describe('#loadFromAPI', function () {
        beforeEach(function() {
            // force loading locally via d3.xml
            connection.switch({ urlroot: '' }).logout();
        });

        it('loads test data', function (done) {
            connection.loadFromAPI('data/node.xml', done);
        });

        it('returns an object', function (done) {
            connection.loadFromAPI('data/node.xml', function (err, graph) {
                expect(err).to.not.be.ok;
                expect(typeof graph).to.eql('object');
                done();
            });
        });

        it('parses a node', function (done) {
            connection.loadFromAPI('data/node.xml', function (err, entities) {
                expect(entities[0]).to.be.instanceOf(iD.Entity);
                done();
            });
        });

        it('parses a way', function (done) {
            connection.loadFromAPI('data/way.xml', function (err, entities) {
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
            connection.loadEntity(id, function(err, result) {
                var entity = _.find(result.data, function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.Node);
                done();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/node/1',
                [200, { 'Content-Type': 'text/xml' }, nodeXML]);
            server.respond();
        });

        it('loads a way', function(done) {
            var id = 'w1';
            connection.loadEntity(id, function(err, result) {
                var entity = _.find(result.data, function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.Way);
                done();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/way/1/full',
                [200, { 'Content-Type': 'text/xml' }, wayXML]);
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
            connection.loadEntityVersion(id, 1, function(err, result) {
                var entity = _.find(result.data, function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.Node);
                done();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/node/1/1',
                [200, { 'Content-Type': 'text/xml' }, nodeXML]);
            server.respond();
        });

        it('loads a way', function(done) {
            var id = 'w1';
            connection.loadEntityVersion(id, 1, function(err, result) {
                var entity = _.find(result.data, function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.Way);
                done();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/way/1/1',
                [200, { 'Content-Type': 'text/xml' }, wayXML]);
            server.respond();
        });
    });

    describe('#loadMultiple', function () {
        var server;
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
            var jxon = connection.osmChangeJXON('1234', {created: [], modified: [], deleted: []});

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
                jxon = connection.osmChangeJXON('1234', changes);

            expect(d3.entries(jxon.osmChange.create)).to.eql([
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
                jxon = connection.osmChangeJXON('1234', changes);

            expect(jxon.osmChange.modify).to.eql({
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
                jxon = connection.osmChangeJXON('1234', changes);

            expect(d3.entries(jxon.osmChange.delete)).to.eql([
                {key: 'relation', value: [r.asJXON('1234').relation]},
                {key: 'way', value: [w.asJXON('1234').way]},
                {key: 'node', value: [n.asJXON('1234').node]},
                {key: '@if-unused', value: true}
            ]);
        });
    });

    describe('#userChangesets', function() {
        var server,
            userDetailsFn,
            changesetsXML = '<?xml version="1.0" encoding="UTF-8"?><osm>' +
                '<changeset id="36777543" user="Steve" uid="1" created_at="2016-01-24T15:02:06Z" closed_at="2016-01-24T15:02:07Z" open="false" min_lat="39.3823819" min_lon="-104.8639728" max_lat="39.3834184" max_lon="-104.8618622" comments_count="0">' +
                '<tag k="comment" v="Caprice Court has been extended"/>' +
                '<tag k="created_by" v="iD 2.0.0"/>' +
                '</changeset>' +
                '</osm>';

        beforeEach(function() {
            server = sinon.fakeServer.create();
            userDetailsFn = connection.userDetails;
            connection.userDetails = function (callback) {
                callback(undefined, { id: 1, displayName: 'Steve' });
            };
        });

        afterEach(function() {
            server.restore();
            connection.userDetails = userDetailsFn;
        });

        it('loads user changesets', function(done) {
            // preauthenticate, otherwise callback will be called with "not authenticated" err
            connection.switch({
                oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
                oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
                oauth_token: 'foo',
                oauth_token_secret: 'foo'
            });
            connection.userChangesets(function(err, changesets) {
                expect(changesets).to.deep.equal([{
                    tags: {
                        comment: 'Caprice Court has been extended',
                        created_by: 'iD 2.0.0'
                    }
                }]);
                connection.logout();
                done();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/changesets?user=1',
                [200, { 'Content-Type': 'text/xml' }, changesetsXML]);
            server.respond();
        });
    });

    describe('#changesetTags', function() {
        it('omits comment when empty', function() {
            expect(connection.changesetTags('2.0.0', '', [])).not.to.have.property('comment');
        });
    });
});
