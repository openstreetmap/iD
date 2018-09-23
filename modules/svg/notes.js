import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { dispatch as d3_dispatch } from 'd3-dispatch';

import { modeBrowse } from '../modes';
import { svgPointTransform } from './index';
import { services } from '../services';


export function svgNotes(projection, context, dispatch) {
    if (!dispatch) { dispatch = d3_dispatch('change'); }
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var layer = d3_select(null);
    var _notes;

    function markerPath(selection, klass) {
        selection
            .attr('class', klass)
            .attr('transform', 'translate(-8, -22)')
            .attr('d', 'm17.5,0l-15,0c-1.37,0 -2.5,1.12 -2.5,2.5l0,11.25c0,1.37 1.12,2.5 2.5,2.5l3.75,0l0,3.28c0,0.38 0.43,0.6 0.75,0.37l4.87,-3.65l5.62,0c1.37,0 2.5,-1.12 2.5,-2.5l0,-11.25c0,-1.37 -1.12,-2.5 -2.5,-2.5z');
    }

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
            .classed('disabled', false)
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end interrupt', function () {
                dispatch.call('change');
            });
    }


    function hideLayer() {
        editOff();

        throttledRedraw.cancel();
        layer.interrupt();

        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end interrupt', function () {
                layer.classed('disabled', true);
                dispatch.call('change');
            });

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
            .attr('class', function(d) { return 'note note-' + d.id + ' ' + d.status; })
            .classed('new', function(d) { return d.id < 0; });

        notesEnter
            .append('ellipse')
            .attr('cx', 0.5)
            .attr('cy', 1)
            .attr('rx', 6.5)
            .attr('ry', 3)
            .attr('class', 'stroke');

        notesEnter
            .append('path')
            .call(markerPath, 'shadow');

        notesEnter
            .append('use')
            .attr('class', 'note-fill')
            .attr('width', '20px')
            .attr('height', '20px')
            .attr('x', '-8px')
            .attr('y', '-22px')
            .attr('xlink:href', '#iD-icon-note');

        notesEnter.selectAll('.note-annotation')
            .data(function(d) { return [d]; })
            .enter()
            .append('use')
            .attr('class', 'note-annotation')
            .attr('width', '10px')
            .attr('height', '10px')
            .attr('x', '-3px')
            .attr('y', '-19px')
            .attr('xlink:href', function(d) {
                return '#iD-icon-' + (d.id < 0 ? 'plus' : (d.status === 'open' ? 'close' : 'apply'));
            });

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

    drawNotes.enabled = function(val) {
        if (!arguments.length) return svgNotes.enabled;

        svgNotes.enabled = val;
        if (svgNotes.enabled) {
            showLayer();
        } else {
            hideLayer();
            if (context.selectedNoteID()) {
                context.enter(modeBrowse(context));
            }
        }

        dispatch.call('change');
        return this;
    };

    init();
    return drawNotes;
}
