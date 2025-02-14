describe('LocationManager', () => {
  let locationManager;

  const colorado = {
    type: 'Feature',
    id: 'colorado.geojson',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-107.9197, 41.0039],
          [-102.0539, 41.0039],
          [-102.043, 36.9948],
          [-109.0425, 37.0003],
          [-109.048, 40.9984],
          [-107.9197, 41.0039]
        ]
      ]
    }
  };

  const fc = { type: 'FeatureCollection', features: [colorado] };


  beforeEach(() => {
    // make a new one each time, so we aren't accidentally testing the "global" locationManager
    locationManager = new iD.LocationManager();
  });


  describe('#mergeCustomGeoJSON', () => {
    it('merges geojson into lococation-conflation cache', () => {
      locationManager.mergeCustomGeoJSON(fc);
      expect(locationManager.loco()._cache['colorado.geojson']).to.be.eql(colorado);
    });
  });


  describe('#mergeLocationSets', () => {
    it('returns a promise rejected if not passed an array', done => {
      const prom = locationManager.mergeLocationSets({});
      prom
        .then(() => {
          done(new Error('This was supposed to fail, but somehow succeeded.'));
        })
        .catch(err => {
          expect(/^nothing to do/.test(err)).to.be.true;
          done();
        });

      window.setTimeout(() => {}, 20);  // async - to let the promise settle in phantomjs
    });

    it('resolves locationSets, assigning locationSetID', done => {
      const data = [
        { id: 'world', locationSet: { include: ['001'] } },
        { id: 'usa',   locationSet: { include: ['usa'] } }
      ];

      const prom = locationManager.mergeLocationSets(data);
      prom
        .then(data => {
          expect(data).to.be.a('array');
          expect(data[0].locationSetID).to.eql('+[Q2]');
          expect(data[1].locationSetID).to.eql('+[Q30]');
          done();
        })
        .catch(err => done(err));

      window.setTimeout(() => {}, 20); // async - to let the promise settle in phantomjs
    });

    it('resolves locationSets, falls back to world locationSetID on errror', done => {
      const data = [
        { id: 'bogus1', locationSet: { foo: 'bar' } },
        { id: 'bogus2', locationSet: { include: ['fake.geojson'] } }
      ];

      const prom = locationManager.mergeLocationSets(data);
      prom
        .then(data => {
          expect(data).to.be.a('array');
          expect(data[0].locationSetID).to.eql('+[Q2]');
          expect(data[1].locationSetID).to.eql('+[Q2]');
          done();
        })
        .catch(err => done(err));

      window.setTimeout(() => {}, 20); // async - to let the promise settle in phantomjs
    });
  });


  describe('#locationSetID', () => {
    it('calculates a locationSetID for a locationSet', () => {
      expect(locationManager.locationSetID({ include: ['usa'] })).to.be.eql('+[Q30]');
    });

    it('falls back to the world locationSetID in case of errors', () => {
      expect(locationManager.locationSetID({ foo: 'bar' })).to.be.eql('+[Q2]');
      expect(locationManager.locationSetID({ include: ['fake.geojson'] })).to.be.eql('+[Q2]');
    });
  });


  describe('#feature', () => {
    it('has the world locationSet pre-resolved', () => {
      const result = locationManager.feature('+[Q2]');
      expect(result).to.include({ type: 'Feature', id: '+[Q2]' });
    });

    it('falls back to the world locationSetID in case of errors', () => {
      const result = locationManager.feature('fake');
      expect(result).to.include({ type: 'Feature', id: '+[Q2]' });
    });
  });


  describe('#locationSetsAt', () => {
    it('has the world locationSet pre-resolved', () => {
      const result1 = locationManager.locationSetsAt([-108.557, 39.065]);  // Grand Junction
      expect(result1).to.be.an('object').that.has.all.keys('+[Q2]');
      const result2 = locationManager.locationSetsAt([-74.481, 40.797]);   // Morristown
      expect(result2).to.be.an('object').that.has.all.keys('+[Q2]');
      const result3 = locationManager.locationSetsAt([13.575, 41.207,]);   // Gaeta
      expect(result3).to.be.an('object').that.has.all.keys('+[Q2]');
    });

    it('returns valid locationSets at a given lon,lat', done => {
      // setup, load colorado.geojson and resolve some locationSets
      locationManager.mergeCustomGeoJSON(fc);
      locationManager.mergeLocationSets([
        { id: 'OSM-World', locationSet: { include: ['001'] } },
        { id: 'OSM-USA', locationSet: { include: ['us'] } },
        { id: 'OSM-Colorado', locationSet: { include: ['colorado.geojson'] } }
      ])
        .then(() => {
          const result1 = locationManager.locationSetsAt([-108.557, 39.065]);  // Grand Junction
          expect(result1).to.be.an('object').that.has.all.keys('+[Q2]', '+[Q30]', '+[colorado.geojson]');
          const result2 = locationManager.locationSetsAt([-74.481, 40.797]);   // Morristown
          expect(result2).to.be.an('object').that.has.all.keys('+[Q2]', '+[Q30]');
          const result3 = locationManager.locationSetsAt([13.575, 41.207,]);   // Gaeta
          expect(result3).to.be.an('object').that.has.all.keys('+[Q2]');
          done();
        })
        .catch(err => done(err));

      window.setTimeout(() => {}, 20);  // async - to let the promise settle in phantomjs
    });
  });

});
