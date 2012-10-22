describe('Util', function() {
  var util;

  it('gives unique ids', function() {
      var a = iD.Util.id(),
          b = iD.Util.id(),
          c = iD.Util.id(),
          d = iD.Util.id();
      expect(a === b).toEqual(false);
      expect(b === c).toEqual(false);
      expect(c === d).toEqual(false);
  });

  it('generates tile keys', function() {
      expect(iD.Util.tileKey({ z: 0, x: 0, y: 0 })).toEqual('0,0,0');
      expect(iD.Util.tileKey({ z: 1, x: 1, y: 1 })).toEqual('1,1,1');
  });
});
