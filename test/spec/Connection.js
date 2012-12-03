describe('Connection', function() {
  var c;

  beforeEach(function() {
      c = new iD.Connection();
  });

  it('is instantiated', function() {
      expect(c).to.be.ok;
  });

  it('gets/sets url', function() {
      var new_url = 'http://api06.openstreetmap.org';
      expect(c.url(new_url)).to.equal(c);
      expect(c.url()).to.equal(new_url);
  });

  it('gets/sets user', function() {
      var user = { name: 'tom' };
      expect(c.user(user)).to.equal(c);
      expect(c.user()).to.equal(user);
  });

});
