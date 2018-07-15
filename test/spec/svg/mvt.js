describe('iD.svgMvt', function () {
    var context;
    var surface;
    var dispatch = d3.dispatch('change');
    var projection = iD.geoRawMercator()
        .translate([6934098.868981334, 4092682.5519805425])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [1000, 1000]]);


    var gj = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'id': 316973311,
                'geometry': {
                    'type': 'Point',
                    'coordinates': [
                        -74.38928604125977,
                        40.150275473401365
                    ]
                },
                'properties': {
                    'abbr': 'N.J.',
                    'area': 19717.8,
                    'name': 'New Jersey',
                    'name_en': 'New Jersey',
                    'osm_id': 316973311
                }
            }
        ]
    };

    beforeEach(function () {
        context = iD.coreContext();
        d3.select(document.createElement('div'))
            .attr('id', 'map')
            .call(context.map().centerZoom([-74.389286, 40.1502754], 17));

        surface = context.surface();
    });

    it('creates layer-mvt', function () {
        var render = iD.svgMvt(projection, context, dispatch);
        surface.call(render);

        var layers = surface.selectAll('g.layer-mvt').nodes();
        expect(layers.length).to.eql(1);
    });

    it('draws geojson', function () {
        var render = iD.svgMvt(projection, context, dispatch).geojson(gj);
        surface.call(render);

        var path = surface.selectAll('path.mvt');
        expect(path.nodes().length).to.eql(1);
        expect(path.attr('d')).to.match(/^M.*z$/);
    });

    describe('#url', function() {
        it('handles pbf url', function () {
            var url = 'https://api.mapbox.com/v4/mapbox.mapbox-streets-v6/9/150/194.vector.pbf?access_token='
                        +'pk.eyJ1IjoidmVyc2h3YWwiLCJhIjoiY2pocmk1c2J5M28wbDM1cGU1ZDdpeDB1eSJ9.KN1fjHMCdSUsYcuvwiXWIA';
            var render = iD.svgMvt(projection, context, dispatch).url(url);
            surface.call(render);

            var path = surface.selectAll('path.mvt');
            expect(path.nodes().length).to.eql(1);
            expect(path.attr('d')).to.match(/^M.*z$/);
        });
    });

    describe('#showLabels', function() {
        it('shows labels by default', function () {
            var render = iD.svgMvt(projection, context, dispatch).geojson(gj);
            surface.call(render);

            var label = surface.selectAll('text.mvtlabel');
            expect(label.nodes().length).to.eql(1);
            expect(label.text()).to.eql('New Jersey');

            var halo = surface.selectAll('text.mvtlabel-halo');
            expect(halo.nodes().length).to.eql(1);
            expect(halo.text()).to.eql('New Jersey');
        });


        it('hides labels with showLabels(false)', function () {
            var render = iD.svgMvt(projection, context, dispatch).geojson(gj).showLabels(false);
            surface.call(render);

            expect(surface.selectAll('text.mvtlabel').empty()).to.be.ok;
            expect(surface.selectAll('text.mvtlabel-halo').empty()).to.be.ok;
        });
    });

});
