describe('iD.serviceOsm', function () {
    var context, connection, server, spy;

    function login() {
        if (!connection) return;
        connection.switch({
            urlroot: 'http://www.openstreetmap.org',
            oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
            oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
            oauth_token: 'foo',
            oauth_token_secret: 'foo'
        });
    }

    function logout() {
        if (!connection) return;
        connection.logout();
    }

    before(function() {
        iD.services.osm = iD.serviceOsm;
    });

    after(function() {
        delete iD.services.osm;
    });

    beforeEach(function () {
        server = sinon.fakeServer.create();
        context = iD.Context();
        connection = context.connection();
        connection.switch({ urlroot: 'http://www.openstreetmap.org' });
        connection.reset();
        spy = sinon.spy();
    });

    afterEach(function() {
        server.restore();
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
            var e = iD.Node({id: 'n1'});
            expect(connection.entityURL(e)).to.eql('http://www.openstreetmap.org/node/1');
        });
        it('provides an entity url for a way', function() {
            var e = iD.Way({id: 'w1'});
            expect(connection.entityURL(e)).to.eql('http://www.openstreetmap.org/way/1');
        });
        it('provides an entity url for a relation', function() {
            var e = iD.Relation({id: 'r1'});
            expect(connection.entityURL(e)).to.eql('http://www.openstreetmap.org/relation/1');
        });
    });

    describe('#historyURL', function() {
        it('provides a history url for a node', function() {
            var e = iD.Node({id: 'n1'});
            expect(connection.historyURL(e)).to.eql('http://www.openstreetmap.org/node/1/history');
        });
        it('provides a history url for a way', function() {
            var e = iD.Way({id: 'w1'});
            expect(connection.historyURL(e)).to.eql('http://www.openstreetmap.org/way/1/history');
        });
        it('provides a history url for a relation', function() {
            var e = iD.Relation({id: 'r1'});
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
        var path = '/api/0.6/map?bbox=-74.542,40.655,-74.541,40.656',
            response = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<osm version="0.6">' +
                '  <bounds minlat="40.655" minlon="-74.542" maxlat="40.656" maxlon="-74.541' +
                '  <node id="105340439" visible="true" version="2" changeset="2880013" timestamp="2009-10-18T07:47:39Z" user="woodpeck_fixbot" uid="147510" lat="40.6555" lon="-74.5415"/>' +
                '  <node id="105340442" visible="true" version="2" changeset="2880013" timestamp="2009-10-18T07:47:39Z" user="woodpeck_fixbot" uid="147510" lat="40.6556" lon="-74.5416"/>' +
                '  <way id="40376199" visible="true" version="1" changeset="2403012" timestamp="2009-09-07T16:01:13Z" user="NJDataUploads" uid="148169">' +
                '    <nd ref="105340439"/>' +
                '    <nd ref="105340442"/>' +
                '    <tag k="highway" v="residential"/>' +
                '    <tag k="name" v="Potomac Drive"/>' +
                '  </way>' +
                '</osm>';

        beforeEach(function() {
            connection.reset();
            server = sinon.fakeServer.create();
            spy = sinon.spy();
        });

        afterEach(function() {
            server.restore();
        });


        it('returns an object', function (done) {
            connection.loadFromAPI(path, function (err, xml) {
                expect(err).to.not.be.ok;
                expect(typeof xml).to.eql('object');
                done();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org' + path,
                [200, { 'Content-Type': 'text/xml' }, response]);
            server.respond();
        });

        it('retries an authenticated call unauthenticated if 400 Bad Request', function (done) {
            login();
            connection.loadFromAPI(path, function (err, xml) {
                expect(err).to.be.not.ok;
                expect(typeof xml).to.eql('object');
                expect(connection.authenticated()).to.be.not.ok;
                done();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org' + path,
                function(request) {
                    if (connection.authenticated()) {
                        return request.respond(400, {});
                    } else {
                        return request.respond(200, { 'Content-Type': 'text/xml' }, response);
                    }
                }
            );
            server.respond();
            server.respond();
        });

        it('retries an authenticated call unauthenticated if 401 Unauthorized', function (done) {
            login();
            connection.loadFromAPI(path, function (err, xml) {
                expect(err).to.be.not.ok;
                expect(typeof xml).to.eql('object');
                expect(connection.authenticated()).to.be.not.ok;
                done();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org' + path,
                function(request) {
                    if (connection.authenticated()) {
                        return request.respond(401, {});
                    } else {
                        return request.respond(200, { 'Content-Type': 'text/xml' }, response);
                    }
                }
            );
            server.respond();
            server.respond();
        });

        it('retries an authenticated call unauthenticated if 403 Forbidden', function (done) {
            login();
            connection.loadFromAPI(path, function (err, xml) {
                expect(err).to.be.not.ok;
                expect(typeof xml).to.eql('object');
                expect(connection.authenticated()).to.be.not.ok;
                done();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org' + path,
                function(request) {
                    if (connection.authenticated()) {
                        return request.respond(403, {});
                    } else {
                        return request.respond(200, { 'Content-Type': 'text/xml' }, response);
                    }
                }
            );
            server.respond();
            server.respond();
        });


        it('dispatches change event if 509 Bandwidth Limit Exceeded', function (done) {
            logout();
            connection.on('change', spy);
            connection.loadFromAPI(path, function (err) {
                expect(err).to.have.property('status', 509);
                expect(spy).to.have.been.calledOnce;
                done();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org' + path,
                function(request) {
                    if (!connection.authenticated()) {
                        // workaround: sinon.js seems to call error handler with a
                        // sinon.Event instead of the target XMLHttpRequest object..
                        var orig = request.onreadystatechange;
                        request.onreadystatechange = function(o) { orig((o && o.target) || o); };
                        return request.respond(509, {});
                    } else {
                        return request.respond(200, { 'Content-Type': 'text/xml' }, response);
                    }
                }
            );
            server.respond();
        });

        it('dispatches change event if 429 Too Many Requests', function (done) {
            logout();
            connection.on('change', spy);
            connection.loadFromAPI(path, function (err) {
                expect(err).to.have.property('status', 429);
                expect(spy).to.have.been.calledOnce;
                done();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org' + path,
                function(request) {
                    if (!connection.authenticated()) {
                        // workaround: sinon.js seems to call error handler with a
                        // sinon.Event instead of the target XMLHttpRequest object..
                        var orig = request.onreadystatechange;
                        request.onreadystatechange = function(o) { orig((o && o.target) || o); };
                        return request.respond(429, {});
                    } else {
                        return request.respond(200, { 'Content-Type': 'text/xml' }, response);
                    }
                }
            );
            server.respond();
        });

    });

    describe('#loadEntity', function () {
        var nodeXML = '<?xml version="1.0" encoding="UTF-8"?><osm>' +
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

        it('does not ignore repeat requests', function(done) {
            var id = 'n1';
            connection.loadEntity(id, function(err1, result1) {
                var entity1 = _.find(result1.data, function(e1) { return e1.id === id; });
                expect(entity1).to.be.an.instanceOf(iD.Node);
                connection.loadEntity(id, function(err2, result2) {
                    var entity2 = _.find(result2.data, function(e2) { return e2.id === id; });
                    expect(entity2).to.be.an.instanceOf(iD.Node);
                    done();
                });
                server.respond();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/node/1',
                [200, { 'Content-Type': 'text/xml' }, nodeXML]);
            server.respond();
        });
    });

    describe('#loadEntityVersion', function () {
        var nodeXML = '<?xml version="1.0" encoding="UTF-8"?><osm>' +
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

        it('does not ignore repeat requests', function(done) {
            var id = 'n1';
            connection.loadEntityVersion(id, 1, function(err1, result1) {
                var entity1 = _.find(result1.data, function(e1) { return e1.id === id; });
                expect(entity1).to.be.an.instanceOf(iD.Node);
                connection.loadEntityVersion(id, 1, function(err2, result2) {
                    var entity2 = _.find(result2.data, function(e2) { return e2.id === id; });
                    expect(entity2).to.be.an.instanceOf(iD.Node);
                    done();
                });
                server.respond();
            });

            server.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/node/1/1',
                [200, { 'Content-Type': 'text/xml' }, nodeXML]);
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
        it('does not ignore repeat requests');

    });


    describe('#userChangesets', function() {
        var userDetailsFn;

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

            server.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/changesets?user=1',
                [200, { 'Content-Type': 'text/xml' }, changesetsXML]);
            server.respond();
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

            server.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/changesets?user=1',
                [200, { 'Content-Type': 'text/xml' }, changesetsXML]);
            server.respond();
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

            server.respondWith('GET', 'http://www.openstreetmap.org/api/0.6/changesets?user=1',
                [200, { 'Content-Type': 'text/xml' }, changesetsXML]);
            server.respond();
        });

    });


    describe('API capabilities', function() {
        var capabilitiesXML = '<?xml version="1.0" encoding="UTF-8"?><osm>' +
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


        beforeEach(function() {
            server = sinon.fakeServer.create();
        });

        afterEach(function() {
            server.restore();
        });

        describe('#status', function() {
            it('gets API status', function(done) {
                connection.status(function(err, val) {
                    expect(val).to.eql('online');
                    done();
                });

                server.respondWith('GET', 'http://www.openstreetmap.org/api/capabilities',
                    [200, { 'Content-Type': 'text/xml' }, capabilitiesXML]);
                server.respond();
            });
        });

        describe('#imageryBlacklists', function() {
            it('updates imagery blacklists', function(done) {
                connection.status(function() {
                    var blacklists = connection.imageryBlacklists();
                    expect(blacklists).to.deep.equal(['\.foo\.com','\.bar\.org']);
                    done();
                });

                server.respondWith('GET', 'http://www.openstreetmap.org/api/capabilities',
                    [200, { 'Content-Type': 'text/xml' }, capabilitiesXML]);
                server.respond();
            });
        });

    });

});
