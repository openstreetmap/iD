import _throttle from 'lodash-es/throttle';
import _filter from 'lodash-es/filter';
import _cloneDeep from 'lodash-es/cloneDeep';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';
import { dispatch as d3_dispatch } from 'd3-dispatch';

import { modeBrowse } from '../modes';
import { svgPointTransform } from './index';
import { services } from '../services';
import { uiSettingsNotesData } from '../ui/settings/notes_data';


export function svgNotes(projection, context, dispatch) {
    if (!dispatch) { dispatch = d3_dispatch('change'); }
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var layer = d3_select(null);
    var _notes;

    var _status = 'open';
    var _statusOptions = ['all', 'open', 'closed'];

    var _toggleDateRange = 'opened';
    var _toggleDateRangeOptions = ['all', 'opened', 'closed'];

    var _statusDateRangeOptions = [formatDate(new Date('2010-01-01')), formatDate(new Date())];
    var _statusDateRange = _cloneDeep(_statusDateRangeOptions);

    var _contribution = 'all';
    var _contributionOptions = ['all', 'self', 'others'];

    var settingsNotesData = uiSettingsNotesData(context);


    function formatDate(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }


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


    // TODO: handle newly added notes; make sure they show up too
    // TODO: handle closing / opening a note that disappears given settings (update settings)
    function _selfNote(d) {
        return _notes.userDetails(function(_undefined, res) {
            var ids = d.comments.map(function(comment) {
                return comment.uid;
            });
            return ids.includes(res.id);
        });
    }

    function _hasBeenClosedDate(d) {
        if (d.date_closed) {
            return d.date_closed;
        }
        var closedDates = d.comments.map(function(comment) {
            if (comment.action === 'closed') {
                return formatDate(new Date(comment.date));
            }
            return;
        });
        return closedDates.filter(function(el) { return el; }).sort().slice(-1)[0];
    }


    function _filterData(data, settings) {
        // filter status
        if (settings._status !== 'all') {
            data = _filter(data, function(d) {
                return d.status === settings._status;
            });
        }

        // filter date
        data = _filter(data, function(d) {
            // TODO: Simplify this...
            if (settings._toggleDateRange === 'all') {
                return (settings._statusDateRange[0] <= formatDate(new Date(d.date_created)) &&
                    formatDate(new Date(d.date_created)) <= settings._statusDateRange[1]) ||
                    (settings._statusDateRange[0] <= formatDate(new Date(_hasBeenClosedDate(d))) &&
                    formatDate(new Date(_hasBeenClosedDate(d))) <= settings._statusDateRange[1]);

            } else if (settings._toggleDateRange === 'opened') {
                return settings._statusDateRange[0] <= formatDate(new Date(d.date_created)) &&
                    formatDate(new Date(d.date_created)) <= settings._statusDateRange[1];
            } else if (settings._toggleDateRange === 'closed') {
                return settings._statusDateRange[0] <= formatDate(new Date(_hasBeenClosedDate(d))) &&
                    formatDate(new Date(_hasBeenClosedDate(d))) <= settings._statusDateRange[1];
            }
        });

        // filter contribution
        if (settings._contribution !== 'all') {
            if (_notes.authenticated()) {
                switch (settings._contribution) {
                    case 'self':
                        data = _filter(data, function(d) { return _selfNote(d); });
                        break;
                    case 'others':
                        data = _filter(data, function(d) { return !_selfNote(d); });
                        break;
                    default:
                        break;
                }
            }
            // TODO: handle non-authenticated case
        }

        return data;
    }


    function update() {
        var service = getService();
        var selectedID = context.selectedNoteID();

        var data = (service ? service.notes(projection) : []);

        // TODO: remove these settings & reference global
        var settings = {
            _contribution: _contribution,
            _status: _status,
            _statusDateRange: _statusDateRange,
            _toggleDateRange: _toggleDateRange
        };
        // filter data
        data = _filterData(data, settings);

        // TODO: possibly find better way to exit select_note mode
        var dataIDs = data.map(function(note) { return note.id; });
        if (context.selectedNoteID() && !dataIDs.includes(context.selectedNoteID())) {
            context.enter(modeBrowse(context));
        }

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

    drawNotes.editSettings = function() {
        d3_event.preventDefault();
        context.container()
            .call(settingsNotesData);
    };

    drawNotes.status = function(status) {
        if (!arguments.length) return _status;

        _status = status;

        dispatch.call('change');
        return this;
    };

    drawNotes.statusOptions = function(statusOptions) {
        if (!arguments.length) return _statusOptions;

        _statusOptions = statusOptions;

        dispatch.call('change');
        return this;
    };

    drawNotes.toggleDateRange = function(toggleDateRange) {
        if (!arguments.length) return _toggleDateRange;

        _toggleDateRange = toggleDateRange;

        dispatch.call('change');
        return this;
    };

    drawNotes.toggleDateRangeOptions = function(toggleDateRangeOptions) {
        if (!arguments.length) return _toggleDateRangeOptions;

        _toggleDateRangeOptions = toggleDateRangeOptions;

        dispatch.call('change');
        return this;
    };

    drawNotes.statusDateRange = function(statusDateRange) {
        if (!arguments.length) return _statusDateRange;

        _statusDateRange = statusDateRange;

        dispatch.call('change');
        return this;
    };

    drawNotes.statusDateRangeOptions = function(statusDateRangeOptions) {
        if (!arguments.length) return _statusDateRangeOptions;

        _statusDateRangeOptions = statusDateRangeOptions;

        dispatch.call('change');
        return this;
    };

    drawNotes.contribution = function(contribution) {
        if (!arguments.length) return _contribution;

        _contribution = contribution;

        dispatch.call('change');
        return this;
    };

    drawNotes.contributionOptions = function(contributionOptions) {
        if (!arguments.length) return _contributionOptions;

        _contributionOptions = contributionOptions;

        dispatch.call('change');
        return this;
    };

    init();
    return drawNotes;
}
