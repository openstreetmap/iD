describe.only('iD.services.imageryOffset', function() {
    var server, imageryOffset;

    beforeEach(function() {
        server = sinon.fakeServer.create();
        imageryOffset = iD.services.imageryOffset;
        imageryOffset.reset();
    });

    afterEach(function() {
        server.restore();
    });

    function query(url) {
        return iD.utilStringQs(url.substring(url.indexOf('?') + 1));
    }

    describe('#search', function() {
        var serverResponse =
            '[{"type":"meta","timestamp":"2017-07-24T09:19:35+0300"},{"type":"offset","id":"15026","lat":"53.8119907","lon":"-1.6134077","author":"Arthtoach","description":"Victoria Park Avenue / Lancastre Grove Junction and Buildings","date":"2017-05-09","min-zoom":"0","max-zoom":"30","imagery":"a.tiles.mapbox.com/v4/digitalglobe.n6ngnadl","imlat":"53.8120239","imlon":"-1.6133688"}]';
        var emptyResponse =
            '[{"type":"meta","timestamp":"2017-07-24T09:19:35+0300"}]';
        it('should cache results', function() {
            var callback = sinon.spy();
            imageryOffset.search([-1.619, 53.8129], callback);

            server.respondWith(
                'GET',
                new RegExp('http://offsets.textual.ru/get'),
                [200, { 'Content-Type': 'application/json' }, serverResponse]
            );
            server.respond();

            expect(query(server.requests[0].url)).to.eql({
                radius: '10',
                format: 'json',
                lat: '53.8129',
                lon: '-1.619'
            });
            expect(callback).to.have.been.calledWithExactly(
                null,
                JSON.parse(serverResponse).slice(1)
            );

            server.restore();
            server = sinon.fakeServer.create();

            callback = sinon.spy();
            imageryOffset.search([-1.609, 53.8149], callback);

            server.respondWith(
                'GET',
                new RegExp('http://offsets.textual.ru/get'),
                [200, { 'Content-Type': 'application/json' }, emptyResponse]
            );
            server.respond();

            expect(callback).to.have.been.calledWithExactly(
                null,
                JSON.parse(serverResponse).slice(1)
            );
        });

        it('should make network request if cache miss', function() {
            var callback = sinon.spy();
            imageryOffset.search([-1.619, 53.8129], callback);

            server.respondWith(
                'GET',
                new RegExp('http://offsets.textual.ru/get'),
                [200, { 'Content-Type': 'application/json' }, serverResponse]
            );
            server.respond();

            expect(query(server.requests[0].url)).to.eql({
                radius: '10',
                format: 'json',
                lat: '53.8129',
                lon: '-1.619'
            });
            expect(callback).to.have.been.calledWithExactly(
                null,
                JSON.parse(serverResponse).slice(1)
            );

            server.restore();
            server = sinon.fakeServer.create();

            callback = sinon.spy();
            imageryOffset.search([-2.237, 57.1152], callback);

            var newReponse =
                '[{"type":"meta","timestamp":"2017-07-24T10:45:56+0300"},{"type":"offset","id":"12582","lat":"57.1470244","lon":"-2.097151","author":"neiljp","description":"Aberdeen","date":"2016-03-19","min-zoom":"0","max-zoom":"30","imagery":"geo.nls.uk/maps/towns/aberdeen","imlat":"57.147044","imlon":"-2.0971537"}]';

            server.respondWith(
                'GET',
                new RegExp('http://offsets.textual.ru/get'),
                [200, { 'Content-Type': 'application/json' }, newReponse]
            );
            server.respond();

            expect(callback).to.have.been.calledWithExactly(
                null,
                JSON.parse(newReponse).slice(1)
            );
        });

        it('Error if empty responce', function() {
            var callback = sinon.spy();
            imageryOffset.search([-1.619, 53.8129], callback);

            server.respondWith(
                'GET',
                new RegExp('http://offsets.textual.ru/get'),
                [200, { 'Content-Type': 'application/json' }, emptyResponse]
            );
            server.respond();

            expect(query(server.requests[0].url)).to.eql({
                radius: '10',
                format: 'json',
                lat: '53.8129',
                lon: '-1.619'
            });
            expect(callback).to.have.been.calledWithExactly(
                'No imagery offset found.'
            );
        });
    });
});
