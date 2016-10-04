import * as d3 from 'd3';
import _ from 'lodash';
import { utilGetDimensions, utilSetDimensions } from '../util/dimensions';
import { svgPointTransform } from './point_transform';
import { serviceMapillary } from '../services/index';


export function svgMapillarySigns(projection, context, dispatch) {
    var debouncedRedraw = _.debounce(function () { dispatch.call('change'); }, 1000),
        minZoom = 12,
        layer = d3.select(null),
        _mapillary;


    function init() {
        if (svgMapillarySigns.initialized) return;  // run once
        svgMapillarySigns.enabled = false;
        svgMapillarySigns.initialized = true;
    }


    function getMapillary() {
        if (serviceMapillary && !_mapillary) {
            _mapillary = serviceMapillary.init();
            _mapillary.event.on('loadedSigns', debouncedRedraw);
        } else if (!serviceMapillary && _mapillary) {
            _mapillary = null;
        }
        return _mapillary;
    }


    function showLayer() {
        editOn();
        debouncedRedraw();
    }


    function hideLayer() {
        debouncedRedraw.cancel();
        editOff();
    }


    function editOn() {
        layer.style('display', 'block');
    }


    function editOff() {
        layer.selectAll('.icon-sign').remove();
        layer.style('display', 'none');
    }


    function click(d) {
        var mapillary = getMapillary();
        if (!mapillary) return;

        context.map().centerEase(d.loc);

        mapillary
            .setSelectedImage(d.key, true)
            .updateViewer(d.key, context)
            .showViewer();
    }


    function update() {
        var mapillary = getMapillary(),
            data = (mapillary ? mapillary.signs(projection, utilGetDimensions(layer)) : []),
            imageKey = mapillary ? mapillary.getSelectedImage() : null;

        var signs = layer.selectAll('.icon-sign')
            .data(data, function(d) { return d.key; });

        signs.exit()
            .remove();

        var enter = signs.enter()
            .append('foreignObject')
            .attr('class', 'icon-sign')
            .attr('width', '32px')      // for Firefox
            .attr('height', '32px')     // for Firefox
            .classed('selected', function(d) { return d.key === imageKey; })
            .on('click', click);

        enter
            .append('xhtml:body')
            .html(mapillary.signHTML);

        signs
            .merge(enter)
            .attr('transform', svgPointTransform(projection));
    }


    function drawSigns(selection) {
        var enabled = svgMapillarySigns.enabled,
            mapillary = getMapillary();

        layer = selection.selectAll('.layer-mapillary-signs')
            .data(mapillary ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-mapillary-signs')
            .style('display', enabled ? 'block' : 'none')
            .attr('transform', 'translate(-16, -16)')  // center signs on loc
            .merge(layer);

        if (enabled) {
            if (mapillary && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                mapillary.loadSigns(context, projection, utilGetDimensions(layer));
            } else {
                editOff();
            }
        }
    }


    drawSigns.enabled = function(_) {
        if (!arguments.length) return svgMapillarySigns.enabled;
        svgMapillarySigns.enabled = _;
        if (svgMapillarySigns.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };


    drawSigns.supported = function() {
        var mapillary = getMapillary();
        return (mapillary && mapillary.signsSupported());
    };


    drawSigns.dimensions = function(_) {
        if (!arguments.length) return utilGetDimensions(layer);
        utilSetDimensions(layer, _);
        return this;
    };

    init();
    return drawSigns;
}
