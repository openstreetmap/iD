describe('Connection', function() {
  var c;

  beforeEach(function() {
      c = new iD.Connection();
  });

  it('is instantiated', function() {
      expect(c).toBeTruthy();
  });

  it('gets/sets url', function() {
      var new_url = 'http://api06.openstreetmap.org';
      expect(c.url(new_url)).toEqual(c);
      expect(c.url()).toEqual(new_url);
  });

  it('gets/sets user', function() {
      var user = { name: 'tom' };
      expect(c.user(user)).toEqual(c);
      expect(c.user()).toEqual(user);
  });

});
