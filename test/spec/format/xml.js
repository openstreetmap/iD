describe('iD.format.XML', function() {
    var node = iD.Node({ id: 'n-1', type: 'node', loc: [-77, 38] }),
        way  = iD.Way({ id: 'w-1', type: 'way', nodes: [] });

    describe('#decode', function() {
        it('decodes xml', function() {
            expect(iD.format.XML.decode('<">')).to.eql('&lt;&quot;&gt;');
        });
    });

    describe('#rep', function() {
        it('converts a node to jxon', function() {
            expect(iD.format.XML.rep(node))
                .to.eql({ node : { '@id': '-1', '@lat': 38, '@lon': -77, '@version': 0, tag: [ ] } });
        });

        it('converts a way to jxon', function() {
            expect(iD.format.XML.rep(way))
                .to.eql({ way : { '@id' : '-1', nd : [ ], '@version': 0, tag: [ ] } });
        });

        it('includes changeset if provided', function() {
            expect(iD.format.XML.rep(node, '1234'))
                .to.eql({ node : { '@id': '-1', '@lat': 38, '@lon': -77, '@version': 0, '@changeset': '1234', tag: [ ] } });

            expect(iD.format.XML.rep(way, '1234'))
                .to.eql({ way : { '@id' : '-1', nd : [ ], '@version': 0, '@changeset': '1234', tag: [ ] } });
        });
    });

    describe('#osmChange', function() {
        it('converts change data to XML', function() {
            var jxon = iD.format.XML.osmChange('jfire', '1234', {created: [node], modified: [way], deleted: []});
            expect(jxon).to.eql('<osmChange version="0.3" generator="iD"><create><node id="-1" lon="-77" lat="38" version="0" changeset="1234"/></create><modify><way id="-1" version="0" changeset="1234"/></modify></osmChange>');
        });
    });

    describe('#mapping', function() {
        it('serializes a node to xml', function() {
            expect(iD.format.XML.mapping({ id: 'n-1', type: 'node', loc: [-77, 38] }))
            .to.equal('&lt;node id=&quot;-1&quot; lon=&quot;-77&quot; lat=&quot;38&quot; version=&quot;0&quot;/&gt;');
        });

        it('serializes a way to xml', function() {
            expect(iD.format.XML.mapping({ type: 'way', nodes: [], id: 'w-1' }))
            .to.equal('&lt;way id=&quot;-1&quot; version=&quot;0&quot;/&gt;');
        });
    });
});
