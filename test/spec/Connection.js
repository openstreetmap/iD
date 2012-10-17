describe('Connection', function() {
  var c;

  beforeEach(function() {
      c = new iD.Connection();
  });

  it('is instantiated', function() {
      expect(c).toBeTruthy();
  });
});
