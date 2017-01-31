import * as d3 from 'd3';
import _ from 'lodash';
import { geoExtent, geoPolygonIntersectsPolygon } from '../geo/index';
import { utilDetect } from '../util/detect';

export function svgGeoJson(projection, context, dispatch) {
    var showLabels = true,
        detected = utilDetect(),
        layer;


    function init() {
        if (svgGeoJson.initialized) return;  // run once

        svgGeoJson.geojson = {};
        svgGeoJson.enabled = true;

        function over() {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            d3.event.dataTransfer.dropEffect = 'copy';
        }

        d3.select('body')
            .attr('dropzone', 'copy')
            .on('drop.localggeojson', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                if (!detected.filedrop) return;
                drawGeojson.files(d3.event.dataTransfer.files);
            })
            .on('dragenter.localgeojson', over)
            .on('dragexit.localgeojson', over)
            .on('dragover.localgeojson', over);

        svgGeoJson.initialized = true;
    }


    function drawGeojson(selection) {
        var geojson = svgGeoJson.geojson,
            enabled = svgGeoJson.enabled;

        layer = selection.selectAll('.layer-geojson')
            .data(enabled ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-geojson')
            .merge(layer);


        var paths = layer
            .selectAll('path')
            .data([geojson]);

        paths.exit()
            .remove();

        paths = paths.enter()
            .append('path')
            .attr('class', 'geojson')
            .merge(paths);


        var path = d3.geoPath(projection);

        paths
            .attr('d', path);


        var labels = layer.selectAll('text')
            .data(showLabels && geojson.features ? geojson.features : []);

        labels.exit()
            .remove();

        labels = labels.enter()
            .append('text')
            .attr('class', 'geojson')
            .merge(labels);

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


    drawGeojson.showLabels = function(_) {
        if (!arguments.length) return showLabels;
        showLabels = _;
        return this;
    };


    drawGeojson.enabled = function(_) {
        if (!arguments.length) return svgGeoJson.enabled;
        svgGeoJson.enabled = _;
        dispatch.call('change');
        return this;
    };


    drawGeojson.hasGeojson = function() {
        var geojson = svgGeoJson.geojson;
        return (!(_.isEmpty(geojson) || _.isEmpty(geojson.features)));
    };


    drawGeojson.geojson = function(gj) {
        if (!arguments.length) return svgGeoJson.geojson;
        if (_.isEmpty(gj) || _.isEmpty(gj.features)) return this;
        svgGeoJson.geojson = gj;
        dispatch.call('change');
        return this;
    };


    drawGeojson.files = function(fileList) {
        if (!fileList.length) return this;
        var f = fileList[0],
            reader = new FileReader();

        reader.onload = function(e) {
            drawGeojson.geojson(JSON.parse(e.target.result)).fitZoom();
        };

        reader.readAsText(f);
        return this;
    };


    drawGeojson.fitZoom = function() {
        if (!this.hasGeojson()) return this;
        var geojson = svgGeoJson.geojson;

        var map = context.map(),
            viewport = map.trimmedExtent().polygon(),
            coords = _.reduce(geojson.features, function(coords, feature) {
                var c = feature.geometry.coordinates;
                return _.union(coords, feature.geometry.type === 'Point' ? [c] : c);
            }, []);

        if (!geoPolygonIntersectsPolygon(viewport, coords, true)) {
            var extent = geoExtent(d3.geoBounds(geojson));
            map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
        }

        return this;
    };


    init();
    return drawGeojson;
}
