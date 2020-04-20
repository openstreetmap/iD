import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { svgData } from './data';
import { svgDebug } from './debug';
import { svgGeolocate } from './geolocate';
import { svgKeepRight } from './keepRight';
import { svgImproveOSM } from './improveOSM';
import { svgOsmose } from './osmose';
import { svgStreetside } from './streetside';
import { svgMapillaryImages } from './mapillary_images';
import { svgMapillarySigns } from './mapillary_signs';
import { svgMapillaryMapFeatures } from './mapillary_map_features';
import { svgOpenstreetcamImages } from './openstreetcam_images';
import { svgOsm } from './osm';
import { svgNotes } from './notes';
import { svgTouch } from './touch';
import { utilArrayDifference, utilRebind } from '../util';
import { utilGetDimensions, utilSetDimensions } from '../util/dimensions';


export function svgLayers(projection, context) {
    var dispatch = d3_dispatch('change');
    var svg = d3_select(null);
    var _layers = [
        { id: 'osm', layer: svgOsm(projection, context, dispatch) },
        { id: 'notes', layer: svgNotes(projection, context, dispatch) },
        { id: 'data', layer: svgData(projection, context, dispatch) },
        { id: 'keepRight', layer: svgKeepRight(projection, context, dispatch) },
        { id: 'improveOSM', layer: svgImproveOSM(projection, context, dispatch) },
        { id: 'osmose', layer: svgOsmose(projection, context, dispatch) },
        { id: 'streetside', layer: svgStreetside(projection, context, dispatch)},
        { id: 'mapillary', layer: svgMapillaryImages(projection, context, dispatch) },
        { id: 'mapillary-map-features',  layer: svgMapillaryMapFeatures(projection, context, dispatch) },
        { id: 'mapillary-signs',  layer: svgMapillarySigns(projection, context, dispatch) },
        { id: 'openstreetcam', layer: svgOpenstreetcamImages(projection, context, dispatch) },
        { id: 'debug', layer: svgDebug(projection, context, dispatch) },
        { id: 'geolocate', layer: svgGeolocate(projection, context, dispatch) },
        { id: 'touch', layer: svgTouch(projection, context, dispatch) }
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
            .data(_layers);

        groups.exit()
            .remove();

        groups.enter()
            .append('g')
            .attr('class', function(d) { return 'data-layer ' + d.id; })
            .merge(groups)
            .each(function(d) { d3_select(this).call(d.layer); });
    }


    drawLayers.all = function() {
        return _layers;
    };


    drawLayers.layer = function(id) {
        var obj = _layers.find(function(o) { return o.id === id; });
        return obj && obj.layer;
    };


    drawLayers.only = function(what) {
        var arr = [].concat(what);
        var all = _layers.map(function(layer) { return layer.id; });
        return drawLayers.remove(utilArrayDifference(all, arr));
    };


    drawLayers.remove = function(what) {
        var arr = [].concat(what);
        arr.forEach(function(id) {
            _layers = _layers.filter(function(o) { return o.id !== id; });
        });
        dispatch.call('change');
        return this;
    };


    drawLayers.add = function(what) {
        var arr = [].concat(what);
        arr.forEach(function(obj) {
            if ('id' in obj && 'layer' in obj) {
                _layers.push(obj);
            }
        });
        dispatch.call('change');
        return this;
    };


    drawLayers.dimensions = function(val) {
        if (!arguments.length) return utilGetDimensions(svg);
        utilSetDimensions(svg, val);
        return this;
    };


    return utilRebind(drawLayers, dispatch, 'on');
}
