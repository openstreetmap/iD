describe('iD.rendererBackgroundSource', function() {
    it('does not error with blank template', function() {
        var source = iD.rendererBackgroundSource({ template: '' });
        expect(source.url([0,1,2])).toEqual('');
    });

    it('supports tms replacement tokens', function() {
        var source = iD.rendererBackgroundSource({
            type: 'tms',
            template: '{z}/{x}/{y}'
        });
        expect(source.url([0,1,2])).toEqual('2/0/1');
    });

    it('supports wms replacement tokens', function() {
        var source = iD.rendererBackgroundSource({
            type: 'wms',
            projection: 'EPSG:3857',
            template: 'SRS={proj}&imageSR={wkid}&bboxSR={wkid}&FORMAT=image/jpeg&WIDTH={width}&HEIGHT={height}&BBOX={bbox}'
        });

        var result = iD.utilStringQs(source.url([0,1,2]));
        expect(result.SRS).toEqual('EPSG:3857');
        expect(result.imageSR).toEqual('3857');
        expect(result.bboxSR).toEqual('3857');
        expect(result.FORMAT).toEqual('image/jpeg');
        expect(result.WIDTH).toEqual('256');
        expect(result.HEIGHT).toEqual('256');

        var bbox = result.BBOX.split(',');
        expect(+bbox[0]).toBeCloseTo(-20037508.34, 3);
        expect(+bbox[1]).toBeCloseTo(0, 3);
        expect(+bbox[2]).toBeCloseTo(-10018754.17, 3);
        expect(+bbox[3]).toBeCloseTo(10018754.17, 3);
    });

    it('supports subdomains', function() {
        var source = iD.rendererBackgroundSource({ template: '{switch:a,b}/{z}/{x}/{y}'});
        expect(source.url([0,1,2])).toEqual('b/2/0/1');
    });

    it('distributes requests between subdomains', function() {
        var source = iD.rendererBackgroundSource({ template: '{switch:a,b}/{z}/{x}/{y}' });
        expect(source.url([0,1,1])).toEqual('b/1/0/1');
        expect(source.url([0,2,1])).toEqual('a/1/0/2');
    });

    it('correctly displays an overlay with no overzoom specified', function() {
        var source = iD.rendererBackgroundSource({ zoomExtent: [6,16] });
        expect(source.validZoom(10)).toBe(true);
        expect(source.validZoom(3)).toBe(false);
        expect(source.validZoom(17)).toBe(true);
    });

    it('correctly displays an overlay with an invalid overzoom', function() {
        var source = iD.rendererBackgroundSource({ zoomExtent: [6,16], overzoom: 'gibberish'});
        expect(source.validZoom(10)).toBe(true);
        expect(source.validZoom(3)).toBe(false);
        expect(source.validZoom(17)).toBe(true);
    });

    it('correctly displays an overlay with overzoom:true', function() {
        var source = iD.rendererBackgroundSource({ zoomExtent: [6,16], overzoom: true});
        expect(source.validZoom(10)).toBe(true);
        expect(source.validZoom(3)).toBe(false);
        expect(source.validZoom(17)).toBe(true);
    });

    it('correctly displays an overlay with overzoom:false', function() {
        var source = iD.rendererBackgroundSource({ zoomExtent: [6,16], overzoom: false});
        expect(source.validZoom(10)).toBe(true);
        expect(source.validZoom(3)).toBe(false);
        expect(source.validZoom(17)).toBe(false);
    });
});

describe('iD.rendererBackgroundSource.Custom', function() {
    describe('#imageryUsed', function() {
        it('returns an imagery_used string', function() {
            var source = iD.rendererBackgroundSource.Custom('http://example.com');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com )');  // note ' )' space
        });
        it('sanitizes `access_token`', function() {
            var source = iD.rendererBackgroundSource.Custom('http://example.com?access_token=MYTOKEN');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com?access_token={apikey} )');
        });
        it('sanitizes `connectId`', function() {
            var source = iD.rendererBackgroundSource.Custom('http://example.com?connectId=MYTOKEN');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com?connectId={apikey} )');
        });
        it('sanitizes `token`', function() {
            var source = iD.rendererBackgroundSource.Custom('http://example.com?token=MYTOKEN');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com?token={apikey} )');
        });
        it('sanitizes `Signature` for CloudFront', function() {
            var source = iD.rendererBackgroundSource.Custom('https://example.com/?Key-Pair-Id=foo&Policy=bar&Signature=baz');
            expect(source.imageryUsed()).toEqual('Custom (https://example.com/?Key-Pair-Id=foo&Policy=bar&Signature={apikey} )');
        });
        it('sanitizes wms path `token`', function() {
            var source = iD.rendererBackgroundSource.Custom('http://example.com/wms/v1/token/MYTOKEN/1.0.0/layer');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com/wms/v1/token/{apikey}/1.0.0/layer )');
        });
        it('sanitizes wms path `token` values containing `-`, `.` or `~`', function() {
            var source = iD.rendererBackgroundSource.Custom('http://example.com/wms/v1/token/abc-def.ghi~jkl/1.0.0/layer');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com/wms/v1/token/{apikey}/1.0.0/layer )');
        });
        it('sanitizes wms path `token` case-insensitively', function() {
            var source = iD.rendererBackgroundSource.Custom('http://example.com/wms/v1/Token/abc-def/1.0.0/layer');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com/wms/v1/Token/{apikey}/1.0.0/layer )');
        });
        it('sanitizes `key` in the URL path', function() {
            var source = iD.rendererBackgroundSource.Custom('http://example.com/services;key=MYTOKEN/layer');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com/services;key={apikey}/layer )');
        });
        it('sanitizes `key` values containing `-`, `.` or `~`', function() {
            // real keys may contain `-`, for example (these services are not necessarily
            // usable as imagery in iD, but they show that such keys exist):
            // Google Map Tiles API `key=`, see https://developers.google.com/maps/documentation/tile/2d-tiles-overview
            // and key format at https://learn.microsoft.com/purview/sit-defn-google-api-key
            // which gives `A1bC2dE3f-4iJ5_L6mN\oP8qR9sT0u` as an example
            var source = iD.rendererBackgroundSource.Custom('http://example.com/tiles?key=abc-def.ghi~jkl&foo=1');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com/tiles?key={apikey}&foo=1 )');
        });
        it('sanitizes `key` case-insensitively', function() {
            // HERE uses `apiKey=` (https://docs.here.com/map-rendering/docs/quickstart-raster-tile-api)
            // (not necessarily usable as imagery in iD, but it shows that such parameter names exist)
            var source = iD.rendererBackgroundSource.Custom('http://example.com/tiles?apiKey=MY-TOKEN&foo=1');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com/tiles?apiKey={apikey}&foo=1 )');
        });
        it('sanitizes every occurrence of `key`', function() {
            var source = iD.rendererBackgroundSource.Custom('http://example.com/services/layer?apikey=MYTOKEN&otherkey=OTHER-TOKEN');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com/services/layer?apikey={apikey}&otherkey={apikey} )');
        });
    });

});
