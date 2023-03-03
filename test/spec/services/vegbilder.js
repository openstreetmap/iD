describe('iD.serviceVegbilder', function() {
  const dimensions = [64, 64];
  let context, vegbilder;

  before(function() {
    iD.services.vegbilder = iD.serviceVegbilder;
  });

  after(function() {
    delete iD.services.vegbilder;
  });

  beforeEach(async function() {
    context = iD.coreContext().assetPath('../dist/').init();
    context.projection
            .scale(iD.geoZoomToScale(14))
            .translate([-116508, 0])  // 10,0
            .clipExtent([[0,0], dimensions]);

    vegbilder = iD.services.vegbilder;
    await vegbilder.reset();
  });

  afterEach(function() {
    fetchMock.reset();
  });

  describe('#init', function() {
    it('Initializes cache one time', function() {
      const cache = vegbilder.cache();
      expect(cache).to.have.property('wfslayers');
      expect(cache).to.have.property('rtree');
      expect(cache).to.have.property('sequences');

      vegbilder.init();
      const cache2 = vegbilder.cache();
      expect(cache).to.equal(cache2);
    });
  });

  describe('#reset', function() {
    it('resets cache', function() {
      vegbilder.cache().foo = 'bar';
      vegbilder.reset();
      expect(vegbilder.cache()).to.not.have.property('foo');
    });
  });
});
