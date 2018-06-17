
import _difference from 'lodash-es/difference';
import _find from 'lodash-es/find';
import _map from 'lodash-es/map';
import _reject from 'lodash-es/reject';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { svgDebug } from './debug';
import { svgGpx } from './gpx';
import { svgStreetside } from './streetside';
import { svgMvt } from './mvt';
import { svgMapillaryImages } from './mapillary_images';
import { svgMapillarySigns } from './mapillary_signs';
import { svgOpenstreetcamImages } from './openstreetcam_images';
import { svgOsm } from './osm';
import { utilRebind } from '../util/rebind';
import { utilGetDimensions, utilSetDimensions } from '../util/dimensions';


export function svgLayers(projection, context) {
    var dispatch = d3_dispatch('change');
    var svg = d3_select(null);
    var layers = [
        { id: 'osm', layer: svgOsm(projection, context, dispatch) },
        { id: 'gpx', layer: svgGpx(projection, context, dispatch) },
        { id: 'mvt', layer: svgMvt(projection, context, dispatch) },
        { id: 'streetside', layer: svgStreetside(projection, context, dispatch)},
        { id: 'mapillary-images', layer: svgMapillaryImages(projection, context, dispatch) },
        { id: 'mapillary-signs',  layer: svgMapillarySigns(projection, context, dispatch) },
        { id: 'openstreetcam-images', layer: svgOpenstreetcamImages(projection, context, dispatch) },
        { id: 'debug', layer: svgDebug(projection, context, dispatch) }
    ];


    function drawLayers(selection) {
        svg = selection.selectAll('.surface')
            .data([0]);

        svg = svg.enter()
            .append('svg')
            .attr('class', 'surface')
            .merge(svg);

        var defs = svg.selectAll('.surface-defs')
            .data([0]);

        defs.enter()
            .append('defs')
            .attr('class', 'surface-defs');

        var groups = svg.selectAll('.data-layer')
            .data(layers);

        groups.exit()
            .remove();

        groups.enter()
            .append('g')
            .attr('class', function(d) { return 'data-layer data-layer-' + d.id; })
            .merge(groups)
            .each(function(d) { d3_select(this).call(d.layer); });
    }


    drawLayers.all = function() {
        return layers;
    };


    drawLayers.layer = function(id) {
        var obj = _find(layers, function(o) {return o.id === id;});
        return obj && obj.layer;
    };


    drawLayers.only = function(what) {
        var arr = [].concat(what);
        drawLayers.remove(_difference(_map(layers, 'id'), arr));
        return this;
    };


    drawLayers.remove = function(what) {
        var arr = [].concat(what);
        arr.forEach(function(id) {
            layers = _reject(layers, function(o) {return o.id === id;});
        });
        dispatch.call('change');
        return this;
    };


    drawLayers.add = function(what) {
        var arr = [].concat(what);
        arr.forEach(function(obj) {
            if ('id' in obj && 'layer' in obj) {
                layers.push(obj);
            }
        });
        dispatch.call('change');
        return this;
    };


    drawLayers.dimensions = function(_) {
        if (!arguments.length) return utilGetDimensions(svg);
        utilSetDimensions(svg, _);
        return this;
    };


    return utilRebind(drawLayers, dispatch, 'on');
}
