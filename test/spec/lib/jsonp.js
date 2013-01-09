describe('JSONP', function() {
  it('can request data', function() {
    d3.jsonp('data/foo.jsonp?callback=d3.jsonp.foo', function(d) {
        expect(d).to.eql('foo');
    });
  });
});
