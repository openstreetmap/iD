describe('iD.format.XML', function() {
    var node = iD.Node({ id: 'n-1', type: 'node', loc: [-77, 38] }),
        way  = iD.Way({ id: 'w-1', type: 'way', nodes: [] });

    describe('#decode', function() {
        it('decodes xml', function() {
            expect(iD.format.XML.decode('<">')).to.eql('&lt;&quot;&gt;');
        });
    });

    describe('#osmChange', function() {
        it('converts change data to XML', function() {
            var jxon = iD.format.XML.osmChange('jfire', '1234', {created: [node], modified: [way], deleted: []});
            expect(jxon).to.eql('<osmChange version="0.3" generator="iD"><create><node id="-1" lon="-77" lat="38" version="0" changeset="1234"/></create><modify><way id="-1" version="0" changeset="1234"/></modify></osmChange>');
        });
    });
});
