describe('Relation', function() {
  var rm;

  beforeEach(function() {
      rm = new iD.Relation();
  });

  it('is instantiated', function() {
      expect(rm).toBeTruthy();
  });
});
