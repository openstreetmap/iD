describe('iD.Connection', function () {
    var c;

    beforeEach(function () {
        c = new iD.Connection();
    });

    it('is instantiated', function () {
        expect(c).to.be.ok;
    });

    it('gets/sets url', function () {
        var new_url = 'http://api06.openstreetmap.org';
        expect(c.url(new_url)).to.equal(c);
        expect(c.url()).to.equal(new_url);
    });

    it('gets/sets user', function () {
        var user = { name: 'tom' };
        expect(c.user(user)).to.equal(c);
        expect(c.user()).to.equal(user);
    });

    describe('#loadFromURL', function () {
        it('loads test data', function (done) {
            c.loadFromURL('data/node.xml', done);
        });

        it('returns a graph', function (done) {
            c.loadFromURL('data/node.xml', function (err, graph) {
                expect(err).to.not.be.ok;
                expect(graph).to.be.instanceOf(iD.Graph);
                done();
            });
        });

        it('parses a node', function (done) {
            c.loadFromURL('data/node.xml', function (err, graph) {
                expect(graph.entity('n356552551')).to.be.instanceOf(iD.Entity);
                done();
            });
        });

        it('parses a way', function (done) {
            c.loadFromURL('data/way.xml', function (err, graph) {
                expect(graph.entity('w19698713')).to.be.instanceOf(iD.Entity);
                done();
            });
        });
    });

    describe('#osmChangeXML', function() {
        it('converts change data to XML', function() {
            var node = iD.Node({ id: 'n-1', type: 'node', loc: [-77, 38] }),
                way  = iD.Way({ id: 'w-1', type: 'way', nodes: [] }),
                xml  = c.osmChangeXML('jfire', '1234', {created: [node], modified: [way], deleted: []});
            expect(xml).to.eql('<osmChange version="0.3" generator="iD"><create><node id="-1" lon="-77" lat="38" version="0" changeset="1234"/></create><modify><way id="-1" version="0" changeset="1234"/></modify></osmChange>');
        });
    });
});
