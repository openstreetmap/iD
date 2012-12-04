describe('Util', function() {
  var util;

  it('#id', function() {
      var a = iD.Util.id(),
          b = iD.Util.id(),
          c = iD.Util.id(),
          d = iD.Util.id();
      expect(a === b).to.equal(false);
      expect(b === c).to.equal(false);
      expect(c === d).to.equal(false);
  });

  it('#trueObj', function() {
      expect(iD.Util.trueObj(['a', 'b', 'c'])).to.eql({ a: true, b: true, c: true });
      expect(iD.Util.trueObj([])).to.eql({});
  });

  it('#friendlyName', function() {
      expect(iD.Util.friendlyName({ tags: { name: 'hi' }})).to.equal('hi');
      expect(iD.Util.friendlyName({ tags: { highway: 'Route 5' }})).to.equal('Route 5');
      expect(iD.Util.friendlyName({ tags: { name: 'hi', highway: 'Route 5' }})).to.equal('hi');
  });
});
