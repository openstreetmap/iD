describe('iD.serviceOpenstreetcam', function() {
    var dimensions = [64, 64],
        context, server, openstreetcam;

    before(function() {
        iD.services.openstreetcam = iD.serviceOpenstreetcam;
    });

    after(function() {
        delete iD.services.openstreetcam;
    });

    beforeEach(function() {
        context = iD.Context().assetPath('../dist/');
        context.projection
            .scale(667544.214430109)  // z14
            .translate([-116508, 0])  // 10,0
            .clipExtent([[0,0], dimensions]);

        server = sinon.fakeServer.create();
        openstreetcam = iD.services.openstreetcam;
        openstreetcam.reset();
    });

    afterEach(function() {
        server.restore();
    });


    describe('#init', function() {
        it('Initializes cache one time', function() {
            var cache = openstreetcam.cache();
            expect(cache).to.have.property('images');
            expect(cache).to.have.property('sequences');

            openstreetcam.init();
            var cache2 = openstreetcam.cache();
            expect(cache).to.equal(cache2);
        });
    });

    describe('#reset', function() {
        it('resets cache and image', function() {
            openstreetcam.cache().foo = 'bar';
            openstreetcam.selectImage({key: 'baz'});

            openstreetcam.reset();
            expect(openstreetcam.cache()).to.not.have.property('foo');
            expect(openstreetcam.getSelectedImage()).to.be.null;
        });
    });

    describe('#loadImages', function() {
        it('fires loadedImages when images are loaded', function() {
            var spy = sinon.spy();
            openstreetcam.on('loadedImages', spy);
            openstreetcam.loadImages(context.projection);

            var data = {
                status: { apiCode: '600', httpCode: 200, httpMessage: 'Success' },
                currentPageItems:[{
                    id: '1',
                    sequence_id: '100',
                    sequence_index: '1',
                    lat: '0',
                    lng: '10.001',
                    name: 'storage6\/files\/photo\/foo1.jpg',
                    lth_name: 'storage6\/files\/photo\/lth\/foo1.jpg',
                    th_name: 'storage6\/files\/photo\/th\/foo1.jpg',
                    shot_date: '2017-09-24 23:58:07',
                    heading: '90',
                    username: 'test'
                }, {
                    id: '2',
                    sequence_id: '100',
                    sequence_index: '2',
                    lat: '0',
                    lng: '10.002',
                    name: 'storage6\/files\/photo\/foo2.jpg',
                    lth_name: 'storage6\/files\/photo\/lth\/foo2.jpg',
                    th_name: 'storage6\/files\/photo\/th\/foo2.jpg',
                    shot_date: '2017-09-24 23:58:07',
                    heading: '90',
                    username: 'test'
                }, {
                    id: '3',
                    sequence_id: '100',
                    sequence_index: '3',
                    lat: '0',
                    lng: '10.003',
                    name: 'storage6\/files\/photo\/foo3.jpg',
                    lth_name: 'storage6\/files\/photo\/lth\/foo3.jpg',
                    th_name: 'storage6\/files\/photo\/th\/foo3.jpg',
                    shot_date: '2017-09-24 23:58:07',
                    heading: '90',
                    username: 'test'
                }],
                totalFilteredItems: ['3']
            };

            server.respondWith('POST', /nearby-photos/,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(data) ]);
            server.respond();

            expect(spy).to.have.been.calledOnce;
        });

        it('does not load images around null island', function() {
            var spy = sinon.spy();
            context.projection.translate([0,0]);
            openstreetcam.on('loadedImages', spy);
            openstreetcam.loadImages(context.projection);

            var data = {
                status: { apiCode: '600', httpCode: 200, httpMessage: 'Success' },
                currentPageItems:[{
                    id: '1',
                    sequence_id: '100',
                    sequence_index: '1',
                    lat: '0',
                    lng: '0',
                    name: 'storage6\/files\/photo\/foo1.jpg',
                    lth_name: 'storage6\/files\/photo\/lth\/foo1.jpg',
                    th_name: 'storage6\/files\/photo\/th\/foo1.jpg',
                    shot_date: '2017-09-24 23:58:07',
                    heading: '90',
                    username: 'test'
                }, {
                    id: '2',
                    sequence_id: '100',
                    sequence_index: '2',
                    lat: '0',
                    lng: '0',
                    name: 'storage6\/files\/photo\/foo2.jpg',
                    lth_name: 'storage6\/files\/photo\/lth\/foo2.jpg',
                    th_name: 'storage6\/files\/photo\/th\/foo2.jpg',
                    shot_date: '2017-09-24 23:58:07',
                    heading: '90',
                    username: 'test'
                }, {
                    id: '3',
                    sequence_id: '100',
                    sequence_index: '3',
                    lat: '0',
                    lng: '0',
                    name: 'storage6\/files\/photo\/foo3.jpg',
                    lth_name: 'storage6\/files\/photo\/lth\/foo3.jpg',
                    th_name: 'storage6\/files\/photo\/th\/foo3.jpg',
                    shot_date: '2017-09-24 23:58:07',
                    heading: '90',
                    username: 'test'
                }],
                totalFilteredItems: ['3']
            };

            server.respondWith('POST', /nearby-photos/,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(data) ]);
            server.respond();

            expect(spy).to.have.been.not.called;
        });

        it.skip('loads multiple pages of image results', function() {
            var spy = sinon.spy();
            openstreetcam.on('loadedImages', spy);
            openstreetcam.loadImages(context.projection);

            var features0 = [],
                features1 = [],
                i;

            for (i = 0; i < 1000; i++) {
                features0.push({
                    id: String(i),
                    sequence_id: '100',
                    sequence_index: String(i),
                    lat: '10',
                    lng: '0',
                    name: 'storage6\/files\/photo\/foo' + String(i) +'.jpg',
                    lth_name: 'storage6\/files\/photo\/lth\/foo' + String(i) +'.jpg',
                    th_name: 'storage6\/files\/photo\/th\/foo' + String(i) +'.jpg',
                    shot_date: '2017-09-24 23:58:07',
                    heading: '90',
                    username: 'test'
                });
            }
            for (i = 0; i < 500; i++) {
                features1.push({
                    id: String(i),
                    sequence_id: '100',
                    sequence_index: String(1000 + i),
                    lat: '10',
                    lng: '0',
                    name: 'storage6\/files\/photo\/foo' + String(1000 + i) +'.jpg',
                    lth_name: 'storage6\/files\/photo\/lth\/foo' + String(1000 + i) +'.jpg',
                    th_name: 'storage6\/files\/photo\/th\/foo' + String(1000 + i) +'.jpg',
                    shot_date: '2017-09-24 23:58:07',
                    heading: '90',
                    username: 'test'
                });
            }

            var response0 = {
                    status: { apiCode: '600', httpCode: 200, httpMessage: 'Success' },
                    currentPageItems: [features0],
                    totalFilteredItems: ['1000']
                },
                response1 = {
                    status: { apiCode: '600', httpCode: 200, httpMessage: 'Success' },
                    currentPageItems: [features1],
                    totalFilteredItems: ['500']
                };

            server.respondWith('POST', /nearby-photos/, function (request) {
                var response;
                if (request.requestBody.match(/page=1/) !== null) {
                    response = JSON.stringify(response0);
                } else if (request.requestBody.match(/page=2/) !== null) {
                    response = JSON.stringify(response1);
                }
                request.respond(200, {'Content-Type': 'application/json'}, response);
            });
            server.respond();

            expect(spy).to.have.been.calledTwice;
        });
    });


    describe('#images', function() {
        it('returns images in the visible map area', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 0 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 1 } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: '2', loc: [10,1], ca: 90, sequence_id: '100', sequence_index: 2 } }
            ];

            openstreetcam.cache().images.rtree.load(features);
            var res = openstreetcam.images(context.projection);

            expect(res).to.deep.eql([
                { key: '0', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 0 },
                { key: '1', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 1 }
            ]);
        });

        it('limits results no more than 5 stacked images in one spot', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 0 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 1 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '2', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 2 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '3', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 3 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '4', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 4 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '5', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 5 } }
            ];

            openstreetcam.cache().images.rtree.load(features);
            var res = openstreetcam.images(context.projection);
            expect(res).to.have.length.of.at.most(5);
        });
    });


    describe('#sequences', function() {
        it('returns sequence linestrings in the visible map area', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 0 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 1 } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: '2', loc: [10,1], ca: 90, sequence_id: '100', sequence_index: 2 } }
            ];

            openstreetcam.cache().images.rtree.load(features);
            openstreetcam.cache().sequences['100'] = { rotation: 0, images: [ features[0].data, features[1].data, features[2].data ] };

            var res = openstreetcam.sequences(context.projection);
            expect(res).to.deep.eql([{
                type: 'LineString',
                coordinates: [[10,0], [10,0], [10,1]],
                properties: { key: '100' }
            }]);
        });
    });

    describe('#selectedImage', function() {
        it('sets and gets selected image', function() {
            openstreetcam.selectImage('foo');
            expect(openstreetcam.getSelectedImage()).to.eql('foo');
        });
    });

});
