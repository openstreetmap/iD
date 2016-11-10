describe('iD.serviceMapillary', function() {
    var dimensions = [64, 64],
        ua = navigator.userAgent,
        isPhantom = (navigator.userAgent.match(/PhantomJS/) !== null),
        uaMock = function () { return ua; },
        context, server, mapillary, orig;


    beforeEach(function() {
        context = iD.Context().assetPath('../dist/');
        context.projection
            .scale(667544.214430109)  // z14
            .translate([-116508, 0])  // 10,0
            .clipExtent([[0,0], dimensions]);

        server = sinon.fakeServer.create();
        mapillary = iD.services.mapillary;
        mapillary.reset();

        /* eslint-disable no-global-assign */
        /* mock userAgent */
        if (isPhantom) {
            orig = navigator;
            navigator = Object.create(orig, { userAgent: { get: uaMock }});
        } else {
            orig = navigator.__lookupGetter__('userAgent');
            navigator.__defineGetter__('userAgent', uaMock);
        }
    });

    afterEach(function() {
        server.restore();

        /* restore userAgent */
        if (isPhantom) {
            navigator = orig;
        } else {
            navigator.__defineGetter__('userAgent', orig);
        }
        /* eslint-enable no-global-assign */
    });


    describe('#init', function() {
        it('Initializes cache one time', function() {
            var cache = mapillary.cache();
            expect(cache).to.have.property('images');
            expect(cache).to.have.property('signs');

            mapillary.init();
            var cache2 = mapillary.cache();
            expect(cache).to.equal(cache2);
        });
    });

    describe('#reset', function() {
        it('resets cache and image', function() {
            mapillary.cache({foo: 'bar'});
            mapillary.selectedImage('baz');

            mapillary.reset();
            expect(mapillary.cache()).to.not.have.property('foo');
            expect(mapillary.selectedImage()).to.be.null;
        });
    });

    describe('#loadImages', function() {
        it('fires loadedImages when images are loaded', function() {
            var spy = sinon.spy();
            mapillary.on('loadedImages', spy);
            mapillary.loadImages(context.projection);

            var match = /search\/im\/geojson/,
                features = [{
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [10,0] },
                    properties: { ca: 90, key: '0' }
                }],
                response = { type: 'FeatureCollection', features: features };

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

            var match = /search\/im\/geojson/,
                features = [{
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0,0] },
                    properties: { ca: 90, key: '0' }
                }],
                response = { type: 'FeatureCollection', features: features };

            server.respondWith('GET', match,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(response) ]);
            server.respond();

            expect(spy).to.have.been.not.called;
        });

        it.skip('loads multiple pages of image results', function() {
            var spy = sinon.spy();
            mapillary.on('loadedImages', spy);
            mapillary.loadImages(context.projection);

            var features0 = [],
                features1 = [],
                i;

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

            var match0 = /page=0/,
                response0 = { type: 'FeatureCollection', features: features0 },
                match1 = /page=1/,
                response1 = { type: 'FeatureCollection', features: features1 };

            server.respondWith('GET', match0,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(response0) ]);
            server.respondWith('GET', match1,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(response1) ]);
            server.respond();

            expect(spy).to.have.been.calledTwice;
        });
    });

    describe('#loadSigns', function() {
       it('loads sign_defs', function() {
            mapillary.loadSigns(context, context.projection);

            var base = 'regulatory--maximum-speed-limit-65--',
                match = /traffico\/string-maps\/(\w+)-map.json/;

            server.respondWith('GET', match, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' },
                    '{ "' + base + id + '": true }');
            });
            server.respond();

            var sign_defs = mapillary.signDefs();

            expect(sign_defs).to.have.property('au')
                .that.is.an('object')
                .that.deep.equals({'regulatory--maximum-speed-limit-65--au': true});
            expect(sign_defs).to.have.property('br')
                .that.is.an('object')
                .that.deep.equals({'regulatory--maximum-speed-limit-65--br': true});
            expect(sign_defs).to.have.property('ca')
                .that.is.an('object')
                .that.deep.equals({'regulatory--maximum-speed-limit-65--ca': true});
            expect(sign_defs).to.have.property('eu')
                .that.is.an('object')
                .that.deep.equals({'regulatory--maximum-speed-limit-65--de': true});
            expect(sign_defs).to.have.property('us')
                .that.is.an('object')
                .that.deep.equals({'regulatory--maximum-speed-limit-65--us': true});
        });

        it('fires loadedSigns when signs are loaded', function() {
            var spy = sinon.spy();
            mapillary.on('loadedSigns', spy);
            mapillary.loadSigns(context, context.projection);

            var match = /search\/im\/geojson\/or/,
                rects = [{
                    'package': 'trafficsign_us_3.0',
                    rect: [ 0.805, 0.463, 0.833, 0.502 ],
                    length: 4,
                    score: '1.27',
                    type: 'regulatory--maximum-speed-limit-65--us'
                }],
                features = [{
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [10,0] },
                    properties: { rects: rects, key: '0' }
                }],
                response = { type: 'FeatureCollection', features: features };

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

            var match = /search\/im\/geojson\/or/,
                rects = [{
                    'package': 'trafficsign_us_3.0',
                    rect: [ 0.805, 0.463, 0.833, 0.502 ],
                    length: 4,
                    score: '1.27',
                    type: 'regulatory--maximum-speed-limit-65--us'
                }],
                features = [{
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0,0] },
                    properties: { rects: rects, key: '0' }
                }],
                response = { type: 'FeatureCollection', features: features };

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
                    'package': 'trafficsign_us_3.0',
                    rect: [ 0.805, 0.463, 0.833, 0.502 ],
                    length: 4,
                    score: '1.27',
                    type: 'regulatory--maximum-speed-limit-65--us'
                }],
                features0 = [],
                features1 = [],
                i;

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

            var match0 = /page=0/,
                response0 = { type: 'FeatureCollection', features: features0 },
                match1 = /page=1/,
                response1 = { type: 'FeatureCollection', features: features1 };

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

        it('limits results no more than 3 stacked images in one spot', function() {
            var features = [
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '2', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '3', loc: [10,0], ca: 90 } },
                { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '4', loc: [10,0], ca: 90 } }
            ];

            mapillary.cache().images.rtree.load(features);
            var res = mapillary.images(context.projection);
            expect(res).to.have.length.of.at.most(3);
        });
    });

    describe('#signs', function() {
        it('returns signs in the visible map area', function() {
            var signs = [{
                    'package': 'trafficsign_us_3.0',
                    rect: [ 0.805, 0.463, 0.833, 0.502 ],
                    length: 4,
                    score: '1.27',
                    type: 'regulatory--maximum-speed-limit-65--us'
                }],
                features = [
                    { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], signs: signs } },
                    { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], signs: signs } },
                    { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { key: '2', loc: [10,1], signs: signs } }
                ];

            mapillary.cache().signs.rtree.load(features);
            var res = mapillary.signs(context.projection);

            expect(res).to.deep.eql([
                { key: '0', loc: [10,0], signs: signs },
                { key: '1', loc: [10,0], signs: signs }
            ]);
        });

        it('limits results no more than 3 stacked signs in one spot', function() {
            var signs = [{
                    'package': 'trafficsign_us_3.0',
                    rect: [ 0.805, 0.463, 0.833, 0.502 ],
                    length: 4,
                    score: '1.27',
                    type: 'regulatory--maximum-speed-limit-65--us'
                }],
                features = [
                    { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '0', loc: [10,0], signs: signs } },
                    { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '1', loc: [10,0], signs: signs } },
                    { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '2', loc: [10,0], signs: signs } },
                    { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '3', loc: [10,0], signs: signs } },
                    { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { key: '4', loc: [10,0], signs: signs } }
                ];

            mapillary.cache().signs.rtree.load(features);
            var res = mapillary.signs(context.projection);
            expect(res).to.have.length.of.at.most(3);
        });
    });

    describe('#signsSupported', function() {
        it('returns false for Internet Explorer', function() {
            ua = 'Trident/7.0; rv:11.0';
            iD.Detect(true);  // force redetection
            expect(mapillary.signsSupported()).to.be.false;
        });

        it('returns false for Safari 9', function() {
            ua = 'Version/9.1 Safari/601';
            iD.Detect(true);  // force redetection
            expect(mapillary.signsSupported()).to.be.false;
        });

        it('returns true for Safari 10', function() {
            ua = 'Version/10.0 Safari/602';
            iD.Detect(true);  // force redetection
            expect(mapillary.signsSupported()).to.be.true;
        });
    });

    describe('#signHTML', function() {
        it('returns sign HTML', function() {
            mapillary.signDefs({
                us: {'regulatory--maximum-speed-limit-65--us': '<span class="t">65</span>'}
            });

            var signdata = {
                    key: '0',
                    loc: [10,0],
                    signs: [{
                        'package': 'trafficsign_us_3.0',
                        rect: [ 0.805, 0.463, 0.833, 0.502 ],
                        length: 4,
                        score: '1.27',
                        type: 'regulatory--maximum-speed-limit-65--us'
                    }]
                };

            expect(mapillary.signHTML(signdata)).to.eql('<span class="t">65</span>');
        });
    });

    describe('#selectedImage', function() {
        it('sets and gets selected image', function() {
            mapillary.selectedImage('foo');
            expect(mapillary.selectedImage()).to.eql('foo');
        });
    });

});
