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

  describe('#loadFromURL', function() {

      it('loads test data', function(done) {
          c.loadFromURL('data/map.xml', done);
      });

      it('returns a graph', function(done) {
          c.loadFromURL('data/map.xml', function(err, graph) {
              expect(err).to.not.be.ok;
              expect(graph).to.be.instanceOf(iD.Graph);
              done();
          });
      });

      it('parses a node', function(done) {
          c.loadFromURL('data/map.xml', function(err, graph) {
              expect(graph.entity('n1193811')).to.be.instanceOf(iD.Entity);
              done();
          });
      });

      it('parses a way', function(done) {
          c.loadFromURL('data/map.xml', function(err, graph) {
              expect(graph.entity('w53471')).to.be.instanceOf(iD.Entity);
              done();
          });
      });

      it('passes errors for 404s', function(done) {
          c.loadFromURL('404', function(err, graph) {
              expect(graph).to.be.a('Error');
              done();
          });
      });

  });
});
