describe('iD.services.mapillary', function() {
    var dimensions = [64, 64],
        context, server, mapillary;

    beforeEach(function() {
        context = iD().assetPath('../dist/');
        context.projection.scale(667544.214430109);  // z14

        server = sinon.fakeServer.create();
        mapillary = iD.services.mapillary();
        mapillary.reset();
    });

    afterEach(function() {
        server.restore();
    });


    describe('Mapillary service', function() {
        it('Initializes cache one time', function() {
            var cache = iD.services.mapillary.cache;
            expect(cache).to.have.property('images');
            expect(cache).to.have.property('signs');

            var mapillary2 = iD.services.mapillary();
            var cache2 = iD.services.mapillary.cache;
            expect(cache).to.equal(cache2);
        });
    });

    describe('#loadImages', function() {
       it('fires loadedImages when images are loaded', function() {
            var spy = sinon.spy();
            mapillary.on('loadedImages', spy);
            mapillary.loadImages(context.projection, dimensions);

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

            expect(spy).to.have.been.calledOnce;
        });

        it('loads multiple pages of image results', function() {
            var spy = sinon.spy();
            mapillary.on('loadedImages', spy);
            mapillary.loadImages(context.projection, dimensions);

            var features0 = [],
                features1 = [],
                i;

            for (i = 0; i < 1000; i++) {
                features0.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0,0] },
                    properties: { ca: 90, key: String(i) }
                });
            }
            for (i = 0; i < 500; i++) {
                features1.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0,0] },
                    properties: { ca: 90, key: String(1000 + i) }
                });
            }

            var match0 = /page=0/,
                response0 = { type: 'FeatureCollection', features: features0 },
                match1 = /page=1/,
                response1 = { type: 'FeatureCollection', features: features1 }

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
            mapillary.loadSigns(context, context.projection, dimensions);

            var base = 'regulatory--maximum-speed-limit-65--',
                match = /traffico\/string-maps\/(\w+)-map.json/;

            server.respondWith('GET', match, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' },
                    '{ "' + base + id + '": true }');
            });
            server.respond();

            var sign_defs = iD.services.mapillary.sign_defs;

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
            mapillary.loadSigns(context, context.projection, dimensions);

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

            expect(spy).to.have.been.calledOnce;
        });

        it('loads multiple pages of signs results', function() {
            var spy = sinon.spy();
            mapillary.on('loadedSigns', spy);
            mapillary.loadSigns(context, context.projection, dimensions);

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
                    geometry: { type: 'Point', coordinates: [0,0] },
                    properties: { rects: rects, key: String(i) }
                });
            }
            for (i = 0; i < 500; i++) {
                features1.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0,0] },
                    properties: { rects: rects, key: String(1000 + i) }
                });
            }

            var match0 = /page=0/,
                response0 = { type: 'FeatureCollection', features: features0 },
                match1 = /page=1/,
                response1 = { type: 'FeatureCollection', features: features1 }

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
                [0, 0, 0, 0, { key: '0', loc: [0,0], ca: 90 }],
                [0, 0, 0, 0, { key: '1', loc: [0,0], ca: 90 }],
                [0, 1, 0, 1, { key: '2', loc: [0,1], ca: 90 }]
            ];

            iD.services.mapillary.cache.images.rtree.load(features);
            var res = mapillary.images(context.projection, dimensions);

            expect(res).to.deep.eql([
                { key: '0', loc: [0,0], ca: 90 },
                { key: '1', loc: [0,0], ca: 90 }
            ]);
        });

        it('limits results no more than 3 stacked images in one spot', function() {
            var features = [
                [0, 0, 0, 0, { key: '0', loc: [0,0], ca: 90 }],
                [0, 0, 0, 0, { key: '1', loc: [0,0], ca: 90 }],
                [0, 0, 0, 0, { key: '2', loc: [0,0], ca: 90 }],
                [0, 0, 0, 0, { key: '3', loc: [0,0], ca: 90 }],
                [0, 0, 0, 0, { key: '4', loc: [0,0], ca: 90 }]
            ];

            iD.services.mapillary.cache.images.rtree.load(features);
            var res = mapillary.images(context.projection, dimensions);
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
                    [0, 0, 0, 0, { key: '0', loc: [0,0], signs: signs }],
                    [0, 0, 0, 0, { key: '1', loc: [0,0], signs: signs }],
                    [0, 1, 0, 1, { key: '2', loc: [0,1], signs: signs }]
                ];

            iD.services.mapillary.cache.signs.rtree.load(features);
            var res = mapillary.signs(context.projection, dimensions);

            expect(res).to.deep.eql([
                { key: '0', loc: [0,0], signs: signs },
                { key: '1', loc: [0,0], signs: signs }
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
                    [0, 0, 0, 0, { key: '0', loc: [0,0], signs: signs }],
                    [0, 0, 0, 0, { key: '1', loc: [0,0], signs: signs }],
                    [0, 0, 0, 0, { key: '2', loc: [0,0], signs: signs }],
                    [0, 0, 0, 0, { key: '3', loc: [0,0], signs: signs }],
                    [0, 0, 0, 0, { key: '4', loc: [0,0], signs: signs }]
                ];

            iD.services.mapillary.cache.signs.rtree.load(features);
            var res = mapillary.signs(context.projection, dimensions);
            expect(res).to.have.length.of.at.most(3);
        });
    });

    describe('#signsSupported', function() {
        it('returns false for Internet Explorer', function() {
            var detect = iD.detect;
            iD.detect = function() { return { ie: true, browser: 'Internet Explorer' }; };
            expect(mapillary.signsSupported()).to.be.false;
            iD.detect = detect;
        });

        it('returns false for Safari', function() {
            var detect = iD.detect;
            iD.detect = function() { return { ie: false, browser: 'Safari' }; };
            expect(mapillary.signsSupported()).to.be.false;
            iD.detect = detect;
        });
    });

    describe('#signHTML', function() {
        it('returns sign HTML', function() {
            iD.services.mapillary.sign_defs = {
                us: {'regulatory--maximum-speed-limit-65--us': '<span class="t">65</span>'}
            };

            var signdata = {
                    key: '0',
                    loc: [0,0],
                    signs: [{
                        'package': 'trafficsign_us_3.0',
                        rect: [ 0.805, 0.463, 0.833, 0.502 ],
                        length: 4,
                        score: '1.27',
                        type: 'regulatory--maximum-speed-limit-65--us'
                    }]
                };

            expect(mapillary.signHTML(signdata)).to.eql('<span class="t">65</span>')
        });
    });

    describe('#selectedThumbnail', function() {
        it('sets thumbnail image', function() {
            mapillary.selectedThumbnail('foo');
            expect(iD.services.mapillary.thumb).to.eql('foo');
        });

        it('gets thumbnail image', function() {
            iD.services.mapillary.thumb = 'bar';
            expect(mapillary.selectedThumbnail()).to.eql('bar');
        });
    });

    describe('#reset', function() {
        it('resets cache and thumbnail image', function() {
            iD.services.mapillary.cache.foo = 'bar';
            iD.services.mapillary.thumb = 'bar';

            mapillary.reset();
            expect(iD.services.mapillary.cache).to.not.have.property('foo');
            expect(iD.services.mapillary.thumb).to.be.null;
        });
    });

});
