describe('iD.coreLocations', function() {
    var locationManager, loco;

    var colorado = {
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

    var fc = { type: 'FeatureCollection', features: [colorado] };


    beforeEach(function() {
        // make a new one each time, so we aren't accidently testing the "global" locationManager
        locationManager = iD.coreLocations();
        loco = locationManager.loco();
    });


    describe('#mergeCustomGeoJSON', function() {
        it('merges geojson into lococation-conflation cache', function() {
            locationManager.mergeCustomGeoJSON(fc);
            expect(loco._cache['colorado.geojson']).to.be.eql(colorado);
        });
    });


    describe('#mergeLocationSets', function() {
        it('returns a promise rejected if not passed an array', function(done) {
            var prom = locationManager.mergeLocationSets({});
            prom
                .then(function() {
                    throw new Error('This was supposed to fail, but somehow succeeded.');
                })
                .catch(function(err) {
                    expect(/^nothing to do/.test(err)).to.be.true;
                })
                .finally(done);

            window.setTimeout(function() {}, 20);  // async - to let the promise settle in phantomjs
        });

        it('resolves locationSets, assigning locationSetID', function(done) {
            var data = [
                { id: 'world', locationSet: { include: ['001'] } },
                { id: 'usa',   locationSet: { include: ['usa'] } }
            ];
            var prom = locationManager.mergeLocationSets(data);
            prom
                .then(function(data) {
                    expect(data).to.be.a('array');
                    expect(data[0]).locationSetID.to.eql('+[Q2]');
                    expect(data[1]).locationSetID.to.eql('+[Q30]');
                })
                .finally(done);

            window.setTimeout(function() {}, 20); // async - to let the promise settle in phantomjs
        });

        it('resolves locationSets, falls back to world locationSetID on errror', function(done) {
            var data = [
                { id: 'bogus1', locationSet: { foo: 'bar' } },
                { id: 'bogus2', locationSet: { include: ['fake.geojson'] } }
            ];
            var prom = locationManager.mergeLocationSets(data);
            prom
                .then(function(data) {
                    expect(data).to.be.a('array');
                    expect(data[0]).locationSetID.to.eql('+[Q2]');
                    expect(data[1]).locationSetID.to.eql('+[Q2]');
                })
                .finally(done);

            window.setTimeout(function() {}, 20); // async - to let the promise settle in phantomjs
        });
    });


    describe('#locationSetID', function() {
        it('calculates a locationSetID for a locationSet', function() {
            expect(locationManager.locationSetID({ include: ['usa'] })).to.be.eql('+[Q30]');
        });

        it('falls back to the world locationSetID in case of errors', function() {
            expect(locationManager.locationSetID({ foo: 'bar' })).to.be.eql('+[Q2]');
            expect(locationManager.locationSetID({ include: ['fake.geojson'] })).to.be.eql('+[Q2]');
        });
    });


    describe('#feature', function() {
        it('has the world locationSet pre-resolved', function() {
            var result = locationManager.feature('+[Q2]');
            expect(result).to.include({ type: 'Feature', id: '+[Q2]' });
        });

        it('falls back to the world locationSetID in case of errors', function() {
            var result = locationManager.feature('fake');
            expect(result).to.include({ type: 'Feature', id: '+[Q2]' });
        });
    });


    describe('#locationsAt', function() {
        it('has the world locationSet pre-resolved', function() {
            var result1 = locationManager.locationsAt([-108.557, 39.065]);  // Grand Junction
            expect(result1).to.be.an('object').that.has.all.keys('+[Q2]');
            var result2 = locationManager.locationsAt([-74.481, 40.797]);   // Morristown
            expect(result2).to.be.an('object').that.has.all.keys('+[Q2]');
            var result3 = locationManager.locationsAt([13.575, 41.207,]);   // Gaeta
            expect(result3).to.be.an('object').that.has.all.keys('+[Q2]');
        });

        it('returns valid locations at a given lon,lat', function(done) {
            // setup, load colorado.geojson and resolve some locationSets
            locationManager.mergeCustomGeoJSON(fc);
            locationManager.mergeLocationSets([
                { id: 'OSM-World', locationSet: { include: ['001'] } },
                { id: 'OSM-USA', locationSet: { include: ['us'] } },
                { id: 'OSM-Colorado', locationSet: { include: ['colorado.geojson'] } }
            ])
                .then(function() {
                    var result1 = locationManager.locationsAt([-108.557, 39.065]);  // Grand Junction
                    expect(result1).to.be.an('object').that.has.all.keys('+[Q2]', '+[Q30]', '+[colorado.geojson]');
                    var result2 = locationManager.locationsAt([-74.481, 40.797]);   // Morristown
                    expect(result2).to.be.an('object').that.has.all.keys('+[Q2]', '+[Q30]');
                    var result3 = locationManager.locationsAt([13.575, 41.207,]);   // Gaeta
                    expect(result3).to.be.an('object').that.has.all.keys('+[Q2]');
                })
                .finally(done);

            window.setTimeout(function() {}, 20);  // async - to let the promise settle in phantomjs
        });
    });

});
