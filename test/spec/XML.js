describe('XML', function() {

  describe('#rep', function() {
      it('should be able to map a node to jxon', function() {
          expect(iD.format.XML.rep({ id: 'n-1', type: 'node', lat: 38, lon: -77 }))
              .toEqual({ node : { '@id': '-1', '@lat': 38, '@lon': -77, '@version': 0, tag: [ ] } });
      });
  });

  describe('#mapping', function() {
      it('should be able to map a node to xml', function() {
          expect(iD.format.XML.mapping({ id: 'n-1', type: 'node', lat: 38, lon: -77 }))
          .toEqual('&lt;node id=&quot;-1&quot; lat=&quot;38&quot; lon=&quot;-77&quot; version=&quot;0&quot;/&gt;');
      });
      it('should be able to map a way to xml', function() {
          var way = { type: 'way', nodes: [], id: 'w-1' };
          var gj = iD.format.XML.mapping(way);
          expect(gj).toEqual('&lt;way id=&quot;-1&quot;/&gt;');
      });
  });
});
