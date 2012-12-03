describe('XML', function() {
    describe('#rep', function() {
        it('converts a node to jxon', function() {
            expect(iD.format.XML.rep({ id: 'n-1', type: 'node', lat: 38, lon: -77 }))
            .to.eql({ node : { '@id': '-1', '@lat': 38, '@lon': -77, '@version': 0, tag: [ ] } });
        });
        it('converts a way to jxon', function() {
            expect(iD.format.XML.rep({ id: 'w-1', type: 'way', nodes: [] }))
            .to.eql({ way : { '@id' : '-1', nd : [ ], '@version': 0, tag: [ ] } });
        });
    });

    describe('#mapping', function() {
        it('serializes a node to xml', function() {
            expect(iD.format.XML.mapping({ id: 'n-1', type: 'node', lat: 38, lon: -77 }))
            .to.equal('&lt;node id=&quot;-1&quot; lat=&quot;38&quot; lon=&quot;-77&quot; version=&quot;0&quot;/&gt;');
        });

        it('serializes a way to xml', function() {
            expect(iD.format.XML.mapping({ type: 'way', nodes: [], id: 'w-1' }))
            .to.equal('&lt;way id=&quot;-1&quot; version=&quot;0&quot;/&gt;');
        });
    });
});
