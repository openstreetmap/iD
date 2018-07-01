import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './index';
import { services } from '../services';

import { uiNoteEditor } from '../ui';

export function svgNotes(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var layer = d3_select(null);
    var _notes;
    var _selected;

    var noteEditor = uiNoteEditor(context);

    function init() {
        if (svgNotes.initialized) return;  // run once
        svgNotes.enabled = false;
        svgNotes.initialized = true;
    }

    function editOn() {
        layer.style('display', 'block');
    }


    function editOff() {
        layer.selectAll('.note').remove();
        layer.style('display', 'none');
    }

    function getService() {
        if (services.osm && !_notes) {
            _notes = services.osm;
            _notes.on('loadedNotes', throttledRedraw);
        } else if (!services.osm && _notes) {
            _notes = null;
        }

        return _notes;
    }

    function showLayer() {
        editOn();

        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });
    }

    function hideLayer() {
        throttledRedraw.cancel();

        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end', editOff);
    }


    function click(which) {
        _selected = which;
        context.map().centerEase(which.loc);

        layer.selectAll('.note')
            .classed('selected', function(d) { return d === _selected; });

        context.ui().sidebar.show(noteEditor, which);
    }


    function mouseover(which) {
        layer.selectAll('.note')
            .classed('hovered', function(d) { return d === which; });

        context.ui().sidebar.show(noteEditor, which);
    }


    function mouseout() {
        layer.selectAll('.note')
            .classed('hovered', false);

        // TODO: check if the item was clicked. If so, it should remain on the sidebar.
        // TODO: handle multi-clicks. Otherwise, utilize behavior/select.js
        context.ui().sidebar.hide();
    }


    function update() {
        var service = getService();
        var data = (service ? service.notes(projection) : []);
        var transform = svgPointTransform(projection);
        var notes = layer.selectAll('.note')
            .data(data, function(d) { return d.key; });

        // exit
        notes.exit()
            .remove();

        // enter
        var notesEnter = notes.enter()
            .append('g')
            .attr('class', function(d) { return 'note note-' + d.id + ' ' + d.status; })
            .on('click', click)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

        notesEnter
            .append('use')
            .attr('class', 'note-shadow')
            .attr('width', '24px')
            .attr('height', '24px')
            .attr('x', '-12px')
            .attr('y', '-24px')
            .attr('xlink:href', '#fas-comment-alt');

        notesEnter
            .append('use')
            .attr('class', 'note-fill')
            .attr('width', '20px')
            .attr('height', '20px')
            .attr('x', '-10px')
            .attr('y', '-22px')
            .attr('xlink:href', '#fas-comment-alt');

        // update
        notes
            .merge(notesEnter)
            .sort(function(a, b) {
                return (a === _selected) ? 1
                    : (b === _selected) ? -1
                    : b.loc[1] - a.loc[1];  // sort Y
            })
            .classed('selected', function(d) { return d === _selected; })
            .attr('transform', transform);
    }


    function drawNotes(selection) {
        var enabled = svgNotes.enabled;
        var service = getService();

        function dimensions() {
            return [window.innerWidth, window.innerHeight];
        }

        layer = selection.selectAll('.layer-notes')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        layer.enter()
            .append('g')
            .attr('class', 'layer-notes')
            .style('display', enabled ? 'block' : 'none')
            .merge(layer);

        if (enabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                service.loadNotes(projection, dimensions());
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
