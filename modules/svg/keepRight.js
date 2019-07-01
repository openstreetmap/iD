import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';

import { modeBrowse } from '../modes/browse';
import { svgPointTransform } from './helpers';
import { services } from '../services';

var _keepRightEnabled = false;
var _keepRightService;


export function svgKeepRight(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var touchLayer = d3_select(null);
    var drawLayer = d3_select(null);
    var _keepRightVisible = false;


    function markerPath(selection, klass) {
        selection
            .attr('class', klass)
            .attr('transform', 'translate(-4, -24)')
            .attr('d', 'M11.6,6.2H7.1l1.4-5.1C8.6,0.6,8.1,0,7.5,0H2.2C1.7,0,1.3,0.3,1.3,0.8L0,10.2c-0.1,0.6,0.4,1.1,0.9,1.1h4.6l-1.8,7.6C3.6,19.4,4.1,20,4.7,20c0.3,0,0.6-0.2,0.8-0.5l6.9-11.9C12.7,7,12.3,6.2,11.6,6.2z');
    }


    // Loosely-coupled keepRight service for fetching errors.
    function getService() {
        if (services.keepRight && !_keepRightService) {
            _keepRightService = services.keepRight;
            _keepRightService.on('loaded', throttledRedraw);
        } else if (!services.keepRight && _keepRightService) {
            _keepRightService = null;
        }

        return _keepRightService;
    }


    // Show the errors
    function editOn() {
        if (!_keepRightVisible) {
            _keepRightVisible = true;
            drawLayer
                .style('display', 'block');
        }
    }


    // Immediately remove the errors and their touch targets
    function editOff() {
        if (_keepRightVisible) {
            _keepRightVisible = false;
            drawLayer
                .style('display', 'none');
            drawLayer.selectAll('.qa_error.keepRight')
                .remove();
            touchLayer.selectAll('.qa_error.keepRight')
                .remove();
        }
    }


    // Enable the layer.  This shows the errors and transitions them to visible.
    function layerOn() {
        editOn();

        drawLayer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end interrupt', function () {
                dispatch.call('change');
            });
    }


    // Disable the layer.  This transitions the layer invisible and then hides the errors.
    function layerOff() {
        throttledRedraw.cancel();
        drawLayer.interrupt();
        touchLayer.selectAll('.qa_error.keepRight')
            .remove();

        drawLayer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end interrupt', function () {
                editOff();
                dispatch.call('change');
            });
    }


    // Update the error markers
    function updateMarkers() {
        if (!_keepRightVisible || !_keepRightEnabled) return;

        var service = getService();
        var selectedID = context.mode() && context.mode().selectedErrorID && context.mode().selectedErrorID();
        var data = (service ? service.getErrors(projection) : []);
        var getTransform = svgPointTransform(projection);

        // Draw markers..
        var markers = drawLayer.selectAll('.qa_error.keepRight')
            .data(data, function(d) { return d.id; });

        // exit
        markers.exit()
            .remove();

        // enter
        var markersEnter = markers.enter()
            .append('g')
            .attr('class', function(d) {
                return [
                    'qa_error',
                    d.service,
                    'error_id-' + d.id,
                    'error_type-' + d.parent_error_type
                ].join(' ');
            });

        markersEnter
            .append('ellipse')
            .attr('cx', 0.5)
            .attr('cy', 1)
            .attr('rx', 6.5)
            .attr('ry', 3)
            .attr('class', 'stroke');

        markersEnter
            .append('path')
            .call(markerPath, 'shadow');

        markersEnter
            .append('use')
            .attr('class', 'qa_error-fill')
            .attr('width', '20px')
            .attr('height', '20px')
            .attr('x', '-8px')
            .attr('y', '-22px')
            .attr('xlink:href', '#iD-icon-bolt');

        // update
        markers
            .merge(markersEnter)
            .sort(sortY)
            .classed('selected', function(d) { return d.id === selectedID; })
            .attr('transform', getTransform);


        // Draw targets..
        if (touchLayer.empty()) return;
        var fillClass = context.getDebug('target') ? 'pink ' : 'nocolor ';

        var targets = touchLayer.selectAll('.qa_error.keepRight')
            .data(data, function(d) { return d.id; });

        // exit
        targets.exit()
            .remove();

        // enter/update
        targets.enter()
            .append('rect')
            .attr('width', '20px')
            .attr('height', '20px')
            .attr('x', '-8px')
            .attr('y', '-22px')
            .merge(targets)
            .sort(sortY)
            .attr('class', function(d) {
                return 'qa_error ' + d.service + ' target error_id-' + d.id + ' ' + fillClass;
            })
            .attr('transform', getTransform);


        function sortY(a, b) {
            return (a.id === selectedID) ? 1
                : (b.id === selectedID) ? -1
                : (a.severity === 'error' && b.severity !== 'error') ? 1
                : (b.severity === 'error' && a.severity !== 'error') ? -1
                : b.loc[1] - a.loc[1];
        }
    }


    // Draw the keepRight layer and schedule loading errors and updating markers.
    function drawKeepRight(selection) {
        var service = getService();

        var surface = context.surface();
        if (surface && !surface.empty()) {
            touchLayer = surface.selectAll('.data-layer.touch .layer-touch.markers');
        }

        drawLayer = selection.selectAll('.layer-keepRight')
            .data(service ? [0] : []);

        drawLayer.exit()
            .remove();

        drawLayer = drawLayer.enter()
            .append('g')
            .attr('class', 'layer-keepRight')
            .style('display', _keepRightEnabled ? 'block' : 'none')
            .merge(drawLayer);

        if (_keepRightEnabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                service.loadErrors(projection);
                updateMarkers();
            } else {
                editOff();
            }
        }
    }


    // Toggles the layer on and off
    drawKeepRight.enabled = function(val) {
        if (!arguments.length) return _keepRightEnabled;

        _keepRightEnabled = val;
        if (_keepRightEnabled) {
            layerOn();
        } else {
            layerOff();
            if (context.mode().id === 'select-error') {
                context.enter(modeBrowse(context));
            }
        }

        dispatch.call('change');
        return this;
    };


    drawKeepRight.supported = function() {
        return !!getService();
    };


    return drawKeepRight;
}
