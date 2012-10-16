describe('Relation Member', function() {
  var rm;

  beforeEach(function() {
      rm = new iD.RelationMember();
  });

  it('is instantiated', function() {
      expect(rm).toBeTruthy();
  });
});
