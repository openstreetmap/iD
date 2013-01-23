describe('iD.Connection', function() {
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
          c.loadFromURL('data/node.xml', done);
      });

      it('returns a graph', function(done) {
          c.loadFromURL('data/node.xml', function(err, graph) {
              expect(err).to.not.be.ok;
              expect(graph).to.be.instanceOf(iD.Graph);
              done();
          });
      });

      it('parses a node', function(done) {
          c.loadFromURL('data/node.xml', function(err, graph) {
              expect(graph.entity('n356552551')).to.be.instanceOf(iD.Entity);
              done();
          });
      });

      it('parses a way', function(done) {
          c.loadFromURL('data/way.xml', function(err, graph) {
              expect(graph.entity('w19698713')).to.be.instanceOf(iD.Entity);
              done();
          });
      });

  });
});
