describe('iD.serviceOsm', function () {
    var context, connection, spy;
    var serverFetch, serverXHR;

    function login() {
        connection.switch({
            urlroot: 'http://www.openstreetmap.org',
            oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
            oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
            oauth_token: 'foo',
            oauth_token_secret: 'foo'
        });
    }

    function logout() {
        connection.logout();
    }

    before(function() {
        iD.services.osm = iD.serviceOsm;
    });

    after(function() {
        delete iD.services.osm;
    });

    beforeEach(function () {
        serverFetch = window.fakeFetch().create();  // unauthenticated calls use d3-fetch
        serverXHR = sinon.fakeServer.create();      // authenticated calls use XHR via osm-auth
        context = iD.coreContext().init();
        connection = context.connection();
        connection.switch({ urlroot: 'http://www.openstreetmap.org' });
        connection.reset();
        spy = sinon.spy();
    });

    afterEach(function() {
        serverFetch.restore();
        serverXHR.restore();
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

    describe('#getConnectionId', function() {
        it('changes the connection id every time connection is reset', function() {
            var cid1 = connection.getConnectionId();
            connection.reset();
            var cid2 = connection.getConnectionId();
            expect(cid2).to.be.above(cid1);
        });
        it('changes the connection id every time connection is switched', function() {
            var cid1 = connection.getConnectionId();
            connection.switch({ urlroot: 'https://api06.dev.openstreetmap.org' });
            var cid2 = connection.getConnectionId();
            expect(cid2).to.be.above(cid1);
        });
    });

    describe('#changesetURL', function() {
        it('provides a changeset url', function() {
            expect(connection.changesetURL(2)).to.eql('http://www.openstreetmap.org/changeset/2');
        });
    });

    describe('#changesetsURL', function() {
        it('provides a local changesets url', function() {
            var center = [-74.65, 40.65];
            var zoom = 17;
            expect(connection.changesetsURL(center, zoom)).to.eql('http://www.openstreetmap.org/history#map=17/40.65000/-74.65000');
        });
    });

    describe('#entityURL', function() {
        it('provides an entity url for a node', function() {
            var e = iD.osmNode({id: 'n1'});
            expect(connection.entityURL(e)).to.eql('http://www.openstreetmap.org/node/1');
        });
        it('provides an entity url for a way', function() {
            var e = iD.osmWay({id: 'w1'});
            expect(connection.entityURL(e)).to.eql('http://www.openstreetmap.org/way/1');
        });
        it('provides an entity url for a relation', function() {
            var e = iD.osmRelation({id: 'r1'});
            expect(connection.entityURL(e)).to.eql('http://www.openstreetmap.org/relation/1');
        });
    });

    describe('#historyURL', function() {
        it('provides a history url for a node', function() {
            var e = iD.osmNode({id: 'n1'});
            expect(connection.historyURL(e)).to.eql('http://www.openstreetmap.org/node/1/history');
        });
        it('provides a history url for a way', function() {
            var e = iD.osmWay({id: 'w1'});
            expect(connection.historyURL(e)).to.eql('http://www.openstreetmap.org/way/1/history');
        });
        it('provides a history url for a relation', function() {
            var e = iD.osmRelation({id: 'r1'});
            expect(connection.historyURL(e)).to.eql('http://www.openstreetmap.org/relation/1/history');
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

        it('emits a change event', function() {
            connection.on('change', spy);
            connection.switch({ urlroot: 'http://example.com' });
            expect(spy).to.have.been.calledOnce;
        });
    });

    describe('#loadFromAPI', function () {
        var path = '/api/0.6/map.json?bbox=-74.542,40.655,-74.541,40.656';
        var response =
            '{' +
            '    "version":"0.6",' +
            '    "bounds":{"minlat":40.6550000,"minlon":-74.5420000,"maxlat":40.6560000,"maxlon":-74.5410000},' +
            '    "elements":[' +
            '        {"type":"node","id":"105340439","visible":true,"version":2,"changeset":2880013,"timestamp":"2009-10-18T07:47:39Z","user":"woodpeck_fixbot","uid":147510,"lat":40.6555,"lon":-74.5415},' +
            '        {"type":"node","id":"105340442","visible":true,"version":2,"changeset":2880013,"timestamp":"2009-10-18T07:47:39Z","user":"woodpeck_fixbot","uid":147510,"lat":40.6556,"lon":-74.5416},' +
            '        {"type":"way","id":"40376199","visible":true,"version":1,"changeset":2403012,"timestamp":"2009-09-07T16:01:13Z","user":"NJDataUploads","uid":148169,"nodes":[105340439,105340442],"tags":{"highway":"residential","name":"Potomac Drive"}}' +
            '    ]' +
            '}';

        it('returns an object', function(done) {
            connection.loadFromAPI(path, function (err, payload) {
                expect(err).to.not.be.ok;
                expect(typeof payload).to.eql('object');
                done();
            });

            serverFetch.respondWith('GET', 'http://www.openstreetmap.org' + path,
                [200, { 'Content-Type': 'application/json' }, response]);
            serverFetch.respond();
        });

        it('retries an authenticated call unauthenticated if 400 Bad Request', function (done) {
            login();

            connection.loadFromAPI(path, function (err, xml) {
                expect(err).to.be.not.ok;
                expect(typeof xml).to.eql('object');
                expect(connection.authenticated()).to.be.not.ok;
                done();
            });

            serverXHR.respondWith('GET', 'http://www.openstreetmap.org' + path,
                [400, { 'Content-Type': 'text/plain' }, 'Bad Request']);
            serverFetch.respondWith('GET', 'http://www.openstreetmap.org' + path,
                [200, { 'Content-Type': 'application/json' }, response]);

            serverXHR.respond();
            serverFetch.respond();
        });

        it('retries an authenticated call unauthenticated if 401 Unauthorized', function (done) {
            login();
            connection.loadFromAPI(path, function (err, xml) {
                expect(err).to.be.not.ok;
                expect(typeof xml).to.eql('object');
                expect(connection.authenticated()).to.be.not.ok;
                done();
            });

            serverXHR.respondWith('GET', 'http://www.openstreetmap.org' + path,
                [401, { 'Content-Type': 'text/plain' }, 'Unauthorized']);
            serverFetch.respondWith('GET', 'http://www.openstreetmap.org' + path,
                [200, { 'Content-Type': 'application/json' }, response]);

            serverXHR.respond();
            serverFetch.respond();
        });

        it('retries an authenticated call unauthenticated if 403 Forbidden', function (done) {
            login();
            connection.loadFromAPI(path, function (err, xml) {
                expect(err).to.be.not.ok;
                expect(typeof xml).to.eql('object');
                expect(connection.authenticated()).to.be.not.ok;
                done();
            });

            serverXHR.respondWith('GET', 'http://www.openstreetmap.org' + path,
                [403, { 'Content-Type': 'text/plain' }, 'Forbidden']);
            serverFetch.respondWith('GET', 'http://www.openstreetmap.org' + path,
                [200, { 'Content-Type': 'application/json' }, response]);

            serverXHR.respond();
            serverFetch.respond();
        });


        it('dispatches change event if 509 Bandwidth Limit Exceeded', function (done) {
            logout();
            connection.on('change', spy);
            connection.loadFromAPI(path, function (err) {
                expect(err).to.have.property('status', 509);
                expect(spy).to.have.been.calledOnce;
                done();
            });

            serverFetch.respondWith('GET', 'http://www.openstreetmap.org' + path,
                [509, { 'Content-Type': 'text/plain' }, 'Bandwidth Limit Exceeded']);
            serverFetch.respond();
        });

        it('dispatches change event if 429 Too Many Requests', function (done) {
            logout();
            connection.on('change', spy);
            connection.loadFromAPI(path, function (err) {
                expect(err).to.have.property('status', 429);
                expect(spy).to.have.been.calledOnce;
                done();
            });

            serverFetch.respondWith('GET', 'http://www.openstreetmap.org' + path,
                [429, { 'Content-Type': 'text/plain' }, '429 Too Many Requests']);
            serverFetch.respond();
        });
    });


    describe('#loadTiles', function() {
        var tileResponse =
            '{' +
            '    "version":"0.6",' +
            '    "bounds":{"minlat":40.6681396,"minlon":-74.0478516,"maxlat":40.6723060,"maxlon":-74.0423584},' +
            '    "elements":[' +
            '        {"type":"node","id":"368395606","visible":true,"version":3,"changeset":28924294,"timestamp":"2015-02-18T04:25:04Z","user":"peace2","uid":119748,"lat":40.6694299,"lon":-74.0444216,"tags":{"addr:state":"NJ","ele":"0","gnis:county_name":"Hudson","gnis:feature_id":"881377","gnis:feature_type":"Bay","name":"Upper Bay","natural":"bay"}}' +
            '    ]' +
            '}';

        beforeEach(function() {
            var dimensions = [64, 64];
            context.projection
                .scale(iD.geoZoomToScale(20))
                .translate([55212042.434589595, 33248879.510193843])  // -74.0444216, 40.6694299
                .clipExtent([[0,0], dimensions]);
        });

        it('calls callback when data tiles are loaded', function(done) {
            var spy = sinon.spy();
            connection.loadTiles(context.projection, spy);

            serverFetch.respondWith('GET', /map.json\?bbox/,
                [200, { 'Content-Type': 'application/json' }, tileResponse]);
            serverFetch.respond();

            window.setTimeout(function() {
                expect(spy).to.have.been.calledOnce;
                done();
            }, 500);
        });

        it('#isDataLoaded', function(done) {
            expect(connection.isDataLoaded([-74.0444216, 40.6694299])).to.be.not.ok;

            connection.loadTiles(context.projection);
            serverFetch.respondWith('GET', /map.json\?bbox/,
                [200, { 'Content-Type': 'application/json' }, tileResponse]);
            serverFetch.respond();

            window.setTimeout(function() {
                expect(connection.isDataLoaded([-74.0444216, 40.6694299])).to.be.ok;
                done();
            }, 500);
        });
    });

    describe('#loadEntity', function () {
        var nodeResponse =
            '{' +
            '    "version":"0.6",' +
            '    "elements":[' +
            '        {"type":"node","id":1,"visible":true,"version":1,"changeset":28924294,"timestamp":"2009-03-07T03:26:33Z","user":"peace2","uid":119748,"lat":0,"lon":0}' +
            '    ]' +
            '}';
        var wayResponse =
            '{' +
            '    "version":"0.6",' +
            '    "elements":[' +
            '        {"type":"node","id":1,"visible":true,"version":1,"changeset":2817006,"timestamp":"2009-10-11T18:03:23Z","user":"peace2","uid":119748,"lat":0,"lon":0},' +
            '        {"type":"way","id":1,"visible":true,"version":1,"changeset":522559,"timestamp":"2008-01-03T05:24:43Z","user":"peace2","uid":119748,"nodes":[1]}' +
            '    ]' +
            '}';

        it('loads a node', function(done) {
            var id = 'n1';
            connection.loadEntity(id, function(err, result) {
                var entity = result.data.find(function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.osmNode);
                done();
            });

            serverFetch.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/node/1.json',
                [200, { 'Content-Type': 'application/json' }, nodeResponse]);
            serverFetch.respond();
        });

        it('loads a way', function(done) {
            var id = 'w1';
            connection.loadEntity(id, function(err, result) {
                var entity = result.data.find(function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.osmWay);
                done();
            });

            serverFetch.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/way/1/full.json',
                [200, { 'Content-Type': 'application/json' }, wayResponse]);
            serverFetch.respond();
        });

        it('does not ignore repeat requests', function(done) {
            var id = 'n1';
            connection.loadEntity(id, function(err1, result1) {
                var entity1 = result1.data.find(function(e1) { return e1.id === id; });
                expect(entity1).to.be.an.instanceOf(iD.osmNode);
                connection.loadEntity(id, function(err2, result2) {
                    var entity2 = result2.data.find(function(e2) { return e2.id === id; });
                    expect(entity2).to.be.an.instanceOf(iD.osmNode);
                    done();
                });
                serverFetch.respond();
            });

            serverFetch.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/node/1.json',
                [200, { 'Content-Type': 'application/json' }, nodeResponse]);
            serverFetch.respond();
        });
    });


    describe('#loadEntityVersion', function () {
        var nodeResponse =
            '{' +
            '    "version":"0.6",' +
            '    "elements":[' +
            '        {"type":"node","id":1,"visible":true,"version":1,"changeset":28924294,"timestamp":"2009-03-07T03:26:33Z","user":"peace2","uid":119748,"lat":0,"lon":0}' +
            '    ]' +
            '}';
        var wayResponse =
            '{' +
            '    "version":"0.6",' +
            '    "elements":[' +
            '        {"type":"node","id":1,"visible":true,"version":1,"changeset":2817006,"timestamp":"2009-10-11T18:03:23Z","user":"peace2","uid":119748,"lat":0,"lon":0},' +
            '        {"type":"way","id":1,"visible":true,"version":1,"changeset":522559,"timestamp":"2008-01-03T05:24:43Z","user":"peace2","uid":119748,"nodes":[1]}' +
            '    ]' +
            '}';

        it('loads a node', function(done) {
            var id = 'n1';
            connection.loadEntityVersion(id, 1, function(err, result) {
                var entity = result.data.find(function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.osmNode);
                done();
            });

            serverFetch.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/node/1/1.json',
                [200, { 'Content-Type': 'application/json' }, nodeResponse]);
            serverFetch.respond();
        });

        it('loads a way', function(done) {
            var id = 'w1';
            connection.loadEntityVersion(id, 1, function(err, result) {
                var entity = result.data.find(function(e) { return e.id === id; });
                expect(entity).to.be.an.instanceOf(iD.osmWay);
                done();
            });

            serverFetch.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/way/1/1.json',
                [200, { 'Content-Type': 'application/json' }, wayResponse]);
            serverFetch.respond();
        });

        it('does not ignore repeat requests', function(done) {
            var id = 'n1';
            connection.loadEntityVersion(id, 1, function(err1, result1) {
                var entity1 = result1.data.find(function(e1) { return e1.id === id; });
                expect(entity1).to.be.an.instanceOf(iD.osmNode);
                connection.loadEntityVersion(id, 1, function(err2, result2) {
                    var entity2 = result2.data.find(function(e2) { return e2.id === id; });
                    expect(entity2).to.be.an.instanceOf(iD.osmNode);
                    done();
                });
                serverFetch.respond();
            });

            serverFetch.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/node/1/1.json',
                [200, { 'Content-Type': 'application/json' }, nodeResponse]);
            serverFetch.respond();
        });
    });


    describe('#loadMultiple', function () {
        it('loads nodes');
        it('loads ways');
        it('does not ignore repeat requests');
    });


    describe('#userChangesets', function() {
        var userDetailsFn;

        beforeEach(function() {
            userDetailsFn = connection.userDetails;
            connection.userDetails = function (callback) {
                callback(undefined, { id: 1, displayName: 'Steve' });
            };
        });

        afterEach(function() {
            connection.userDetails = userDetailsFn;
        });


        it('loads user changesets', function(done) {
            var changesetsXML = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<osm>' +
                '<changeset id="36777543" user="Steve" uid="1" created_at="2016-01-24T15:02:06Z" closed_at="2016-01-24T15:02:07Z" open="false" min_lat="39.3823819" min_lon="-104.8639728" max_lat="39.3834184" max_lon="-104.8618622" comments_count="0">' +
                '  <tag k="comment" v="Caprice Court has been extended"/>' +
                '  <tag k="created_by" v="iD 2.0.0"/>' +
                '</changeset>' +
                '</osm>';

            login();
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

            serverXHR.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/changesets?user=1',
                [200, { 'Content-Type': 'text/xml' }, changesetsXML]);
            serverXHR.respond();
        });

        it('excludes changesets without comment tag', function(done) {
            var changesetsXML = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<osm>' +
                '<changeset id="36777543" user="Steve" uid="1" created_at="2016-01-24T15:02:06Z" closed_at="2016-01-24T15:02:07Z" open="false" min_lat="39.3823819" min_lon="-104.8639728" max_lat="39.3834184" max_lon="-104.8618622" comments_count="0">' +
                '  <tag k="comment" v="Caprice Court has been extended"/>' +
                '  <tag k="created_by" v="iD 2.0.0"/>' +
                '</changeset>' +
                '<changeset id="36777544" user="Steve" uid="1" created_at="2016-01-24T15:02:06Z" closed_at="2016-01-24T15:02:07Z" open="false" min_lat="39.3823819" min_lon="-104.8639728" max_lat="39.3834184" max_lon="-104.8618622" comments_count="0">' +
                '  <tag k="created_by" v="iD 2.0.0"/>' +
                '</changeset>' +
                '</osm>';

            login();
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

            serverXHR.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/changesets?user=1',
                [200, { 'Content-Type': 'text/xml' }, changesetsXML]);
            serverXHR.respond();
        });

        it('excludes changesets with empty comment', function(done) {
            var changesetsXML = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<osm>' +
                '<changeset id="36777543" user="Steve" uid="1" created_at="2016-01-24T15:02:06Z" closed_at="2016-01-24T15:02:07Z" open="false" min_lat="39.3823819" min_lon="-104.8639728" max_lat="39.3834184" max_lon="-104.8618622" comments_count="0">' +
                '  <tag k="comment" v="Caprice Court has been extended"/>' +
                '  <tag k="created_by" v="iD 2.0.0"/>' +
                '</changeset>' +
                '<changeset id="36777544" user="Steve" uid="1" created_at="2016-01-24T15:02:06Z" closed_at="2016-01-24T15:02:07Z" open="false" min_lat="39.3823819" min_lon="-104.8639728" max_lat="39.3834184" max_lon="-104.8618622" comments_count="0">' +
                '  <tag k="comment" v=""/>' +
                '  <tag k="created_by" v="iD 2.0.0"/>' +
                '</changeset>' +
                '</osm>';

            login();
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

            serverXHR.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/changesets?user=1',
                [200, { 'Content-Type': 'text/xml' }, changesetsXML]);
            serverXHR.respond();
        });
    });

    describe('#caches', function() {
        it('loads reset caches', function () {
            var caches = connection.caches();
            expect(caches.tile).to.have.all.keys(['toLoad','loaded','inflight','seen','rtree']);
            expect(caches.note).to.have.all.keys(['toLoad','loaded','inflight','inflightPost','note','closed','rtree']);
            expect(caches.user).to.have.all.keys(['toLoad','user']);
        });

        describe('sets/gets caches', function() {
            it('sets/gets a tile', function () {
                var obj = {
                    tile: { loaded: { '1,2,16': true, '3,4,16': true } }
                };
                connection.caches(obj);
                expect(connection.caches().tile.loaded['1,2,16']).to.eql(true);
                expect(Object.keys(connection.caches().tile.loaded).length).to.eql(2);
            });

            it('sets/gets a note', function () {
                var note = iD.osmNote({ id: 1, loc: [0, 0] });
                var note2 = iD.osmNote({ id: 2, loc: [0, 0] });
                var obj = {
                    note: { note: { 1: note, 2: note2 } }
                };
                connection.caches(obj);
                expect(connection.caches().note.note[note.id]).to.eql(note);
                expect(Object.keys(connection.caches().note.note).length).to.eql(2);
            });

            it('sets/gets a user', function () {
                var user = { id: 1, display_name: 'Name' };
                var user2 = { id: 2, display_name: 'Name' };
                var obj = {
                    user: { user: { 1: user, 2: user2 } }
                };
                connection.caches(obj);
                expect(connection.caches().user.user[user.id]).to.eql(user);
                expect(Object.keys(connection.caches().user.user).length).to.eql(2);
            });
        });

    });

    describe('#loadNotes', function() {
        var notesXML = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<osm>' +
            '<note lon="10" lat="0">' +
            '  <id>1</id>' +
            '  <url>https://www.openstreetmap.org/api/0.6/notes/1</url>' +
            '  <comment_url>https://www.openstreetmap.org/api/0.6/notes/1/comment</comment_url>' +
            '  <close_url>https://www.openstreetmap.org/api/0.6/notes/1/close</close_url>' +
            '  <date_created>2019-01-01 00:00:00 UTC</date_created>' +
            '  <status>open</status>' +
            '  <comments>' +
            '    <comment>' +
            '      <date>2019-01-01 00:00:00 UTC</date>' +
            '      <uid>1</uid>' +
            '      <user>Steve</user>' +
            '      <user_url>https://www.openstreetmap.org/user/Steve</user_url>' +
            '      <action>opened</action>' +
            '      <text>This is a note</text>' +
            '      <html>&lt;p&gt;This is a note&lt;/p&gt;</html>' +
            '    </comment>' +
            '  </comments>' +
            '</note>' +
            '</osm>';

        beforeEach(function() {
            var dimensions = [64, 64];
            context.projection
                .scale(iD.geoZoomToScale(14))
                .translate([-116508, 0])  // 10,0
                .clipExtent([[0,0], dimensions]);
        });

        it('fires loadedNotes when notes are loaded', function(done) {
            connection.on('loadedNotes', spy);
            connection.loadNotes(context.projection, {});

            serverFetch.respondWith('GET', /notes\?/,
                [200, { 'Content-Type': 'text/xml' }, notesXML ]);
            serverFetch.respond();

            window.setTimeout(function() {
                expect(spy).to.have.been.calledOnce;
                done();
            }, 500);
        });
    });


    describe('#notes', function() {
        beforeEach(function() {
            var dimensions = [64, 64];
            context.projection
                .scale(iD.geoZoomToScale(14))
                .translate([-116508, 0])  // 10,0
                .clipExtent([[0,0], dimensions]);
        });

        it('returns notes in the visible map area', function() {
            var notes = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0] } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0] } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: '2', loc: [10,1] } }
            ];

            connection.caches('get').note.rtree.load(notes);
            var res = connection.notes(context.projection);

            expect(res).to.deep.eql([
                { key: '0', loc: [10,0] },
                { key: '1', loc: [10,0] }
            ]);
        });
    });


    describe('#getNote', function() {
        it('returns a note', function () {
            var note = iD.osmNote({ id: 1, loc: [0, 0], });
            var obj = {
                note: { note: { 1: note } }
            };
            connection.caches(obj);
            var result = connection.getNote(1);
            expect(result).to.deep.equal(note);
        });
    });

    describe('#removeNote', function() {
        it('removes a note that is new', function() {
            var note = iD.osmNote({ id: -1, loc: [0, 0], });
            connection.replaceNote(note);
            connection.removeNote(note);
            var result = connection.getNote(-1);
            expect(result).to.eql(undefined);
        });
    });


    describe('#replaceNote', function() {
        it('returns a new note', function () {
            var note = iD.osmNote({ id: 2, loc: [0, 0], });
            var result = connection.replaceNote(note);
            expect(result.id).to.eql(2);
            expect(connection.caches().note.note[2]).to.eql(note);
            var rtree = connection.caches().note.rtree;
            var result_rtree = rtree.search({ 'minX': -1, 'minY': -1, 'maxX': 1, 'maxY': 1 });
            expect(result_rtree.length).to.eql(1);
            expect(result_rtree[0].data).to.eql(note);
        });

        it('replaces a note', function () {
            var note = iD.osmNote({ id: 2, loc: [0, 0], });
            connection.replaceNote(note);
            note.status = 'closed';
            var result = connection.replaceNote(note);
            expect(result.status).to.eql('closed');

            var rtree = connection.caches().note.rtree;
            var result_rtree = rtree.search({ 'minX': -1, 'minY': -1, 'maxX': 1, 'maxY': 1 });
            expect(result_rtree.length).to.eql(1);
            expect(result_rtree[0].data.status).to.eql('closed');
        });
    });


    describe('API capabilities', function() {
        var capabilitiesXML = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<osm>' +
            '<api>' +
            '<version minimum="0.6" maximum="0.6"/>' +
            '<area maximum="0.25"/>' +
            '<tracepoints per_page="5000"/>' +
            '<waynodes maximum="2000"/>' +
            '<changesets maximum_elements="50000"/>' +
            '<timeout seconds="300"/>' +
            '<status database="online" api="online" gpx="online"/>' +
            '</api>' +
            '<policy><imagery>' +
            '<blacklist regex="\.foo\.com"/>' +
            '<blacklist regex="\.bar\.org"/>' +
            '</imagery></policy>' +
            '</osm>';

        describe('#status', function() {
            it('gets API status', function(done) {
                connection.status(function(err, val) {
                    expect(val).to.eql('online');
                    done();
                });

                serverFetch.respondWith('GET', 'http://www.openstreetmap.org/api/capabilities',
                    [200, { 'Content-Type': 'text/xml' }, capabilitiesXML]);
                serverFetch.respond();
            });
        });

        describe('#imageryBlocklists', function() {
            it('updates imagery blocklists', function(done) {
                connection.status(function() {
                    var blocklists = connection.imageryBlocklists();
                    expect(blocklists).to.deep.equal([new RegExp('\.foo\.com'), new RegExp('\.bar\.org')]);
                    done();
                });

                serverFetch.respondWith('GET', 'http://www.openstreetmap.org/api/capabilities',
                    [200, { 'Content-Type': 'text/xml' }, capabilitiesXML]);
                serverFetch.respond();
            });
        });

    });

});
