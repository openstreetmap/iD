describe('iD.serviceKartaview', function() {
    var dimensions = [64, 64];
    var context, kartaview;

    before(function() {
        iD.services.kartaview = iD.serviceKartaview;
        fetchMock.reset();
    });

    after(function() {
        delete iD.services.kartaview;
    });

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
        context.projection
            .scale(iD.geoZoomToScale(14))
            .translate([-116508, 0])  // 10,0
            .clipExtent([[0,0], dimensions]);

        kartaview = iD.services.kartaview;
        kartaview.reset();
        fetchMock.reset();
    });

    afterEach(function() {
        fetchMock.reset();
    });


    describe('#init', function() {
        it('Initializes cache one time', function() {
            var cache = kartaview.cache();
            expect(cache).to.have.property('images');
            expect(cache).to.have.property('sequences');

            kartaview.init();
            var cache2 = kartaview.cache();
            expect(cache).to.equal(cache2);
        });
    });

    describe('#reset', function() {
        it('resets cache and image', function() {
            kartaview.cache().foo = 'bar';
            kartaview.selectImage(context, {key: 'baz'});

            kartaview.reset();
            expect(kartaview.cache()).to.not.have.property('foo');
            expect(kartaview.getSelectedImage()).to.be.null;
        });
    });

    describe('#loadImages', function() {
        it('fires loadedImages when images are loaded', function(done) {
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

            fetchMock.mock(new RegExp('/nearby-photos/'), {
                body: JSON.stringify(data),
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

            kartaview.on('loadedImages', function() {
                expect(fetchMock.calls().length).to.eql(1);  // 1 nearby-photos
                done();
            });

            kartaview.loadImages(context.projection);
        });

        it('does not load images around null island', function (done) {
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

            var spy = sinon.spy();
            fetchMock.mock(new RegExp('/nearby-photos/'), {
                body: JSON.stringify(data),
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

            context.projection.translate([0, 0]);

            kartaview.on('loadedImages', spy);
            kartaview.loadImages(context.projection);

            window.setTimeout(function() {
                expect(spy).to.have.been.not.called;
                expect(fetchMock.calls().length).to.eql(0);   // no tile requests of any kind
                done();
            }, 200);
        });

        it('loads multiple pages of image results', function(done) {
            var features = [];
            for (var i = 0; i < 1000; i++) {
                var key = String(i);
                features.push({
                    id: key,
                    sequence_id: '100',
                    sequence_index: key,
                    lat: '10',
                    lng: '0',
                    name: 'storage6\/files\/photo\/foo' + key + '.jpg',
                    lth_name: 'storage6\/files\/photo\/lth\/foo' + key + '.jpg',
                    th_name: 'storage6\/files\/photo\/th\/foo' + key + '.jpg',
                    shot_date: '2017-09-24 23:58:07',
                    heading: '90',
                    username: 'test'
                });
            }

            var response = {
                status: { apiCode: '600', httpCode: 200, httpMessage: 'Success' },
                currentPageItems: features,
                totalFilteredItems: ['1000']
            };

            fetchMock.mock(new RegExp('/nearby-photos/'), {
                body: JSON.stringify(response),
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

            kartaview.on('loadedImages', function() {
                expect(fetchMock.calls().length).to.eql(2);   // 2 nearby-photos
                done();
            });

            kartaview.loadImages(context.projection);
        });
    });


    describe('#images', function() {
        it('returns images in the visible map area', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 0 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], ca: 90, sequence_id: '100', sequence_index: 1 } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: '2', loc: [10,1], ca: 90, sequence_id: '100', sequence_index: 2 } }
            ];

            kartaview.cache().images.rtree.load(features);
            var res = kartaview.images(context.projection);

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

            kartaview.cache().images.rtree.load(features);
            var res = kartaview.images(context.projection);
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

            kartaview.cache().images.rtree.load(features);
            kartaview.cache().sequences['100'] = { rotation: 0, images: [ features[0].data, features[1].data, features[2].data ] };

            var res = kartaview.sequences(context.projection);
            expect(res).to.deep.eql([{
                type: 'LineString',
                coordinates: [[10,0], [10,0], [10,1]],
                properties: {
                    captured_at: undefined,
                    captured_by: undefined,
                    key: '100'
                }
            }]);
        });
    });

    describe('#selectedImage', function() {
        it('sets and gets selected image', function() {
            var d = { key: 'foo' };
            kartaview.cache().images = { forImageKey: { foo: d }};
            kartaview.selectImage(context, 'foo');
            expect(kartaview.getSelectedImage()).to.eql(d);
        });
    });

});
