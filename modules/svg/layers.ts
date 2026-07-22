import { dispatch as d3_dispatch, type Dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { svgData } from './data';
import { svgLocalPhotos} from './local_photos';
import { svgDebug } from './debug';
import { svgGeolocate } from './geolocate';
import { svgOsmose } from './osmose';
import { svgStreetside } from './streetside';
import { svgVegbilder} from './vegbilder';
import { svgMapillaryImages } from './mapillary_images';
import { svgMapillaryPosition } from './mapillary_position';
import { svgMapillarySigns } from './mapillary_signs';
import { svgMapillaryMapFeatures } from './mapillary_map_features';
import { svgKartaviewImages } from './kartaview_images';
import { svgMapilioImages } from './mapilio_images';
import { svgPanoramaxImages } from './panoramax_images';
import { svgOsm } from './osm';
import { svgNotes } from './notes';
import { svgTouch } from './touch';
import { utilArrayDifference, utilRebind } from '../util';
import { utilGetDimensions, utilSetDimensions } from '../util/dimensions';
import type { Projection } from '../geo/raw_mercator';
import type { Vec2 } from '../geo/vector';

export type LayerDispatch = Dispatch<object, {
    change: [];
    photoDatesChanged: [];
}>

export interface SvgLayer {
    (selection: d3.Selection<SVGGElement>): void;
    enabled?(position: GeolocationPosition | boolean, enabled: boolean): boolean | SvgLayer;
}

export interface SvgLayerItem {
    id: string;
    layer: SvgLayer;
}


export function svgLayers(projection: Projection, context: iD.Context) {
    var dispatch = d3_dispatch('change', 'photoDatesChanged');
    var svg = d3_select<SVGSVGElement, 0>(null!);
    var _layers: SvgLayerItem[] = [
        { id: 'osm', layer: svgOsm(projection, context, dispatch) },
        { id: 'notes', layer: svgNotes(projection, context, dispatch) },
        { id: 'data', layer: svgData(projection, context, dispatch) },
        { id: 'osmose', layer: svgOsmose(projection, context, dispatch) },
        { id: 'streetside', layer: svgStreetside(projection, context, dispatch)},
        { id: 'mapillary', layer: svgMapillaryImages(projection, context, dispatch) },
        { id: 'mapillary-position', layer: svgMapillaryPosition(projection, context) },
        { id: 'mapillary-map-features',  layer: svgMapillaryMapFeatures(projection, context, dispatch) },
        { id: 'mapillary-signs',  layer: svgMapillarySigns(projection, context, dispatch) },
        { id: 'kartaview', layer: svgKartaviewImages(projection, context, dispatch) },
        { id: 'mapilio', layer: svgMapilioImages(projection, context, dispatch) },
        { id: 'vegbilder', layer: svgVegbilder(projection, context, dispatch) },
        { id: 'panoramax', layer: svgPanoramaxImages(projection, context, dispatch) },
        { id: 'local-photos', layer: svgLocalPhotos(projection, context, dispatch) },
        { id: 'debug', layer: svgDebug(projection, context) },
        { id: 'geolocate', layer: svgGeolocate(projection) },
        { id: 'touch', layer: svgTouch() },
    ];


    function drawLayers(selection: d3.Selection) {
        svg = selection.selectAll<SVGSVGElement, 0>('.surface')
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

        var groups = svg.selectAll<SVGGElement, SvgLayerItem>('.data-layer')
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


    drawLayers.layer = function(id: string) {
        var obj = _layers.find(function(o) { return o.id === id; });
        return obj && obj.layer;
    };


    drawLayers.only = function(what: string[]) {
        var arr = [...what];
        var all = _layers.map(function(layer) { return layer.id; });
        return drawLayers.remove(utilArrayDifference(all, arr));
    };


    drawLayers.remove = function(what: string[]) {
        var arr = [...what];
        arr.forEach(function(id) {
            _layers = _layers.filter(function(o) { return o.id !== id; });
        });
        dispatch.call('change');
        return this;
    };


    drawLayers.add = function(what: SvgLayerItem[]) {
        var arr = [...what];
        arr.forEach(function(obj) {
            if ('id' in obj && 'layer' in obj) {
                _layers.push(obj);
            }
        });
        dispatch.call('change');
        return this;
    };


    drawLayers.dimensions = function(val: Vec2) {
        if (!arguments.length) return utilGetDimensions(svg);
        utilSetDimensions(svg, val);
        return this;
    };


    return utilRebind(drawLayers, dispatch, 'on');
}
