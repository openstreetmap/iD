describe('iD.serviceMapillary', function() {
    var dimensions = [64, 64];
    var context, mapillary;


    before(function() {
        iD.services.mapillary = iD.serviceMapillary;
    });

    after(function() {
        delete iD.services.mapillary;
    });

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
        context.projection
            .scale(iD.geoZoomToScale(14))
            .translate([-116508, 0])  // 10,0
            .clipExtent([[0,0], dimensions]);

        mapillary = iD.services.mapillary;
        mapillary.reset();
    });

    afterEach(function() {});


    describe('#init', function() {
        it('Initializes cache one time', function() {
            var cache = mapillary.cache();
            expect(cache).to.have.property('images');
            expect(cache).to.have.property('image_detections');
            expect(cache).to.have.property('points');
            expect(cache).to.have.property('signs');
            expect(cache).to.have.property('sequences');

            mapillary.init();
            var cache2 = mapillary.cache();
            expect(cache).to.equal(cache2);
        });
    });


    describe('#reset', function() {
        it('resets cache and image', function() {
            mapillary.cache().foo = 'bar';
            mapillary.selectImage(context, { key: 'baz', loc: [10,0] });

            mapillary.reset();
            expect(mapillary.cache()).to.not.have.property('foo');
            expect(mapillary.getActiveImage()).to.be.null;
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
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0] } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0] } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: '2', loc: [10,1] } }
            ];

            mapillary.cache().signs.rtree.load(features);
            var res = mapillary.signs(context.projection);

            expect(res).to.deep.eql([
                { key: '0', loc: [10,0] },
                { key: '1', loc: [10,0] }
            ]);
        });

        it('limits results no more than 5 stacked signs in one spot', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0] } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0] } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '2', loc: [10,0] } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '3', loc: [10,0] } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '4', loc: [10,0] } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '5', loc: [10,0] } }
            ];

            mapillary.cache().signs.rtree.load(features);
            var res = mapillary.signs(context.projection);
            expect(res).to.have.length.of.at.most(5);
        });
    });


    describe('#mapFeatures', function() {
        it('returns map features in the visible map area', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0] } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0] } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: '2', loc: [10,1] } }
            ];

            mapillary.cache().points.rtree.load(features);
            var res = mapillary.mapFeatures(context.projection);

            expect(res).to.deep.eql([
                { key: '0', loc: [10,0] },
                { key: '1', loc: [10,0] }
            ]);
        });

        it('limits results no more than 5 stacked map features in one spot', function() {
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

            mapillary.cache().points.rtree.load(features);
            var res = mapillary.mapFeatures(context.projection);
            expect(res).to.have.length.of.at.most(5);
        });
    });


    describe('#sequences', function() {
        it('returns sequence linestrings in the visible map area', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], ca: 90, sequence_id: '-' } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], ca: 90, sequence_id: '-' } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: '2', loc: [10,1], ca: 90, sequence_id: '-' } }
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

            mapillary.cache().sequences.lineString['-'] = [gj];

            var res = mapillary.sequences(context.projection);
            expect(res).to.deep.eql([gj]);
        });
    });


    describe('#setActiveImage', function() {
        it('gets and sets the selected image', function() {
            var node = { id: 'baz', originalLngLat: {lng: 10, lat: 0}};
            mapillary.setActiveImage(node);
            expect(mapillary.getActiveImage().id).to.eql(node.id);
        });
    });


    describe('#filterViewer', function() {
        it('filters images by dates', function() {
            context.photos().setDateFilter('fromDate', '2020-01-01');
            context.photos().setDateFilter('toDate', '2021-01-01');
            var filter = mapillary.filterViewer(context);
            expect(filter.length).to.be.equal(3);
        });
    });
});
