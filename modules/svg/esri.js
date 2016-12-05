import * as d3 from 'd3';
import _ from 'lodash';
import { geoExtent, geoPolygonIntersectsPolygon } from '../geo/index';
import { utilDetect } from '../util/detect';
import toGeoJSON from 'togeojson';
import fromEsri from 'esri-to-geojson';

export function svgEsri(projection, context, dispatch) {
    var showLabels = true,
        detected = utilDetect(),
        layer;


    function init() {
        if (svgEsri.initialized) return;  // run once

        svgEsri.geojson = {};
        svgEsri.enabled = true;

        function over() {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            d3.event.dataTransfer.dropEffect = 'copy';
        }

        d3.select('body')
            .attr('dropzone', 'copy')
            .on('drop.localesri', function() {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                if (!detected.filedrop) return;
                drawEsri.files(d3.event.dataTransfer.files);
            })
            .on('dragenter.localesri', over)
            .on('dragexit.localesri', over)
            .on('dragover.localesri', over);

        svgEsri.initialized = true;
    }


    function drawEsri(selection) {
        var geojson = svgEsri.geojson,
            enabled = svgEsri.enabled;

        layer = selection.selectAll('.layer-esri')
            .data(enabled ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-esri')
            .merge(layer);


        var paths = layer
            .selectAll('path')
            .data([geojson]);

        paths.exit()
            .remove();

        paths = paths.enter()
            .append('path')
            .attr('class', 'esri')
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
            .attr('class', 'esri')
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


    drawEsri.showLabels = function(_) {
        if (!arguments.length) return showLabels;
        showLabels = _;
        return this;
    };


    drawEsri.enabled = function(_) {
        if (!arguments.length) return svgEsri.enabled;
        svgEsri.enabled = _;
        dispatch.call('change');
        return this;
    };


    drawEsri.hasEsri = function() {
        var geojson = svgEsri.geojson;
        return (!(_.isEmpty(geojson) || _.isEmpty(geojson.features)));
    };


    drawEsri.geojson = function(gj) {
        if (!arguments.length) return svgEsri.geojson;
        if (_.isEmpty(gj) || _.isEmpty(gj.features)) return this;
        svgEsri.geojson = gj;
        dispatch.call('change');
        return this;
    };


    drawEsri.url = function(url) {
        d3.text(url, function(err, data) {
            if (err) {
                console.log('Esri service URL did not load');
                console.error(err);
            } else {
                drawEsri.geojson(fromEsri.fromEsri(JSON.parse(data)));
            }
        });
        return this;
    };

    drawEsri.fitZoom = function() {
        if (!this.hasEsri()) return this;
        var geojson = svgEsri.geojson;

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
    return drawEsri;
}
