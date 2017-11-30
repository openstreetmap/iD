describe('iD.serviceNominatim', function() {
    var server, nominatim;


    before(function() {
        iD.services.geocoder = iD.serviceNominatim;
    });

    after(function() {
        delete iD.services.geocoder;
    });

    beforeEach(function() {
        server = sinon.fakeServer.create();
        nominatim = iD.services.geocoder;
        nominatim.reset();
    });

    afterEach(function() {
        server.restore();
    });

    function query(url) {
        return iD.utilStringQs(url.substring(url.indexOf('?') + 1));
    }


    describe('#countryCode', function() {
        it('calls the given callback with the results of the country code query', function() {
            var callback = sinon.spy();
            nominatim.countryCode([16, 48], callback);

            server.respondWith('GET', new RegExp('https://nominatim.openstreetmap.org/reverse'),
                [200, { 'Content-Type': 'application/json' },
                    '{"address":{"country_code":"at"}}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {zoom: '13', format: 'json', addressdetails: '1', lat: '48', lon: '16'});
            expect(callback).to.have.been.calledWithExactly(null, 'at');
        });
    });

    describe('#reverse', function() {
        it('should not cache distant result', function() {
            var callback = sinon.spy();
            nominatim.reverse([16, 48], callback);

            server.respondWith('GET', new RegExp('https://nominatim.openstreetmap.org/reverse'),
                [200, { 'Content-Type': 'application/json' },
                    '{"address":{"country_code":"at"}}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {zoom: '13', format: 'json', addressdetails: '1', lat: '48', lon: '16'});
            expect(callback).to.have.been.calledWithExactly(null, {address: {country_code:'at'}});

            server.restore();
            server = sinon.fakeServer.create();

            callback = sinon.spy();
            nominatim.reverse([17, 49], callback);

            server.respondWith('GET', new RegExp('https://nominatim.openstreetmap.org/reverse'),
                [200, { 'Content-Type': 'application/json' },
                    '{"address":{"country_code":"cz"}}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {zoom: '13', format: 'json', addressdetails: '1', lat: '49', lon: '17'});
            expect(callback).to.have.been.calledWithExactly(null, {address: {country_code:'cz'}});
        });

        it('should cache nearby result', function() {
            var callback = sinon.spy();
            nominatim.reverse([16, 48], callback);

            server.respondWith('GET', new RegExp('https://nominatim.openstreetmap.org/reverse'),
                [200, { 'Content-Type': 'application/json' },
                    '{"address":{"country_code":"at"}}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {zoom: '13', format: 'json', addressdetails: '1', lat: '48', lon: '16'});
            expect(callback).to.have.been.calledWithExactly(null, {address: {country_code:'at'}});

            server.restore();
            server = sinon.fakeServer.create();

            callback = sinon.spy();
            nominatim.reverse([16.000001, 48.000001], callback);

            server.respondWith('GET', new RegExp('https://nominatim.openstreetmap.org/reverse'),
                [200, { 'Content-Type': 'application/json' },
                    '{"address":{"country_code":"cz"}}']);
            server.respond();
            expect(callback).to.have.been.calledWithExactly(null, {address: {country_code:'at'}});
        });

        it('calls the given callback with an error', function() {
            var callback = sinon.spy();
            nominatim.reverse([1000, 1000], callback);

            server.respondWith('GET', new RegExp('https://nominatim.openstreetmap.org/reverse'),
                [200, { 'Content-Type': 'application/json' },
                    '{"error":"Unable to geocode"}']);
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {zoom: '13', format: 'json', addressdetails: '1', lat: '1000', lon: '1000'});
            expect(callback).to.have.been.calledWithExactly('Unable to geocode');
        });
    });


    describe('#search', function() {

        it('calls the given callback with the results of the search query', function() {
            var callback = sinon.spy();
            nominatim.search('philadelphia', callback);

            server.respondWith('GET', new RegExp('https://nominatim.openstreetmap.org/search'),
                [200, { 'Content-Type': 'application/json' },
                    '[{"place_id":"158484588","osm_type":"relation","osm_id":"188022","boundingbox":["39.867005","40.1379593","-75.2802976","-74.9558313"],"lat":"39.9523993","lon":"-75.1635898","display_name":"Philadelphia, Philadelphia County, Pennsylvania, United States of America","class":"place","type":"city","importance":0.83238050437778}]'
                ]);
            server.respond();

            expect(query(server.requests[0].url)).to.eql({format: 'json', limit: '10'});
            expect(callback).to.have.been.calledOnce;
        });
    });

});
