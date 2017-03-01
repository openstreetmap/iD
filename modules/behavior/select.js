import * as d3 from 'd3';
import _ from 'lodash';
import { geoEuclideanDistance } from '../geo';
import { modeBrowse, modeSelect } from '../modes';
import { osmEntity } from '../osm';


export function behaviorSelect(context) {
    var suppressMenu = true,
        tolerance = 4,
        p1 = null;


    function keydown() {
        if (d3.event && d3.event.shiftKey) {
            context.surface()
                .classed('behavior-multiselect', true);
        }
    }


    function keyup() {
        if (!d3.event || !d3.event.shiftKey) {
            context.surface()
                .classed('behavior-multiselect', false);
        }
    }


    function point() {
        return d3.mouse(context.container().node());
    }


    function contextmenu() {
        if (!p1) p1 = point();
        d3.event.preventDefault();
        suppressMenu = false;
        click();
    }


    function mousedown() {
        if (!p1) p1 = point();
        d3.select(window)
            .on('mouseup.select', mouseup, true);

        var isShowAlways = +context.storage('edit-menu-show-always') === 1;
        suppressMenu = !isShowAlways;
    }


    function mouseup() {
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
            datum = d3.event.target.__data__,
            mode = context.mode();


        if (datum.type === 'midpoint') {
            // clicked midpoint, do nothing..

        } else if (!(datum instanceof osmEntity)) {
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
        d3.select(window)
            .on('keydown.select', keydown)
            .on('keyup.select', keyup);

        selection
            .on('mousedown.select', mousedown)
            .on('contextmenu.select', contextmenu);

        keydown();
    };


    behavior.off = function(selection) {
        d3.select(window)
            .on('keydown.select', null)
            .on('keyup.select', null)
            .on('mouseup.select', null, true);

        selection
            .on('mousedown.select', null)
            .on('contextmenu.select', null);

        keyup();
    };


    return behavior;
}
