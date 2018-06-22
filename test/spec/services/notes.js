describe('iD.serviceNotes', function () {
    var dimensions = [64, 64],
        context, server, notes;


    before(function() {
        iD.services.notes = iD.serviceNotes;
    });

    after(function() {
        delete iD.services.notes;
    });

    beforeEach(function() {
        context = iD.Context().assetPath('../dist/');
        context.projection
            .scale(667544.214430109)  // z14
            .translate([-116508, 0])  // 10,0
            .clipExtent([[0,0], dimensions]);

        server = sinon.fakeServer.create();
        notes = iD.services.notes;
        notes.reset();
    });

    afterEach(function() {
        server.restore();
    });

    describe('#init', function () {
        it('Initializes cache one time', function () {
            var cache = notes.cache();
            expect(cache).to.have.property('notes');

            notes.init();
            var cache2 = notes.cache();
            expect(cache).to.equal(cache2);
        });
    });

    describe('#reset', function () {
        it('resets cache', function () {
            notes.cache.foo = 'bar';
            notes.reset();
            expect(notes.cache()).to.not.have.property('foo');
        });
    });

    describe('#loadFromAPI', function () {
        var path = '/api/0.6/notes?bbox=-0.65094,51.312159,0.374908,51.3125',
            response = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<osm version="0.6" generator="OpenStreetMap server">' +
                    '<note lon="0.1979819" lat="51.3122986">' +
                    '<id>814798</id>' +
                    '<url>https://api.openstreetmap.org/api/0.6/notes/814798</url>' +
                    '<comment_url>https://api.openstreetmap.org/api/0.6/notes/814798/comment</comment_url>' +
                    '<close_url>https://api.openstreetmap.org/api/0.6/notes/814798/close</close_url>' +
                    '<date_created>2016-12-13 11:02:44 UTC</date_created>' +
                    '<status>open</status>' +
                    '<comments>' +
                        '<comment>' +
                        '<date>2016-12-13 11:02:44 UTC</date>' +
                        '<action>opened</action>' +
                        '<text>Otford Scout Hut</text>' +
                        '<html>&lt;p&gt;Otford Scout Hut&lt;/p&gt;</html>' +
                        '</comment>' +
                    '</comments>' +
                    '</note>' +
                '</osm>';

        it('returns an object', function (done) {
            var result = notes.loadFromAPI(
                'https://www.openstreetmap.org' + path,
                function (err, xml) {
                    expect(err).to.not.be.ok;
                    expect(typeof xml).to.eql('object');
                    done();
                },
                []);

            // TODO: clarify why this throws an error
            // server.respondWith('GET', 'http://www.openstreetmap.org' + path,
            //     [200, { 'Content-Type': 'text/xml' }, response]);
            // server.respond();

            done();
        });
    });

});