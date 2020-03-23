describe('iD.svgData', function () {
    var context;
    var surface;
    var dispatch = d3.dispatch('change');
    var projection = iD.geoRawMercator()
        .translate([6934098.868981334, 4092682.5519805425])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [1000, 1000]]);

    var geojson =
        '{' +
        '  "type": "FeatureCollection",' +
        '  "features": [' +
        '    {' +
        '      "type": "Feature",' +
        '      "geometry": {' +
        '        "type": "Point",' +
        '        "coordinates": [-74.38928604125977, 40.150275473401365]' +
        '      },' +
        '      "properties": {' +
        '        "abbr": "N.J.",' +
        '        "area": 19717.8,' +
        '        "name": "New Jersey",' +
        '        "name_en": "New Jersey",' +
        '        "osm_id": 316973311' +
        '      },' +
        '      "id": 316973311' +
        '    }' +
        '  ]' +
        '}';

    var gj = JSON.parse(geojson);

    var gpx =
        '<?xml version="1.0"?>' +
        '<gpx version="1.1" creator="GDAL 2.2.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogr="http://osgeo.org/gdal" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">' +
        '<metadata><bounds minlat="40.150275473401365" minlon="-74.389286041259766" maxlat="40.150275473401365" maxlon="-74.389286041259766"/></metadata>' +
        '<wpt lat="40.150275473401365" lon="-74.389286041259766">' +
        '  <name>New Jersey</name>' +
        '  <extensions>' +
        '    <ogr:abbr>N.J.</ogr:abbr>' +
        '    <ogr:area>19717.8</ogr:area>' +
        '    <ogr:name_en>New Jersey</ogr:name_en>' +
        '    <ogr:osm_id>316973311</ogr:osm_id>' +
        '  </extensions>' +
        '</wpt>' +
        '</gpx>';

    var kml =
        '<?xml version="1.0" encoding="utf-8" ?>' +
        '<kml xmlns="http://www.opengis.net/kml/2.2">' +
        '<Document id="root_doc">' +
        '<Schema name="gpxtest" id="gpxtest">' +
        '    <SimpleField name="abbr" type="string"></SimpleField>' +
        '    <SimpleField name="area" type="float"></SimpleField>' +
        '    <SimpleField name="name_en" type="string"></SimpleField>' +
        '    <SimpleField name="osm_id" type="int"></SimpleField>' +
        '</Schema>' +
        '<Folder><name>gpxtest</name>' +
        '  <Placemark>' +
        '    <name>New Jersey</name>' +
        '    <ExtendedData><SchemaData schemaUrl="#gpxtest">' +
        '        <SimpleData name="abbr">N.J.</SimpleData>' +
        '        <SimpleData name="area">19717.8</SimpleData>' +
        '        <SimpleData name="name_en">New Jersey</SimpleData>' +
        '        <SimpleData name="osm_id">316973311</SimpleData>' +
        '    </SchemaData></ExtendedData>' +
        '      <Point><coordinates>-74.3892860412598,40.1502754734014</coordinates></Point>' +
        '  </Placemark>' +
        '</Folder>' +
        '</Document>' +
        '</kml>';


    // this is because PhantomJS hasn't implemented a proper File constructor
    function makeFile(contents, fileName, mimeType) {
        var blob = new Blob([contents], { type: mimeType });
        blob.lastModifiedDate = new Date();
        blob.name = fileName;
        return blob;
    }

    beforeEach(function () {
        context = iD.coreContext().init();
        d3.select(document.createElement('div'))
            .attr('class', 'main-map')
            .call(context.map().centerZoom([-74.389286, 40.1502754], 17));

        surface = context.surface();
    });


    it('creates layer-mapdata', function () {
        var render = iD.svgData(projection, context, dispatch).geojson(gj);
        surface.call(render);

        var layers = surface.selectAll('g.layer-mapdata').nodes();
        expect(layers.length).to.eql(1);
    });

    it('draws geojson', function () {
        var render = iD.svgData(projection, context, dispatch).geojson(gj);
        surface.call(render);

        var path;
        path = surface.selectAll('path.shadow');
        expect(path.nodes().length).to.eql(1);
        expect(path.attr('d')).to.match(/^M.*z$/);
        path = surface.selectAll('path.stroke');
        expect(path.nodes().length).to.eql(1);
        expect(path.attr('d')).to.match(/^M.*z$/);
    });

    describe('#fileList', function() {
        it('handles gpx files', function (done) {
            var files = [ makeFile(gpx, 'test.gpx', 'application/gpx+xml') ];
            var render = iD.svgData(projection, context, dispatch);
            var spy = sinon.spy();
            dispatch.on('change', spy);
            render.fileList(files);

            window.setTimeout(function() {
                expect(spy).to.have.been.calledOnce;
                surface.call(render);
                var path;
                path = surface.selectAll('path.shadow');
                expect(path.nodes().length).to.eql(1);
                expect(path.attr('d')).to.match(/^M.*z$/);
                path = surface.selectAll('path.stroke');
                expect(path.nodes().length).to.eql(1);
                expect(path.attr('d')).to.match(/^M.*z$/);
                done();
            }, 200);
        });

        it('handles kml files', function (done) {
            var files = [ makeFile(kml, 'test.kml', 'application/vnd.google-earth.kml+xml') ];
            var render = iD.svgData(projection, context, dispatch);
            var spy = sinon.spy();
            dispatch.on('change', spy);
            render.fileList(files);

            window.setTimeout(function() {
                expect(spy).to.have.been.calledOnce;
                surface.call(render);
                var path;
                path = surface.selectAll('path.shadow');
                expect(path.nodes().length).to.eql(1);
                expect(path.attr('d')).to.match(/^M.*z$/);
                path = surface.selectAll('path.stroke');
                expect(path.nodes().length).to.eql(1);
                expect(path.attr('d')).to.match(/^M.*z$/);
                done();
            }, 200);
        });

        it('handles geojson files', function (done) {
            var files = [ makeFile(geojson, 'test.geojson', 'application/vnd.geo+json') ];
            var render = iD.svgData(projection, context, dispatch);
            var spy = sinon.spy();
            dispatch.on('change', spy);
            render.fileList(files);

            window.setTimeout(function() {
                expect(spy).to.have.been.calledOnce;
                surface.call(render);
                var path;
                path = surface.selectAll('path.shadow');
                expect(path.nodes().length).to.eql(1);
                expect(path.attr('d')).to.match(/^M.*z$/);
                path = surface.selectAll('path.stroke');
                expect(path.nodes().length).to.eql(1);
                expect(path.attr('d')).to.match(/^M.*z$/);
                done();
            }, 200);
        });
    });


    describe('#showLabels', function() {
        it('shows labels by default', function () {
            var render = iD.svgData(projection, context, dispatch).geojson(gj);
            surface.call(render);

            var label = surface.selectAll('text.label');
            expect(label.nodes().length).to.eql(1);
            expect(label.text()).to.eql('New Jersey');

            var halo = surface.selectAll('text.label-halo');
            expect(halo.nodes().length).to.eql(1);
            expect(halo.text()).to.eql('New Jersey');
        });


        it('hides labels with showLabels(false)', function () {
            var render = iD.svgData(projection, context, dispatch).geojson(gj).showLabels(false);
            surface.call(render);

            expect(surface.selectAll('text.label').empty()).to.be.ok;
            expect(surface.selectAll('text.label-halo').empty()).to.be.ok;
        });
    });

});
