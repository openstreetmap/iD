describe('iD.serviceMapillary', function() {
    var dimensions = [64, 64];
    var context, server, mapillary;


    before(function() {
        iD.services.mapillary = iD.serviceMapillary;
    });

    after(function() {
        delete iD.services.mapillary;
    });

    beforeEach(function() {
        context = iD.Context().assetPath('../dist/');
        context.projection
            .scale(667544.214430109)  // z14
            .translate([-116508, 0])  // 10,0
            .clipExtent([[0,0], dimensions]);

        server = sinon.fakeServer.create();
        mapillary = iD.services.mapillary;
        mapillary.reset();
    });

    afterEach(function() {
        server.restore();
    });


    describe('#init', function() {
        it('Initializes cache one time', function() {
            var cache = mapillary.cache();
            expect(cache).to.have.property('images');
            expect(cache).to.have.property('image_detections');
            expect(cache).to.have.property('map_features');
            expect(cache).to.have.property('sequences');

            mapillary.init();
            var cache2 = mapillary.cache();
            expect(cache).to.equal(cache2);
        });
    });

    describe('#reset', function() {
        it('resets cache and image', function() {
            mapillary.cache().foo = 'bar';
            mapillary.selectImage({ key: 'baz', loc: [10,0] });

            mapillary.reset();
            expect(mapillary.cache()).to.not.have.property('foo');
            expect(mapillary.getSelectedImage()).to.be.null;
        });
    });

    describe('#loadImages', function() {
        it('fires loadedImages when images are loaded', function() {
            var spy = sinon.spy();
            mapillary.on('loadedImages', spy);
            mapillary.loadImages(context.projection);

            var match = /images/;
            var features = [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [10,0] },
                properties: { ca: 90, key: '0' }
            }];
            var response = { type: 'FeatureCollection', features: features };

            server.respondWith('GET', match,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(response) ]);
            server.respond();

            expect(spy).to.have.been.calledOnce;
        });

        it('does not load images around null island', function() {
            var spy = sinon.spy();
            context.projection.translate([0,0]);
            mapillary.on('loadedImages', spy);
            mapillary.loadImages(context.projection);

            var match = /images/;
            var features = [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [0,0] },
                properties: { ca: 90, key: '0' }
            }];
            var response = { type: 'FeatureCollection', features: features };

            server.respondWith('GET', match,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(response) ]);
            server.respond();

            expect(spy).to.have.been.not.called;
        });

        it.skip('loads multiple pages of image results', function() {
            var spy = sinon.spy();
            mapillary.on('loadedImages', spy);
            mapillary.loadImages(context.projection);

            var features0 = [];
            var features1 = [];
            var i;

            for (i = 0; i < 1000; i++) {
                features0.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [10,0] },
                    properties: { ca: 90, key: String(i) }
                });
            }
            for (i = 0; i < 500; i++) {
                features1.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [10,0] },
                    properties: { ca: 90, key: String(1000 + i) }
                });
            }

            var match0 = /page=0/;
            var response0 = { type: 'FeatureCollection', features: features0 };
            var match1 = /page=1/;
            var response1 = { type: 'FeatureCollection', features: features1 };

            server.respondWith('GET', match0,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(response0) ]);
            server.respondWith('GET', match1,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(response1) ]);
            server.respond();

            expect(spy).to.have.been.calledTwice;
        });
    });

    describe('#loadSigns', function() {
        it('fires loadedSigns when signs are loaded', function() {
            var spy = sinon.spy();
            mapillary.on('loadedSigns', spy);
            mapillary.loadSigns(context, context.projection);

            var match = /map_features/;
            var detections = [{
                detection_key: '0',
                image_key: '0'
            }];
            var features = [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [10,0] },
                properties: { detections: detections, key: '0', value: 'not-in-set' }
            }];
            var response = { type: 'FeatureCollection', features: features };

            server.respondWith('GET', match,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(response) ]);
            server.respond();

            expect(spy).to.have.been.calledOnce;
        });

        it('does not load signs around null island', function() {
            var spy = sinon.spy();
            context.projection.translate([0,0]);
            mapillary.on('loadedSigns', spy);
            mapillary.loadSigns(context, context.projection);

            var match = /map_features/;
            var detections = [{
                detection_key: '0',
                image_key: '0'
            }];
            var features = [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [0,0] },
                properties: { detections: detections, key: '0', value: 'not-in-set' }
            }];
            var response = { type: 'FeatureCollection', features: features };

            server.respondWith('GET', match,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(response) ]);
            server.respond();

            expect(spy).to.have.been.not.called;
        });

        it.skip('loads multiple pages of signs results', function() {
            var spy = sinon.spy();
            mapillary.on('loadedSigns', spy);
            mapillary.loadSigns(context, context.projection);

            var rects = [{
                package: 'trafficsign',
                rect: [ 0.805, 0.463, 0.833, 0.502 ],
                length: 4,
                score: '1.27',
                type: 'regulatory--maximum-speed-limit-65--us'
            }];
            var features0 = [];
            var features1 = [];
            var i;

            for (i = 0; i < 1000; i++) {
                features0.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [10,0] },
                    properties: { rects: rects, key: String(i) }
                });
            }
            for (i = 0; i < 500; i++) {
                features1.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [10,0] },
                    properties: { rects: rects, key: String(1000 + i) }
                });
            }

            var match0 = /page=0/;
            var response0 = { type: 'FeatureCollection', features: features0 };
            var match1 = /page=1/;
            var response1 = { type: 'FeatureCollection', features: features1 };

            server.respondWith('GET', match0,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(response0) ]);
            server.respondWith('GET', match1,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(response1) ]);
            server.respond();

            expect(spy).to.have.been.calledTwice;
        });
    });


    describe('#images', function() {
        it('returns images in the visible map area', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: '2', loc: [10,1], ca: 90 } }
            ];

            mapillary.cache().images.rtree.load(features);
            var res = mapillary.images(context.projection);

            expect(res).to.deep.eql([
                { key: '0', loc: [10,0], ca: 90 },
                { key: '1', loc: [10,0], ca: 90 }
            ]);
        });

        it('limits results no more than 5 stacked images in one spot', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '2', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '3', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '4', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '5', loc: [10,0], ca: 90 } }
            ];

            mapillary.cache().images.rtree.load(features);
            var res = mapillary.images(context.projection);
            expect(res).to.have.length.of.at.most(5);
        });
    });

    describe('#signs', function() {
        it('returns signs in the visible map area', function() {
            var detections = [{
                detection_key: '78vqha63gs1upg15s823qckcmn',
                image_key: 'bwYs-uXLDvm_meo_EC5Nzw'
            }];
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], detections: detections } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], detections: detections } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: '2', loc: [10,1], detections: detections } }
            ];

            mapillary.cache().map_features.rtree.load(features);
            var res = mapillary.signs(context.projection);

            expect(res).to.deep.eql([
                { key: '0', loc: [10,0], detections: detections },
                { key: '1', loc: [10,0], detections: detections }
            ]);
        });

        it('limits results no more than 5 stacked signs in one spot', function() {
            var detections = [{
                detection_key: '78vqha63gs1upg15s823qckcmn',
                image_key: 'bwYs-uXLDvm_meo_EC5Nzw'
            }];
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], detections: detections } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], detections: detections } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '2', loc: [10,0], detections: detections } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '3', loc: [10,0], detections: detections } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '4', loc: [10,0], detections: detections } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '5', loc: [10,0], detections: detections } }
            ];

            mapillary.cache().map_features.rtree.load(features);
            var res = mapillary.signs(context.projection);
            expect(res).to.have.length.of.at.most(5);
        });
    });


    describe('#sequences', function() {
        it('returns sequence linestrings in the visible map area', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: '2', loc: [10,1], ca: 90 } }
            ];

            mapillary.cache().images.rtree.load(features);

            var gj = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [[10,0], [10,0], [10,1]],
                    properties: {
                        key: '-',
                        pano: false,
                        coordinateProperties: {
                            cas: [90, 90, 90],
                            image_keys: ['0', '1', '2']
                        }
                    }
                }
            };

            mapillary.cache().sequences.lineString['-'] = gj;
            mapillary.cache().sequences.forImageKey['0'] = '-';
            mapillary.cache().sequences.forImageKey['1'] = '-';
            mapillary.cache().sequences.forImageKey['2'] = '-';

            var res = mapillary.sequences(context.projection);
            expect(res).to.deep.eql([gj]);
        });
    });

    describe('#selectImage', function() {
        it('gets and sets the selected image', function() {
            var d = { key: 'baz', loc: [10,0] };
            mapillary.selectImage(d);
            expect(mapillary.getSelectedImage()).to.eql(d);
        });
    });

    describe('#parsePagination', function() {
        it('gets URL for next page of results from API', function() {
            var linkHeader = '<https://a.mapillary.com/v3/images?per_page=1000>; rel="first", <https://a.mapillary.com/v3/images?per_page=1000&_start_key_time=1476610926080>; rel="next"';
            var pagination = mapillary.parsePagination(linkHeader);
            expect(pagination.first).to.eql('https://a.mapillary.com/v3/images?per_page=1000');
            expect(pagination.next).to.eql('https://a.mapillary.com/v3/images?per_page=1000&_start_key_time=1476610926080');
        });
    });

});
