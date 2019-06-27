import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';

import { modeBrowse } from '../modes/browse';
import { services } from '../services';

var _taskingEnabled = false;
var _taskingService;
var _taskingVisible;

export function svgTasking(projection, context, dispatch) {
  var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
  var minZoom = 12;
  var touchLayer = d3_select(null);
  var drawLayer = d3_select(null);
  var _taskingVisible = false;
  var _customUrl;


  // Loosely-coupled tasking service for fetching errors.
    function getService() {
        if (services.tasking && !_taskingService) {
            _taskingService = services.tasking;
            _taskingService.on('loaded', throttledRedraw);
        } else if (!services.tasking && _taskingService) {
            _taskingService = null;
        }

        return _taskingService;
    }

    // Show the notes
    function editOn() {
        if (!_taskingVisible) {
            _taskingVisible = true;
            drawLayer
                .style('display', 'block');
        }
    }


    // Immediately remove the notes and their touch targets
    function editOff() {
        if (_taskingVisible) {
            _taskingVisible = false;
            drawLayer
                .style('display', 'none');
            drawLayer.selectAll('.note')
                .remove();
            touchLayer.selectAll('.note')
                .remove();
        }
    }

    // Enable the layer.  This shows the task(s) and transitions them to visible.
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


    // Disable the layer.  This transitions the layer invisible and then hides the task(s).
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

    function drawTasking(selection) {
    var service = getService();

    // var surface = context.surface();
    // if (surface && !surface.empty()) {
    //     touchLayer = surface.selectAll('.data-layer.touch .layer-touch.markers');
    // }

    // drawLayer = selection.selectAll('.layer-keepRight')
    //     .data(service ? [0] : []);

    // drawLayer.exit()
    //     .remove();

    // drawLayer = drawLayer.enter()
    //     .append('g')
    //     .attr('class', 'layer-keepRight')
    //     .style('display', _keepRightEnabled ? 'block' : 'none')
    //     .merge(drawLayer);

    // if (_keepRightEnabled) {
    //     if (service && ~~context.map().zoom() >= minZoom) {
    //         editOn();
    //         service.loadErrors(projection);
    //         updateMarkers();
    //     } else {
    //         editOff();
    //     }
    // }
    }


    // Toggles the layer on and off
    drawTasking.enabled = function(val) {
        if (!arguments.length) return _taskingEnabled;

        _taskingEnabled = val;
        if (_taskingEnabled) {
            layerOn();
        } else {
            layerOff();
            if (context.selectedErrorID()) {
                context.enter(modeBrowse(context));
            }
        }

        dispatch.call('change');
        return this;
    };


    drawTasking.supported = function() {
        return !!getService();
    };

    return drawTasking;
}