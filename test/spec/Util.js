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
});
