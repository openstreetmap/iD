describe('Background', function() {
  var c, d;

  beforeEach(function() {
      d = d3.select(document.createElement('div'));
      c = iD.Background()
        .projection(d3.geo.mercator());
      d.call(c);
  });

  afterEach(function() {
      d.remove();
  });

  describe('iD.Background', function() {
      it('is instantiated', function() {
          expect(c).to.be.ok;
      });

      it('#size', function() {
          expect(c.size([100, 100])).to.equal(c);
          expect(c.size()).to.eql([100,100]);
      });

      it('#source', function() {
          expect(c.source(iD.Background.Bing)).to.equal(c);
          expect(c.source()).to.equal(iD.Background.Bing);
      });
  });

  describe('iD.Background.Bing', function() {
      it('generates tiles', function() {
          expect(iD.Background.Bing([0,0,0])).to.equal('http://ecn.t0.tiles.virtualearth.net/tiles/a.jpeg?g=587&mkt=en-gb&n=z');
      });
  });

});
