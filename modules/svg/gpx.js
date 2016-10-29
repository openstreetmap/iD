import * as d3 from 'd3';
import _ from 'lodash';
import { geoExtent, geoPolygonIntersectsPolygon } from '../geo/index';
import { utilDetect } from '../util/detect';
import toGeoJSON from 'togeojson';


export function svgGpx(projection, context, dispatch) {
    var showLabels = true,
        detected = utilDetect(),
        layer;


    function init() {
        if (svgGpx.initialized) return;  // run once

        svgGpx.geojson = {};
        svgGpx.enabled = true;

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
                if (!detected.filedrop) return;
                drawGpx.files(d3.event.dataTransfer.files);
            })
            .on('dragenter.localgpx', over)
            .on('dragexit.localgpx', over)
            .on('dragover.localgpx', over);

        svgGpx.initialized = true;
    }


    function drawGpx(selection) {
        var geojson = svgGpx.geojson,
            enabled = svgGpx.enabled;

        layer = selection.selectAll('.layer-gpx')
            .data(enabled ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-gpx')
            .merge(layer);


        var paths = layer
            .selectAll('path')
            .data([geojson]);

        paths.exit()
            .remove();

        paths = paths.enter()
            .append('path')
            .attr('class', 'gpx')
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
            .attr('class', 'gpx')
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


    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }


    drawGpx.showLabels = function(_) {
        if (!arguments.length) return showLabels;
        showLabels = _;
        return this;
    };


    drawGpx.enabled = function(_) {
        if (!arguments.length) return svgGpx.enabled;
        svgGpx.enabled = _;
        dispatch.call('change');
        return this;
    };


    drawGpx.hasGpx = function() {
        var geojson = svgGpx.geojson;
        return (!(_.isEmpty(geojson) || _.isEmpty(geojson.features)));
    };


    drawGpx.geojson = function(gj) {
        if (!arguments.length) return svgGpx.geojson;
        if (_.isEmpty(gj) || _.isEmpty(gj.features)) return this;
        svgGpx.geojson = gj;
        dispatch.call('change');
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
        if (!fileList.length) return this;
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
        var geojson = svgGpx.geojson;

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
    return drawGpx;
}
