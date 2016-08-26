import * as d3 from 'd3';
import _ from 'lodash';
import { rebind } from '../util/rebind';
import { getDimensions, setDimensions } from '../util/dimensions';
import { Debug } from './debug';
import { Gpx } from './gpx';
import { MapillaryImages } from './mapillary_images';
import { MapillarySigns } from './mapillary_signs';
import { Osm } from './osm';

export function Layers(projection, context) {
    var dispatch = d3.dispatch('change'),
        svg = d3.select(null),
        layers = [
            { id: 'osm', layer: Osm(projection, context, dispatch) },
            { id: 'gpx', layer: Gpx(projection, context, dispatch) },
            { id: 'mapillary-images', layer: MapillaryImages(projection, context, dispatch) },
            { id: 'mapillary-signs',  layer: MapillarySigns(projection, context, dispatch) },
            { id: 'debug', layer: Debug(projection, context, dispatch) }
        ];


    function drawLayers(selection) {
        svg = selection.selectAll('.surface')
            .data([0]);

        svg.enter()
            .append('svg')
            .attr('class', 'surface')
            .append('defs');

        var groups = svg.selectAll('.data-layer')
            .data(layers);

        groups.enter()
            .append('g')
            .attr('class', function(d) { return 'data-layer data-layer-' + d.id; });

        groups
            .each(function(d) { d3.select(this).call(d.layer); });

        groups.exit()
            .remove();
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
        if (!arguments.length) return getDimensions(svg);
        setDimensions(svg, _);
        layers.forEach(function(obj) {
            if (obj.layer.dimensions) {
                obj.layer.dimensions(_);
            }
        });
        return this;
    };


    return rebind(drawLayers, dispatch, 'on');
}
