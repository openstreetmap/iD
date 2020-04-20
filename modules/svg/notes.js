import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { dispatch as d3_dispatch } from 'd3-dispatch';

import { modeBrowse } from '../modes/browse';
import { svgPointTransform } from './helpers';
import { services } from '../services';


var _notesEnabled = false;
var _osmService;


export function svgNotes(projection, context, dispatch) {
    if (!dispatch) { dispatch = d3_dispatch('change'); }
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var touchLayer = d3_select(null);
    var drawLayer = d3_select(null);
    var _notesVisible = false;


    function markerPath(selection, klass) {
        selection
            .attr('class', klass)
            .attr('transform', 'translate(-8, -22)')
            .attr('d', 'm17.5,0l-15,0c-1.37,0 -2.5,1.12 -2.5,2.5l0,11.25c0,1.37 1.12,2.5 2.5,2.5l3.75,0l0,3.28c0,0.38 0.43,0.6 0.75,0.37l4.87,-3.65l5.62,0c1.37,0 2.5,-1.12 2.5,-2.5l0,-11.25c0,-1.37 -1.12,-2.5 -2.5,-2.5z');
    }


    // Loosely-coupled osm service for fetching notes.
    function getService() {
        if (services.osm && !_osmService) {
            _osmService = services.osm;
            _osmService.on('loadedNotes', throttledRedraw);
        } else if (!services.osm && _osmService) {
            _osmService = null;
        }

        return _osmService;
    }


    // Show the notes
    function editOn() {
        if (!_notesVisible) {
            _notesVisible = true;
            drawLayer
                .style('display', 'block');
        }
    }


    // Immediately remove the notes and their touch targets
    function editOff() {
        if (_notesVisible) {
            _notesVisible = false;
            drawLayer
                .style('display', 'none');
            drawLayer.selectAll('.note')
                .remove();
            touchLayer.selectAll('.note')
                .remove();
        }
    }


    // Enable the layer.  This shows the notes and transitions them to visible.
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


    // Disable the layer.  This transitions the layer invisible and then hides the notes.
    function layerOff() {
        throttledRedraw.cancel();
        drawLayer.interrupt();
        touchLayer.selectAll('.note')
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


    // Update the note markers
    function updateMarkers() {
        if (!_notesVisible || !_notesEnabled) return;

        var service = getService();
        var selectedID = context.selectedNoteID();
        var data = (service ? service.notes(projection) : []);
        var getTransform = svgPointTransform(projection);

        // Draw markers..
        var notes = drawLayer.selectAll('.note')
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

        notesEnter.selectAll('.icon-annotation')
            .data(function(d) { return [d]; })
            .enter()
            .append('use')
            .attr('class', 'icon-annotation')
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
            .sort(sortY)
            .classed('selected', function(d) {
                var mode = context.mode();
                var isMoving = mode && mode.id === 'drag-note';  // no shadows when dragging
                return !isMoving && d.id === selectedID;
            })
            .attr('transform', getTransform);


        // Draw targets..
        if (touchLayer.empty()) return;
        var fillClass = context.getDebug('target') ? 'pink ' : 'nocolor ';

        var targets = touchLayer.selectAll('.note')
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
                var newClass = (d.id < 0 ? 'new' : '');
                return 'note target note-' + d.id + ' ' + fillClass + newClass;
            })
            .attr('transform', getTransform);


        function sortY(a, b) {
            return (a.id === selectedID) ? 1 : (b.id === selectedID) ? -1 : b.loc[1] - a.loc[1];
        }
    }


    // Draw the notes layer and schedule loading notes and updating markers.
    function drawNotes(selection) {
        var service = getService();

        var surface = context.surface();
        if (surface && !surface.empty()) {
            touchLayer = surface.selectAll('.data-layer.touch .layer-touch.markers');
        }

        drawLayer = selection.selectAll('.layer-notes')
            .data(service ? [0] : []);

        drawLayer.exit()
            .remove();

        drawLayer = drawLayer.enter()
            .append('g')
            .attr('class', 'layer-notes')
            .style('display', _notesEnabled ? 'block' : 'none')
            .merge(drawLayer);

        if (_notesEnabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                service.loadNotes(projection);
                updateMarkers();
            } else {
                editOff();
            }
        }
    }


    // Toggles the layer on and off
    drawNotes.enabled = function(val) {
        if (!arguments.length) return _notesEnabled;

        _notesEnabled = val;
        if (_notesEnabled) {
            layerOn();
        } else {
            layerOff();
            if (context.selectedNoteID()) {
                context.enter(modeBrowse(context));
            }
        }

        dispatch.call('change');
        return this;
    };


    return drawNotes;
}
