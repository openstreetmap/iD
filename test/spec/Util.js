describe('Util', function() {
  var util;

  it('#id', function() {
      var a = iD.Util.id(),
          b = iD.Util.id(),
          c = iD.Util.id(),
          d = iD.Util.id();
      expect(a === b).toEqual(false);
      expect(b === c).toEqual(false);
      expect(c === d).toEqual(false);
  });

  it('#trueObj', function() {
      expect(iD.Util.trueObj(['a', 'b', 'c'])).toEqual({ a: true, b: true, c: true });
      expect(iD.Util.trueObj([])).toEqual({});
  });

  it('#friendlyName', function() {
      expect(iD.Util.friendlyName({ tags: { name: 'hi' }})).toEqual('hi');
      expect(iD.Util.friendlyName({ tags: { highway: 'Route 5' }})).toEqual('Route 5');
      expect(iD.Util.friendlyName({ tags: { name: 'hi', highway: 'Route 5' }})).toEqual('hi');
  });
});
