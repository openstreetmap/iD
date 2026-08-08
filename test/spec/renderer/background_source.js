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
        it('sanitizes `key` in the URL path', function() {
            var source = iD.rendererBackgroundSource.Custom('http://example.com/services;key=MYTOKEN/layer');
            expect(source.imageryUsed()).toEqual('Custom (http://example.com/services;key={apikey}/layer )');
        });
    });

    describe('.Custom', function() {
        it('is flagged isCustom and uses the supplied id and name', function() {
            const source = iD.rendererBackgroundSource.Custom('https://ex.com/{z}/{x}/{y}.png', 'custom-7', 'My Tiles');
            expect(source.isCustom).toBe(true);
            expect(source.id).to.equal('custom-7');
            expect(source.customName()).to.equal('My Tiles');
            expect(source.template()).to.equal('https://ex.com/{z}/{x}/{y}.png');
        });

        it('defaults the id to "custom" when none is supplied', function() {
            const source = iD.rendererBackgroundSource.Custom('x');
            expect(source.id).to.equal('custom');
            expect(source.isCustom).toBe(true);
        });

        it('allows updating the template (custom sources are editable)', function() {
            const source = iD.rendererBackgroundSource.Custom('a', 'custom-1');
            source.template('b');
            expect(source.template()).to.equal('b');
        });

        it('keeps the template as supplied (cleanup happens at the persistence layer)', function() {
            const tmpl = 'https://ex.com/{z}/{x}/{y}.png\n\n';
            const source = iD.rendererBackgroundSource.Custom(tmpl, 'custom-1');
            expect(source.template()).to.equal(tmpl);
        });

        it('guesses the tms type for a custom source with a generated id', function() {
            const source = iD.rendererBackgroundSource.Custom('{z}/{x}/{y}', 'custom-3');
            expect(source.url([0,1,2])).to.equal('2/0/1');
        });

        it('reports no description (row tooltip shows the full template URL instead)', function() {
            const source = iD.rendererBackgroundSource.Custom('https://ex.com/{z}/{x}/{y}.png', 'custom-1');
            expect(source.hasDescription()).toBe(false);
        });

        it('uses a cleaned host/folders label when no name is given', function() {
            const source = iD.rendererBackgroundSource.Custom(
                'https://www.mapproxy.codefor.de/tiles/1.0.0/alkis_sw/mercator/{z}/{x}/{y}.png?token=secret',
                'custom-1'
            );
            expect(source.name()).to.equal('Custom: mapproxy.codefor.de/tiles/1.0.0/alkis_sw/mercator');
        });

        it('uses the user-provided name when set', function() {
            const source = iD.rendererBackgroundSource.Custom(
                'https://ex.com/{z}/{x}/{y}.png',
                'custom-1',
                'My Tiles'
            );
            expect(source.name()).to.equal('Custom: My Tiles');
        });
    });

});
