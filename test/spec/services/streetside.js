describe('iD.serviceStreetside', function() {
    var dimensions = [64, 64];
    var context, server, streetside;

    before(function() {
        iD.services.streetside = iD.serviceStreetside;
    });

    after(function() {
        delete iD.services.streetside;
    });

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
        context.projection
            .scale(iD.geoZoomToScale(14))
            .translate([-116508, 0])  // 10,0
            .clipExtent([[0,0], dimensions]);

        server = window.fakeFetch().create();
        streetside = iD.services.streetside;
        streetside.reset();
    });

    afterEach(function() {
        window.JSONP_FIX = undefined;
        server.restore();
    });


    describe('#init', function() {
        it('Initializes cache one time', function() {
            var cache = streetside.cache();
            expect(cache).to.have.property('bubbles');
            expect(cache).to.have.property('sequences');

            streetside.init();
            var cache2 = streetside.cache();
            expect(cache).to.equal(cache2);
        });
    });

    describe('#reset', function() {
        it('resets cache', function() {
            streetside.cache().foo = 'bar';
            streetside.reset();
            expect(streetside.cache()).to.not.have.property('foo');
        });
    });

    describe('#loadBubbles', function() {
        it('fires loadedBubbles when bubbles are loaded', function(done) {
            // adjust projection so that only one tile is fetched
            // (JSONP hack will return the same data for every fetch)
            context.projection
                .scale(iD.geoZoomToScale(18))
                .translate([-1863988.9381333336, 762.8270222954452])  // 10.002,0.002
                .clipExtent([[0,0], dimensions]);

            var spy = sinon.spy();
            streetside.on('loadedBubbles', spy);

            window.JSONP_DELAY = 0;
            window.JSONP_FIX = [{
                    elapsed: 0.001
                }, {
                    id: 1, la: 0, lo: 10.001, al: 0, ro: 0, pi: 0, he: 0, bl: '',
                    cd: '1/1/2018 12:00:00 PM', ml: 3, nbn: [], pbn: [], rn: [],
                    pr: undefined, ne: 2
                }, {
                    id: 2, la: 0, lo: 10.002, al: 0, ro: 0, pi: 0, he: 0, bl: '',
                    cd: '1/1/2018 12:00:01 PM', ml: 3, nbn: [], pbn: [], rn: [],
                    pr: 1, ne: 3
                }, {
                    id: 3, la: 0, lo: 10.003, al: 0, ro: 0, pi: 0, he: 0, bl: '',
                    cd: '1/1/2018 12:00:02 PM', ml: 3, nbn: [], pbn: [], rn: [],
                    pr: 2, ne: undefined
                }
            ];

            streetside.loadBubbles(context.projection, 0);  // 0 = don't fetch margin tiles

            window.setTimeout(function() {
                expect(spy).to.have.been.calledOnce;
                done();
            }, 200);
        });

        it('does not load bubbles around null island', function(done) {
            context.projection
                .scale(iD.geoZoomToScale(18))
                .translate([0, 0])
                .clipExtent([[0,0], dimensions]);

            var spy = sinon.spy();
            streetside.on('loadedBubbles', spy);

            window.JSONP_DELAY = 0;
            window.JSONP_FIX = [{
                    elapsed: 0.001
                }, {
                    id: 1, la: 0, lo: 0, al: 0, ro: 0, pi: 0, he: 0, bl: '',
                    cd: '1/1/2018 12:00:00 PM', ml: 3, nbn: [], pbn: [], rn: [],
                    pr: undefined, ne: 2
                }, {
                    id: 2, la: 0, lo: 0, al: 0, ro: 0, pi: 0, he: 0, bl: '',
                    cd: '1/1/2018 12:00:01 PM', ml: 3, nbn: [], pbn: [], rn: [],
                    pr: 1, ne: 3
                }, {
                    id: 3, la: 0, lo: 0, al: 0, ro: 0, pi: 0, he: 0, bl: '',
                    cd: '1/1/2018 12:00:02 PM', ml: 3, nbn: [], pbn: [], rn: [],
                    pr: 2, ne: undefined
                }
            ];

            streetside.loadBubbles(context.projection, 0);  // 0 = don't fetch margin tiles

            window.setTimeout(function() {
                expect(spy).to.have.been.not.called;
                done();
            }, 200);
        });
    });


    describe('#bubbles', function() {
        it('returns bubbles in the visible map area', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: 1, loc: [10, 0], ca: 90, pr: undefined, ne: 2, pano: true, sequenceKey: 1 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: 2, loc: [10, 0], ca: 90, pr: 1, ne: 3, pano: true, sequenceKey: 1 } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: 3, loc: [10, 1], ca: 90, pr: 2, ne: undefined, pano: true, sequenceKey: 1 } }
            ];

            streetside.cache().bubbles.rtree.load(features);
            var res = streetside.bubbles(context.projection);

            expect(res).to.deep.eql([
                { key: 1, loc: [10, 0], ca: 90, pr: undefined, ne: 2, pano: true, sequenceKey: 1 },
                { key: 2, loc: [10, 0], ca: 90, pr: 1, ne: 3, pano: true, sequenceKey: 1 }
            ]);
        });

        it('limits results no more than 5 stacked bubbles in one spot', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: 1, loc: [10, 0], ca: 90, pr: undefined, ne: 2, pano: true, sequence_id: 1 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: 2, loc: [10, 0], ca: 90, pr: 1, ne: 3, pano: true, sequence_id: 1 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: 3, loc: [10, 0], ca: 90, pr: 2, ne: 4, pano: true, sequence_id: 1 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: 4, loc: [10, 0], ca: 90, pr: 3, ne: 5, pano: true, sequence_id: 1 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: 5, loc: [10, 0], ca: 90, pr: 4, ne: 6, pano: true, sequence_id: 1 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: 6, loc: [10, 0], ca: 90, pr: 5, ne: undefined, pano: true, sequence_id: 1 } }
            ];

            streetside.cache().bubbles.rtree.load(features);
            var res = streetside.bubbles(context.projection);
            expect(res).to.have.length.of.at.most(5);
        });
    });


    describe('#sequences', function() {
        it('returns sequence linestrings in the visible map area', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: 1, loc: [10, 0], ca: 90, pr: undefined, ne: 2, pano: true, sequenceKey: 1 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: 2, loc: [10, 0], ca: 90, pr: 1, ne: 3, pano: true, sequenceKey: 1 } },
                { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: 3, loc: [10, 1], ca: 90, pr: 2, ne: undefined, pano: true, sequenceKey: 1 } }
            ];

            streetside.cache().bubbles.rtree.load(features);

            var seq = {
                key: 1,
                bubbles: features.map(function(f) { return f.data; }),
                geojson: {
                    type: 'LineString',
                    properties: { key: 1 },
                    coordinates: features.map(function(f) { return f.data.loc; }),
                }
            };

            streetside.cache().sequences[1] = seq;

            var res = streetside.sequences(context.projection);
            expect(res).to.deep.eql([seq.geojson]);
        });
    });

});
