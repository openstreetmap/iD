import * as d3 from 'd3';
import _ from 'lodash';
import { services } from '../services/index';


export function svgMapillarySigns(projection, context, dispatch) {
    var throttledRedraw = _.throttle(function () { dispatch.call('change'); }, 1000),
        minZoom = 12,
        layer = d3.select(null),
        _mapillary;


    function init() {
        if (svgMapillarySigns.initialized) return;  // run once
        svgMapillarySigns.enabled = false;
        svgMapillarySigns.initialized = true;
    }


    function getMapillary() {
        if (services.mapillary && !_mapillary) {
            _mapillary = services.mapillary;
            _mapillary.event.on('loadedSigns', throttledRedraw);
        } else if (!services.mapillary && _mapillary) {
            _mapillary = null;
        }
        return _mapillary;
    }


    function showLayer() {
        editOn();
    }


    function hideLayer() {
        throttledRedraw.cancel();
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

        var selected = mapillary.selectedImage(),
            imageKey;

        // Pick one of the images the sign was detected in,
        // preference given to an image already selected.
        d.detections.forEach(function(detection) {
            if (!imageKey || selected === detection.image_key) {
                imageKey = detection.image_key;
            }
        });

        mapillary
            .selectedImage(imageKey, true)
            .updateViewer(imageKey, context)
            .showViewer();
    }


    function update() {
        var mapillary = getMapillary(),
            data = (mapillary ? mapillary.signs(projection) : []),
            imageKey = mapillary ? mapillary.selectedImage() : null;

        var signs = layer.selectAll('.icon-sign')
            .data(data, function(d) { return d.key; });

        signs.exit()
            .remove();

        var enter = signs.enter()
            .append('foreignObject')
            .attr('class', 'icon-sign')
            .attr('width', '24px')      // for Firefox
            .attr('height', '24px')     // for Firefox
            .classed('selected', function(d) {
                return _.some(d.detections, function(detection) {
                    return detection.image_key === imageKey;
                });
            })
            .on('click', click);

        enter
            .append('xhtml:body')
            .attr('class', 'icon-sign-body')
            .html(mapillary.signHTML);

        signs
            .merge(enter)
            .attr('x', function(d) { return projection(d.loc)[0] - 12; })   // offset by -12px to
            .attr('y', function(d) { return projection(d.loc)[1] - 12; });  // center signs on loc
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
            .merge(layer);

        if (enabled) {
            if (mapillary && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                mapillary.loadSigns(context, projection);
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


    init();
    return drawSigns;
}
