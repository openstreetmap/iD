import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { services } from '../services';

export function svgNotes(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var minMarkerZoom = 16;
    var minViewfieldZoom = 18;
    var layer = d3_select(null);
    var _notes;

    function init() {
        if (svgNotes.initialized) return;  // run once
        svgNotes.enabled = false;
        svgNotes.initialized = true;
    }

    function editOn() {
        layer.style('display', 'block');
    }


    function editOff() {
        layer.selectAll('.viewfield-group').remove();
        layer.style('display', 'none');
    }

    function getService() {
        if (services.notes && !_notes) {
            _notes = services.notes;
            _notes.event.on('loadedNotes', throttledRedraw);
        } else if (!services.notes && _notes) {
            _notes = null;
        }

        return _notes;
    }

    function showLayer() {
        var service = getService();
        if (!service) return;

        // service.loadViewer(context);
        editOn();

        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });
    }

    function hideLayer() {
        var service = getService();
        if (service) {
            // service.hideViewer();
        }

        throttledRedraw.cancel();

        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end', editOff);
    }

    function drawNotes(selection) {
        var enabled = svgNotes.enabled,
            service = getService();

        layer = selection.selectAll('.layer-notes')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        var layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-notes')
            .style('display', enabled ? 'block' : 'none');

        // layerEnter
        //     .append('g')
        //     .attr('class', 'sequences');

        layerEnter
            .append('g')
            .attr('class', 'notes');

        layer = layerEnter
            .merge(layer);

        if (enabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                // update();
                service.loadNotes(projection);
            } else {
                editOff();
            }
        }
    }

    drawNotes.enabled = function(_) {
        if (!arguments.length) return svgNotes.enabled;
        svgNotes.enabled = _;
        if (svgNotes.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };

    init();
    return drawNotes;
}