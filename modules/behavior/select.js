import { event as d3_event, select as d3_select } from 'd3-selection';

import { geoVecLength } from '../geo';
import { modeBrowse } from '../modes/browse';
import { modeSelect } from '../modes/select';
import { modeSelectData } from '../modes/select_data';
import { modeSelectNote } from '../modes/select_note';
import { modeSelectError } from '../modes/select_error';
import { osmEntity, osmNote, QAItem } from '../osm';
import { utilFastMouse } from '../util/util';


export function behaviorSelect(context) {
    var _tolerancePx = 4;
    var _lastPointerEvent = null;
    var _showMenu = false;
    var _p1 = null;
    var _downPointerId = null;
    var _longPressTimeout = null;
    var _lastInteractionType = null;

    // use pointer events on supported platforms; fallback to mouse events
    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';

    function point(event) {
        // don't use map().mouse() since additional pointers unrelated to selection can
        // move between pointerdown and pointerup
        return utilFastMouse(context.map().supersurface.node())(event || d3_event);
    }


    function keydown() {

        if (d3_event.keyCode === 32) {
            // don't react to spacebar events during text input
            var activeNode = document.activeElement;
            if (activeNode && new Set(['INPUT', 'TEXTAREA']).has(activeNode.nodeName)) return;
        }

        if (d3_event.keyCode === 93 ||  // context menu key
            d3_event.keyCode === 32) {  // spacebar
            d3_event.preventDefault();
        }

        if (d3_event.repeat) return; // ignore repeated events for held keys

        // if any key is pressed the user is probably doing something other than long-pressing
        if (_longPressTimeout) window.clearTimeout(_longPressTimeout);

        if (d3_event.shiftKey) {
            context.surface()
                .classed('behavior-multiselect', true);
        }

        if (d3_event.keyCode === 32) {  // spacebar
            if (!_p1) {
                _p1 = point(_lastPointerEvent);
                if (_longPressTimeout) window.clearTimeout(_longPressTimeout);
                _longPressTimeout = window.setTimeout(didLongPress, 500, 'spacebar');
            }
        }
    }


    function keyup() {
        if (_longPressTimeout) window.clearTimeout(_longPressTimeout);

        if (!d3_event.shiftKey) {
            context.surface()
                .classed('behavior-multiselect', false);
        }

        if (d3_event.keyCode === 93) {  // context menu key
            d3_event.preventDefault();
            _lastInteractionType = 'menukey';
            contextmenu();
        } else if (d3_event.keyCode === 32) {  // spacebar
            d3_event.preventDefault();
            _lastInteractionType = 'spacebar';
            click();
        }
    }


    function pointerdown() {
        if (_p1) return;
        _p1 = point();
        _downPointerId = d3_event.pointerId || 'mouse';

        if (_longPressTimeout) window.clearTimeout(_longPressTimeout);
        _longPressTimeout = window.setTimeout(didLongPress, 500, 'longdown-' + (d3_event.pointerType || 'mouse'));

        _lastPointerEvent = d3_event;

        d3_select(window)
            .on(_pointerPrefix + 'up.select', pointerup, true);
    }


    function didLongPress(iType) {
        // treat long presses like right-clicks
        _longPressTimeout = null;
        _lastInteractionType = iType;
        _showMenu = true;
        click();
    }


    function pointermove() {
        if (_downPointerId && _downPointerId !== (d3_event.pointerId || 'mouse')) return;

        _lastPointerEvent = d3_event;
    }


    function pointerup() {
        if (_downPointerId !== (d3_event.pointerId || 'mouse')) return;
        _downPointerId = null;

        d3_select(window)
            .on(_pointerPrefix + 'up.select', null, true);

        click();
    }


    function contextmenu() {
        var e = d3_event;
        e.preventDefault();

        if (!+e.clientX && !+e.clientY) {
            if (_lastPointerEvent) {
                e.sourceEvent = _lastPointerEvent;
            } else {
                return;
            }
        } else {
            _lastPointerEvent = d3_event;
            _lastInteractionType = 'rightclick';
        }

        if (!_p1) {
            _p1 = point();
        }
        _showMenu = true;
        click();
    }


    function click() {
        if (_longPressTimeout) window.clearTimeout(_longPressTimeout);

        if (!_p1) return;
        var p2 = point(_lastPointerEvent);
        var dist = geoVecLength(_p1, p2);
        _p1 = null;
        if (dist > _tolerancePx) return;

        var datum = (d3_event && d3_event.target.__data__) || (_lastPointerEvent && _lastPointerEvent.target.__data__);
        var isMultiselect = (d3_event && d3_event.shiftKey) || context.surface().select('.lasso').node();

        processClick(datum, isMultiselect, p2);
    }


    function processClick(datum, isMultiselect, point) {
        var mode = context.mode();

        var entity = datum && datum.properties && datum.properties.entity;
        if (entity) datum = entity;

        if (datum && datum.type === 'midpoint') {
            // treat targeting midpoints as if targeting the parent way
            datum = datum.parents[0];
        }

        var newMode;

        if (datum instanceof osmEntity) {    // clicked an entity..
            var selectedIDs = context.selectedIDs();
            context.selectedNoteID(null);
            context.selectedErrorID(null);

            if (!isMultiselect) {
                if (selectedIDs.length <= 1 || !_showMenu) {
                    // always enter modeSelect even if the entity is already
                    // selected since listeners may expect `context.enter` events,
                    // e.g. in the walkthrough
                    newMode = modeSelect(context, [datum.id]);
                    context.enter(newMode);
                }

            } else {
                if (selectedIDs.indexOf(datum.id) !== -1) {
                    // clicked entity is already in the selectedIDs list..
                    if (!_showMenu) {
                        // deselect clicked entity, then reenter select mode or return to browse mode..
                        selectedIDs = selectedIDs.filter(function(id) { return id !== datum.id; });
                        context.enter(selectedIDs.length ? modeSelect(context, selectedIDs) : modeBrowse(context));
                    }
                } else {
                    // clicked entity is not in the selected list, add it..
                    selectedIDs = selectedIDs.concat([datum.id]);
                    newMode = modeSelect(context, selectedIDs);
                    context.enter(newMode);
                }
            }

        } else if (datum && datum.__featurehash__ && !isMultiselect) {    // clicked Data..
            context
                .selectedNoteID(null)
                .enter(modeSelectData(context, datum));

        } else if (datum instanceof osmNote && !isMultiselect) {    // clicked a Note..
            context
                .selectedNoteID(datum.id)
                .enter(modeSelectNote(context, datum.id));

        } else if (datum instanceof QAItem & !isMultiselect) {  // clicked an external QA issue
            context
                .selectedErrorID(datum.id)
                .enter(modeSelectError(context, datum.id, datum.service));

        } else {    // clicked nothing..
            context.selectedNoteID(null);
            context.selectedErrorID(null);
            if (!isMultiselect && mode.id !== 'browse') {
                context.enter(modeBrowse(context));
            }
        }

        context.ui().closeEditMenu();

        // always request to show the edit menu in case the mode needs it
        if (_showMenu) context.ui().showEditMenu(point, _lastInteractionType);

        resetProperties();
    }


    function resetProperties() {
        _showMenu = false;
        _p1 = null;
        _downPointerId = null;
        if (_longPressTimeout) window.clearTimeout(_longPressTimeout);
        _longPressTimeout = null;
        _lastInteractionType = null;
        // don't reset _lastPointerEvent since it might still be useful
    }


    function behavior(selection) {
        resetProperties();
        _lastPointerEvent = context.map().lastPointerEvent();

        d3_select(window)
            .on('keydown.select', keydown)
            .on('keyup.select', keyup)
            .on('contextmenu.select-window', function() {
                // Edge and IE really like to show the contextmenu on the
                // menubar when user presses a keyboard menu button
                // even after we've already preventdefaulted the key event.
                var e = d3_event;
                if (+e.clientX === 0 && +e.clientY === 0) {
                    d3_event.preventDefault();
                }
            });

        selection
            .on(_pointerPrefix + 'down.select', pointerdown)
            .on(_pointerPrefix + 'move.select', pointermove)
            .on('contextmenu.select', contextmenu);

        if (d3_event && d3_event.shiftKey) {
            context.surface()
                .classed('behavior-multiselect', true);
        }
    }


    behavior.off = function(selection) {
        if (_longPressTimeout) window.clearTimeout(_longPressTimeout);

        d3_select(window)
            .on('keydown.select', null)
            .on('keyup.select', null)
            .on('contextmenu.select-window', null)
            .on(_pointerPrefix + 'up.select', null, true);

        selection
            .on(_pointerPrefix + 'down.select', null)
            .on(_pointerPrefix + 'move.select', null)
            .on('contextmenu.select', null);

        context.surface()
            .classed('behavior-multiselect', false);
    };


    return behavior;
}
