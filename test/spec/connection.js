describe('iD.Connection', function () {
    var c, context;

    beforeEach(function () {
        context = iD();
        c = new iD.Connection(context, {});
    });

    it('is instantiated', function () {
        expect(c).to.be.ok;
    });

    it('gets/sets user', function () {
        var user = { name: 'tom' };
        expect(c.user(user)).to.equal(c);
        expect(c.user()).to.equal(user);
    });

    describe('#changesetUrl', function() {
        it('provides a changeset url', function() {
            expect(c.changesetURL(2)).to.eql('http://www.openstreetmap.org/browse/changeset/2');
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
            expect(c.changesetURL(1)).to.equal("http://example.com/browse/changeset/1")
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
            c.loadFromURL('data/node.xml', function (err, graph) {
                expect(graph.n356552551).to.be.instanceOf(iD.Entity);
                done();
            });
        });

        it('parses a way', function (done) {
            c.loadFromURL('data/way.xml', function (err, graph) {
                expect(graph.w19698713).to.be.instanceOf(iD.Entity);
                done();
            });
        });
    });

    describe('#osmChangeJXON', function() {
        it('converts change data to JXON', function() {
            var jxon = c.osmChangeJXON('jfire', '1234', {created: [], modified: [], deleted: []});

            expect(jxon).to.eql({
                osmChange: {
                    '@version': 0.3,
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
                jxon = c.osmChangeJXON('jfire', '1234', changes);

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
                jxon = c.osmChangeJXON('jfire', '1234', changes);

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
                jxon = c.osmChangeJXON('jfire', '1234', changes);

            expect(d3.entries(jxon.osmChange['delete'])).to.eql([
                {key: 'relation', value: [r.asJXON('1234').relation]},
                {key: 'way', value: [w.asJXON('1234').way]},
                {key: 'node', value: [n.asJXON('1234').node]},
                {key: '@if-unused', value: true}
            ]);
        });
    });
});
