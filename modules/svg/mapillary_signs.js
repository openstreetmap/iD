import * as d3 from 'd3';
import _ from 'lodash';
import { getDimensions, setDimensions } from '../util/dimensions';
import { PointTransform } from './point_transform';
import { mapillary as mapillaryService } from '../services/index';

export function MapillarySigns(projection, context, dispatch) {
    var debouncedRedraw = _.debounce(function () { dispatch.call("change"); }, 1000),
        minZoom = 12,
        layer = d3.select(null),
        _mapillary;

    function init() {
        if (MapillarySigns.initialized) return;  // run once
        MapillarySigns.enabled = false;
        MapillarySigns.initialized = true;
    }

    function getMapillary() {
        if (mapillaryService && !_mapillary) {
            _mapillary = mapillaryService.init();
            _mapillary.event.on('loadedSigns', debouncedRedraw);
        } else if (!mapillaryService && _mapillary) {
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
            data = (mapillary ? mapillary.signs(projection, getDimensions(layer)) : []),
            imageKey = mapillary ? mapillary.getSelectedImage() : null;

        var signs = layer.selectAll('.icon-sign')
            .data(data, function(d) { return d.key; });

        // Enter
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

        // Exit
        signs.exit()
            .remove();

        // Update
        signs
            .attr('transform', PointTransform(projection));
    }

    function drawSigns(selection) {
        var enabled = MapillarySigns.enabled,
            mapillary = getMapillary();

        layer = selection.selectAll('.layer-mapillary-signs')
            .data(mapillary ? [0] : []);

        layer.enter()
            .append('g')
            .attr('class', 'layer-mapillary-signs')
            .style('display', enabled ? 'block' : 'none')
            .attr('transform', 'translate(-16, -16)');  // center signs on loc

        layer.exit()
            .remove();

        if (enabled) {
            if (mapillary && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                mapillary.loadSigns(context, projection, getDimensions(layer));
            } else {
                editOff();
            }
        }
    }

    drawSigns.enabled = function(_) {
        if (!arguments.length) return MapillarySigns.enabled;
        MapillarySigns.enabled = _;
        if (MapillarySigns.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call("change");
        return this;
    };

    drawSigns.supported = function() {
        var mapillary = getMapillary();
        return (mapillary && mapillary.signsSupported());
    };

    drawSigns.dimensions = function(_) {
        if (!arguments.length) return getDimensions(layer);
        setDimensions(layer, _);
        return this;
    };

    init();
    return drawSigns;
}
