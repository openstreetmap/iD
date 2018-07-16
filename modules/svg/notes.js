import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';

import { svgPointTransform } from './index';
import { services } from '../services';


export function svgNotes(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
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


    function update() {
        var service = getService();
        var selectedID = context.selectedNoteID();
        var data = (service ? service.notes(projection) : []);
        var transform = svgPointTransform(projection);
        var notes = layer.selectAll('.note')
            .data(data, function(d) { return d.status + d.id; });

        // exit
        notes.exit()
            .remove();

        // enter
        var notesEnter = notes.enter()
            .append('g')
            .attr('class', function(d) { return 'note note-' + d.id + ' ' + d.status; });

        // notesEnter
        //     .append('use')
        //     .attr('class', 'note-shadow')
        //     .attr('width', '24px')
        //     .attr('height', '24px')
        //     .attr('x', '-12px')
        //     .attr('y', '-24px')
        //     .attr('xlink:href', '#iD-icon-note');

        notesEnter
            .append('use')
            .attr('class', 'note-fill')
            .attr('width', '20px')
            .attr('height', '20px')
            .attr('x', '-10px')
            .attr('y', '-22px')
            .attr('xlink:href', '#iD-icon-note');

        // add dots if there's a comment thread
        notesEnter.selectAll('.note-annotation')
            .data(function(d) { return d.comments.length > 1 ? [0] : []; })
            .enter()
            .append('use')
            .attr('class', 'note-annotation thread')
            .attr('width', '14px')
            .attr('height', '14px')
            .attr('x', '-7px')
            .attr('y', '-20px')
            .attr('xlink:href', '#iD-icon-more');

        // update
        notes
            .merge(notesEnter)
            .sort(function(a, b) {
                return (a.id === selectedID) ? 1
                    : (b.id === selectedID) ? -1
                    : b.loc[1] - a.loc[1];  // sort Y
            })
            .classed('selected', function(d) { return d.id === selectedID; })
            .attr('transform', transform);
    }


    function drawNotes(selection) {
        var enabled = svgNotes.enabled;
        var service = getService();

        layer = selection.selectAll('.layer-notes')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        layer.enter()
            .append('g')
            .attr('class', 'layer-notes')
            .style('display', enabled ? 'block' : 'none')
            .merge(layer);

        function dimensions() {
            return [window.innerWidth, window.innerHeight];
        }

        if (enabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                service.loadNotes(projection, dimensions());
                update();
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
