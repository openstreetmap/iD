describe('iD.servicePanoramax', function() {
    var dimensions = [64, 64];
    var context, panoramax;

    before(function() {
        iD.services.panoramax = iD.servicePanoramax;
        fetchMock.reset();
    });

    after(function() {
        delete iD.services.panoramax;
    });

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
        context.projection
            .scale(iD.geoZoomToScale(14))
            .translate([-116508, 0])  // 10,0
            .clipExtent([[0,0], dimensions]);

        panoramax = iD.services.panoramax;
        panoramax.reset();
        fetchMock.reset();

        // never resolve
        fetchMock.mock(/api\.panoramax\.xyz/, new Promise(() => {}));
    });

    afterEach(function() {
        fetchMock.reset();
    });


    describe('#init', function() {
        it('Initializes cache one time', function() {
            var cache = panoramax.cache();
            expect(cache).to.have.property('images');
            expect(cache).to.have.property('sequences');

            panoramax.init();
            var cache2 = panoramax.cache();
            expect(cache).to.equal(cache2);
        });
    });

    describe('#reset', function() {
        it('resets cache and image', function() {
            panoramax.cache().foo = 'bar';
            panoramax.setActiveImage(context, {key: 'baz'});

            panoramax.reset();
            expect(panoramax.cache()).to.not.have.property('foo');
            expect(panoramax.getActiveImage()).to.be.null;
        });
    });

    describe('#images', function() {
        it('returns images in the visible map area', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '0', loc: [10,0], heading: 90, sequence_id: '100', account_id: '0' } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '1', loc: [10,0], heading: 90, sequence_id: '100', account_id: '1' } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { id: '2', loc: [10,1], heading: 90, sequence_id: '100', account_id: '2' } }
            ];

            panoramax.cache().images.rtree.load(features);
            var res = panoramax.images(context.projection);

            expect(res).to.deep.eql([
                { id: '0', loc: [10,0], heading: 90, sequence_id: '100', account_id: '0' },
                { id: '1', loc: [10,0], heading: 90, sequence_id: '100', account_id: '1' }
            ]);
        });

        it('limits results no more than 5 stacked images in one spot', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '0', loc: [10,0], heading: 90, sequence_id: '100', account_id: '0' } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '1', loc: [10,0], heading: 90, sequence_id: '100', account_id: '1' } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '2', loc: [10,0], heading: 90, sequence_id: '100', account_id: '2' } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '3', loc: [10,0], heading: 90, sequence_id: '100', account_id: '3' } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '4', loc: [10,0], heading: 90, sequence_id: '100', account_id: '4' } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '5', loc: [10,0], heading: 90, sequence_id: '100', account_id: '5' } }
            ];

            panoramax.cache().images.rtree.load(features);
            var res = panoramax.images(context.projection);
            expect(res).to.have.length.of.at.most(5);
        });
    });


    describe('#sequences', function() {
        it('returns sequence linestrings in the visible map area', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '0', loc: [10,0], heading: 90, sequence_id: '100', account_id: '0' } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '1', loc: [10,0], heading: 90, sequence_id: '100', account_id: '1' } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { id: '2', loc: [10,1], heading: 90, sequence_id: '100', account_id: '2' } }
            ];

            panoramax.cache().images.rtree.load(features);
            panoramax.cache().sequences.lineString['100'] = { rotation: 0, images: [ features[0].data, features[1].data, features[2].data ] };

            var res = panoramax.sequences(context.projection, 15);
            expect(res).to.deep.eql([{
                rotation: 0, images: [features[0].data, features[1].data, features[2].data]
            }]);
        });
    });

    describe('#selectedImage', function() {
        it('sets and gets selected image', function() {
            var d = { id: 'foo', sequence_id: '100'};
            panoramax.cache().images = { forImageId: { foo: d }};
            panoramax.selectImage(context, 'foo');
            expect(panoramax.getActiveImage()).to.eql(d);
        });
    });

});
