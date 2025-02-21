import { setTimeout } from 'node:timers/promises';

describe('iD.serviceNominatim', function() {
    var nominatim;

    before(function() {
        iD.services.geocoder = iD.serviceNominatim;
        fetchMock.reset();
    });

    after(function() {
        delete iD.services.geocoder;
    });

    beforeEach(async function() {
        nominatim = iD.services.geocoder;
        nominatim.reset();
        await iD.localizer.ensureLoaded();
    });

    afterEach(function() {
        fetchMock.reset();
    });

    function parseQueryString(url) {
        return iD.utilStringQs(url.substring(url.indexOf('?')));
    }

    describe('#countryCode', function() {
        it('calls the given callback with the results of the country code query', async () => {
            var callback = sinon.spy();
            fetchMock.mock(new RegExp('https://nominatim.openstreetmap.org/reverse'), {
                body: '{"address":{"country_code":"at"}}',
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

            nominatim.countryCode([16, 48], callback);

            await setTimeout(50);
            expect(parseQueryString(fetchMock.calls()[0][0])).to.eql(
                {zoom: '13', format: 'json', addressdetails: '1', lat: '48', lon: '16'}
            );
            expect(callback).to.have.been.calledWithExactly(null, 'at');
        });
    });

    describe('#reverse', function() {
        it('should not cache distant result', async () => {
            var callback = sinon.spy();
            fetchMock.mock(new RegExp('https://nominatim.openstreetmap.org/reverse'), {
                body: '{"address":{"country_code":"at"}}',
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

            nominatim.reverse([16, 48], callback);

            await setTimeout(50);
            expect(parseQueryString(fetchMock.calls()[0][0])).to.eql(
                {zoom: '13', format: 'json', addressdetails: '1', lat: '48', lon: '16'}
            );
            expect(callback).to.have.been.calledWithExactly(null, {address: {country_code:'at'}});

            fetchMock.reset();
            fetchMock.mock(new RegExp('https://nominatim.openstreetmap.org/reverse'), {
                body: '{"address":{"country_code":"cz"}}',
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

            callback = sinon.spy();
            nominatim.reverse([17, 49], callback);

            await setTimeout(50);
            expect(parseQueryString(fetchMock.calls()[0][0])).to.eql(
                {zoom: '13', format: 'json', addressdetails: '1', lat: '49', lon: '17'}
            );
            expect(fetchMock.calls()[0][1].headers).to.eql({
                'Accept-Language': 'en'
            });
            expect(callback).to.have.been.calledWithExactly(null, {address: {country_code:'cz'}});
        });

        it('should cache nearby result', async () => {
            var callback = sinon.spy();
            fetchMock.mock(new RegExp('https://nominatim.openstreetmap.org/reverse'), {
                body: '{"address":{"country_code":"at"}}',
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

            nominatim.reverse([16, 48], callback);

            await setTimeout(50);
            expect(parseQueryString(fetchMock.calls()[0][0])).to.eql(
                {zoom: '13', format: 'json', addressdetails: '1', lat: '48', lon: '16'}
            );
            expect(callback).to.have.been.calledWithExactly(null, {address: {country_code:'at'}});

            fetchMock.resetHistory();

            callback = sinon.spy();
            nominatim.reverse([16.000001, 48.000001], callback);

            await setTimeout(50);
            expect(callback).to.have.been.calledWithExactly(null, {address: {country_code:'at'}});
        });

        it('calls the given callback with an error', async () => {
            var callback = sinon.spy();
            fetchMock.mock(new RegExp('https://nominatim.openstreetmap.org/reverse'), {
                body: '{"error":"Unable to geocode"}',
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

            nominatim.reverse([1000, 1000], callback);


            await setTimeout(50);
            expect(parseQueryString(fetchMock.calls()[0][0])).to.eql(
                {zoom: '13', format: 'json', addressdetails: '1', lat: '1000', lon: '1000'}
            );
            expect(callback).to.have.been.calledWithExactly('Unable to geocode');
        });
    });


    describe('#search', function() {
        it('calls the given callback with the results of the search query', async () => {
            var callback = sinon.spy();
            fetchMock.mock(new RegExp('https://nominatim.openstreetmap.org/search'), {
                body: '[{"place_id":"158484588","osm_type":"relation","osm_id":"188022","boundingbox":["39.867005","40.1379593","-75.2802976","-74.9558313"],"lat":"39.9523993","lon":"-75.1635898","display_name":"Philadelphia, Philadelphia County, Pennsylvania, United States of America","class":"place","type":"city","importance":0.83238050437778}]',
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

            nominatim.search('philadelphia', callback);

            await setTimeout(50);
            expect(parseQueryString(fetchMock.calls()[0][0])).to.eql({
                q: 'philadelphia',
                format: 'json',
                limit: '10'
            });
            expect(fetchMock.calls()[0][1].headers).to.eql({
                'Accept-Language': 'en'
            });
            expect(callback).to.have.been.calledOnce;
        });
    });

});
