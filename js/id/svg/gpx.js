iD.svg.Gpx = function(projection, context, dispatch) {
    var showLabels = true,
        layer;

    function init() {
        if (iD.svg.Gpx.initialized) return;  // run once

        iD.svg.Gpx.geojson = {};
        iD.svg.Gpx.enabled = true;

        function over() {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            d3.event.dataTransfer.dropEffect = 'copy';
        }

        d3.select('body')
            .attr('dropzone', 'copy')
            .on('drop.localgpx', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                if (!iD.detect().filedrop) return;
                drawGpx.files(d3.event.dataTransfer.files);
            })
            .on('dragenter.localgpx', over)
            .on('dragexit.localgpx', over)
            .on('dragover.localgpx', over);

        iD.svg.Gpx.initialized = true;
    }


    function drawGpx(surface) {
        var geojson = iD.svg.Gpx.geojson,
            enabled = iD.svg.Gpx.enabled;

        layer = surface.selectAll('.layer-gpx')
            .data(enabled ? [0] : []);

        layer.enter()
            .append('g')
            .attr('class', 'layer-gpx');

        layer.exit()
            .remove();


        var paths = layer
            .selectAll('path')
            .data([geojson]);

        paths.enter()
            .append('path')
            .attr('class', 'gpx');

        paths.exit()
            .remove();

        var path = d3.geo.path()
            .projection(projection);

        paths
            .attr('d', path);


        var labels = layer.selectAll('text')
            .data(showLabels && geojson.features ? geojson.features : []);

        labels.enter()
            .append('text')
            .attr('class', 'gpx');

        labels.exit()
            .remove();

        labels
            .text(function(d) {
                return d.properties.desc || d.properties.name;
            })
            .attr('x', function(d) {
                var centroid = path.centroid(d);
                return centroid[0] + 7;
            })
            .attr('y', function(d) {
                var centroid = path.centroid(d);
                return centroid[1];
            });

    }

    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }

    drawGpx.showLabels = function(_) {
        if (!arguments.length) return showLabels;
        showLabels = _;
        return this;
    };

    drawGpx.enabled = function(_) {
        if (!arguments.length) return iD.svg.Gpx.enabled;
        iD.svg.Gpx.enabled = _;
        dispatch.change();
        return this;
    };

    drawGpx.hasGpx = function() {
        var geojson = iD.svg.Gpx.geojson;
        return (!(_.isEmpty(geojson) || _.isEmpty(geojson.features)));
    };

    drawGpx.geojson = function(gj) {
        if (!arguments.length) return iD.svg.Gpx.geojson;
        if (_.isEmpty(gj) || _.isEmpty(gj.features)) return this;
        iD.svg.Gpx.geojson = gj;
        dispatch.change();
        return this;
    };

    drawGpx.url = function(url) {
        d3.text(url, function(err, data) {
            if (!err) {
                drawGpx.geojson(toGeoJSON.gpx(toDom(data)));
            }
        });
        return this;
    };

    drawGpx.files = function(fileList) {
        var f = fileList[0],
            reader = new FileReader();

        reader.onload = function(e) {
            drawGpx.geojson(toGeoJSON.gpx(toDom(e.target.result))).fitZoom();
        };

        reader.readAsText(f);
        return this;
    };

    drawGpx.fitZoom = function() {
        if (!this.hasGpx()) return this;
        var geojson = iD.svg.Gpx.geojson;

        var map = context.map(),
            viewport = map.trimmedExtent().polygon(),
            coords = _.reduce(geojson.features, function(coords, feature) {
                var c = feature.geometry.coordinates;
                return _.union(coords, feature.geometry.type === 'Point' ? [c] : c);
            }, []);

        if (!iD.geo.polygonIntersectsPolygon(viewport, coords, true)) {
            var extent = iD.geo.Extent(d3.geo.bounds(geojson));
            map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
        }

        return this;
    };

    init();
    return drawGpx;
};
