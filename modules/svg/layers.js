import * as d3 from 'd3';
import _ from 'lodash';
import { utilRebind } from '../util/rebind';
import { utilGetDimensions, utilSetDimensions } from '../util/dimensions';
import { svgDebug } from './debug';
import { svgGpx } from './gpx';
import { svgMapillaryImages } from './mapillary_images';
import { svgMapillarySigns } from './mapillary_signs';
import { svgOsm } from './osm';


export function svgLayers(projection, context) {
    var dispatch = d3.dispatch('change'),
        svg = d3.select(null),
        layers = [
            { id: 'osm', layer: svgOsm(projection, context, dispatch) },
            { id: 'gpx', layer: svgGpx(projection, context, dispatch) },
            { id: 'mapillary-images', layer: svgMapillaryImages(projection, context, dispatch) },
            { id: 'mapillary-signs',  layer: svgMapillarySigns(projection, context, dispatch) },
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
            .each(function(d) { d3.select(this).call(d.layer); });
    }


    drawLayers.all = function() {
        return layers;
    };


    drawLayers.layer = function(id) {
        var obj = _.find(layers, function(o) {return o.id === id;});
        return obj && obj.layer;
    };


    drawLayers.only = function(what) {
        var arr = [].concat(what);
        drawLayers.remove(_.difference(_.map(layers, 'id'), arr));
        return this;
    };


    drawLayers.remove = function(what) {
        var arr = [].concat(what);
        arr.forEach(function(id) {
            layers = _.reject(layers, function(o) {return o.id === id;});
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
