import * as d3 from 'd3';
import _ from 'lodash';
import { geoEuclideanDistance } from '../geo';
import { modeBrowse, modeSelect } from '../modes';
import { osmEntity } from '../osm';


export function behaviorSelect(context) {
    var lastMouse = null,
        suppressMenu = true,
        tolerance = 4,
        p1 = null;


    function point() {
        return d3.mouse(context.container().node());
    }


    function keydown() {
        var e = d3.event;
        if (e && e.shiftKey) {
            context.surface()
                .classed('behavior-multiselect', true);
        }

        if (e && e.keyCode === 93) {  // context menu
            e.preventDefault();
            e.stopPropagation();
        }
    }


    function keyup() {
        var e = d3.event;
        if (!e || !e.shiftKey) {
            context.surface()
                .classed('behavior-multiselect', false);
        }


        if (e && e.keyCode === 93) {  // context menu
            e.preventDefault();
            e.stopPropagation();
            contextmenu();
        }
    }


    function mousedown() {
        if (!p1) p1 = point();
        d3.select(window)
            .on('mouseup.select', mouseup, true);

        var isShowAlways = +context.storage('edit-menu-show-always') === 1;
        suppressMenu = !isShowAlways;
    }


    function mousemove() {
        if (d3.event) lastMouse = d3.event;
    }


    function mouseup() {
        click();
    }


    function contextmenu() {
        var e = d3.event;
        e.preventDefault();
        e.stopPropagation();

        if (!+e.clientX && !+e.clientY) {
            if (lastMouse) {
                e.sourceEvent = lastMouse;
            } else {
                return;
            }
        }

        if (!p1) p1 = point();
        suppressMenu = false;
        click();
    }


    function click() {
        d3.select(window)
            .on('mouseup.select', null, true);

        if (!p1) return;
        var p2 = point(),
            dist = geoEuclideanDistance(p1, p2);

        p1 = null;
        if (dist > tolerance) {
            return;
        }

        var isMultiselect = d3.event.shiftKey || d3.select('#surface .lasso').node(),
            isShowAlways = +context.storage('edit-menu-show-always') === 1,
            datum = d3.event.target.__data__ || (lastMouse && lastMouse.target.__data__),
            mode = context.mode();


        if (datum && datum.type === 'midpoint') {
            datum = datum.parents[0];
        }

        if (!(datum instanceof osmEntity)) {
            // clicked nothing..
            if (!isMultiselect && mode.id !== 'browse') {
                context.enter(modeBrowse(context));
            }

        } else {
            // clicked an entity..
            var selectedIDs = context.selectedIDs();

            if (!isMultiselect) {
                if (selectedIDs.length > 1 && (!suppressMenu && !isShowAlways)) {
                    // multiple things already selected, just show the menu...
                    mode.suppressMenu(false).reselect();
                } else {
                    // select a single thing..
                    context.enter(modeSelect(context, [datum.id]).suppressMenu(suppressMenu));
                }

            } else {
                if (selectedIDs.indexOf(datum.id) !== -1) {
                    // clicked entity is already in the selectedIDs list..
                    if (!suppressMenu && !isShowAlways) {
                        // don't deselect clicked entity, just show the menu.
                        mode.suppressMenu(false).reselect();
                    } else {
                        // deselect clicked entity, then reenter select mode or return to browse mode..
                        selectedIDs = _.without(selectedIDs, datum.id);
                        context.enter(selectedIDs.length ? modeSelect(context, selectedIDs) : modeBrowse(context));
                    }
                } else {
                    // clicked entity is not in the selected list, add it..
                    selectedIDs = selectedIDs.concat([datum.id]);
                    context.enter(modeSelect(context, selectedIDs).suppressMenu(suppressMenu));
                }
            }
        }

        // reset for next time..
        suppressMenu = true;
    }


    var behavior = function(selection) {
        lastMouse = null;
        suppressMenu = true;
        p1 = null;

        d3.select(window)
            .on('keydown.select', keydown)
            .on('keyup.select', keyup)
            .on('contextmenu.select-window', function() {
                // Edge and IE really like to show the contextmenu on the
                // menubar when user presses a keyboard menu button
                // even after we've already preventdefaulted the key event.
                d3.event.preventDefault();
                d3.event.stopPropagation();
            });

        selection
            .on('mousedown.select', mousedown)
            .on('mousemove.select', mousemove)
            .on('contextmenu.select', contextmenu);

        if (d3.event && d3.event.shiftKey) {
            context.surface()
                .classed('behavior-multiselect', true);
        }
    };


    behavior.off = function(selection) {
        d3.select(window)
            .on('keydown.select', null)
            .on('keyup.select', null)
            .on('contextmenu.select-window', null)
            .on('mouseup.select', null, true);

        selection
            .on('mousedown.select', null)
            .on('mousemove.select', null)
            .on('contextmenu.select', null);

        context.surface()
            .classed('behavior-multiselect', false);
    };


    return behavior;
}
