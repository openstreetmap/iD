describe('iD.svgGpx', function () {
    var context;
    var surface;
    var dispatch = d3.dispatch('change');
    var projection = d3.geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);

    beforeEach(function () {
        context = iD.coreContext();
        d3.select(document.createElement('div'))
            .attr('id', 'map')
            .call(context.map().centerZoom([0, 0], 17));
        surface = context.surface();
    });


    it('creates layer-gpx', function () {
        var render = iD.svgGpx(projection, context, dispatch);
        surface.call(render);

        var layers = surface.selectAll('g.layer-gpx').nodes();
        expect(layers.length).to.eql(1);
        expect(d3.select(layers[0]).classed('layer-gpx')).to.be.true;
    });

    it('draws geojson', function () {
        var gj = {
                  'type': 'FeatureCollection',
                  'features': [
                    {
                      'type': 'Feature',
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
                      },
                      'id': 316973311
                    }
                  ]
                };
        var render = iD.svgGpx(projection, context, dispatch).geojson(gj);
        surface.call(render);

        var elements = surface.selectAll('path.gpx').nodes();
        expect(elements.length).to.eql(1);
        expect(d3.select(elements[0]).classed('gpx')).to.be.true;
    });

    describe('#files', function() {
        it('handles gpx files', function () {
            var files = '../../data/gpxtest.gpx';
            var render = iD.svgGpx(projection, context, dispatch).files(files);
            surface.call(render);

            var elements = surface.selectAll('path.gpx').nodes();
            expect(elements.length).to.eql(1);
            expect(d3.select(elements[0]).classed('gpx')).to.be.true;
        });

        it('handles geojson files', function () {
            var files = '../../data/gpxtest.json';
            var render = iD.svgGpx(projection, context, dispatch).files(files);
            surface.call(render);

            var elements = surface.selectAll('path.gpx').nodes();
            expect(elements.length).to.eql(1);
            expect(d3.select(elements[0]).classed('gpx')).to.be.true;
        });

        it('handles kml files', function () {
            var files = '../../data/gpxtest.kml';
            var render = iD.svgGpx(projection, context, dispatch).files(files);
            surface.call(render);

            var elements = surface.selectAll('path.gpx').nodes();
            expect(elements.length).to.eql(1);
            expect(d3.select(elements[0]).classed('gpx')).to.be.true;
        });
    });


    describe('#showLabels', function() {
        it('shows labels by default', function () {
            var gj = {
                  'type': 'FeatureCollection',
                  'features': [
                    {
                      'type': 'Feature',
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
                      },
                      'id': 316973311
                    }
                  ]
                };
            var render = iD.svgGpx(projection, context, dispatch).geojson(gj);
            surface.call(render);
            var elements = surface.selectAll('text.gpxlabel').nodes();
            //expect(elements.length).to.eql(1);
            //expect(d3.select(elements[0]).classed('text.gpxlabel')).to.be.true;

            var halo = surface.selectAll('text.gpxlabel-halo').nodes();
            //expect(halo.length).to.eql(1);
            //expect(d3.select(elements[0]).classed('text.gpxlabel-halo')).to.be.true;
        });


        it('hides labels with showLabels(false)', function () {
            var gj = {
                  'type': 'FeatureCollection',
                  'features': [
                    {
                      'type': 'Feature',
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
                      },
                      'id': 316973311
                    }
                  ]
                };
            var render = iD.svgGpx(projection, context, dispatch).geojson(gj).showLabels(false);
            surface.call(render);

            expect(surface.selectAll('text.gpxlabel').empty()).to.be.ok;
            expect(surface.selectAll('text.gpxlabel-halo').empty()).to.be.ok;
        });
    });

});
