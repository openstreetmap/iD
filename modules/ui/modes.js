import _debounce from 'lodash-es/debounce';

import { drag as d3_drag } from 'd3-drag';
import { event as d3_event, select as d3_select } from 'd3-selection';

import {
    modeAddArea,
    modeAddLine,
    modeAddPoint,
    modeBrowse
} from '../modes';

import { svgIcon } from '../svg';
import { t } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { uiPresetIcon } from './preset_icon';
import { uiTooltipHtml } from './tooltipHtml';

export function uiModes(context) {


    function enabled() {
        return osmEditable();
    }

    function osmEditable() {
        var mode = context.mode();
        return context.editable() && mode && mode.id !== 'save';
    }


    return function(selection) {
        context
            .on('enter.editor', function(entered) {
                selection.selectAll('button.add-button')
                    .classed('active', function(mode) { return entered.button === mode.button; });
                context.container()
                    .classed('mode-' + entered.id, true);
            });

        context
            .on('exit.editor', function(exited) {
                context.container()
                    .classed('mode-' + exited.id, false);
            });

        var debouncedUpdate = _debounce(update, 500, { leading: true, trailing: true });

        context.map()
            .on('move.modes', debouncedUpdate)
            .on('drawn.modes', debouncedUpdate);

        context
            .on('enter.modes', update)
            .on('favoritePreset.modes', update);

        update();


        function update() {

            for (var i = 0; i <= 9; i++) {
                context.keybinding().off(i.toString());
            }

            var favoritePresets = context.getFavoritePresets();
            var favoriteModes = favoritePresets.map(function(d, index) {
                var preset = context.presets().item(d.id);
                var presetName = preset.name();
                var markerClass = 'add-preset add-' + d.geom + ' add-preset-' + presetName.replace(/\s+/g, '_')
                    + '-' + d.geom; // replace spaces with underscores to avoid css interpretation
                if (preset.isFallback()) {
                    markerClass += ' add-generic-preset';
                }

                var relevantMatchingGeometry = preset.geometry.filter(function(geometry) {
                    return ['vertex', 'point', 'line', 'area'].indexOf(geometry) !== -1;
                });
                var tooltipTitleID = 'modes.add_preset.title';
                if (relevantMatchingGeometry.length !== 1) {
                    if (preset.setTags({}, d.geom).building) {
                        tooltipTitleID = 'modes.add_preset.building.title';
                    } else {
                        tooltipTitleID = 'modes.add_preset.' + d.geom + '.title';
                    }
                }
                var favoriteMode = {
                    button: markerClass,
                    title: presetName,
                    description: t(tooltipTitleID, { feature: presetName }),
                    preset: preset,
                    geometry: d.geom
                };
                var keyCode = index + 1;
                if (keyCode <= 10) {
                    if (keyCode === 10) {
                        keyCode = 0;
                    }
                    favoriteMode.key = keyCode.toString();
                }
                var mode;
                switch (d.geom) {
                    case 'point':
                    case 'vertex':
                        mode = modeAddPoint(context, favoriteMode);
                        break;
                    case 'line':
                        mode = modeAddLine(context, favoriteMode);
                        break;
                    case 'area':
                        mode = modeAddArea(context, favoriteMode);
                }

                if (mode.key) {
                    context.keybinding().on(mode.key, function() {
                        if (!enabled(mode)) return;

                        if (mode.button === context.mode().button) {
                            context.enter(modeBrowse(context));
                        } else {
                            context.enter(mode);
                        }
                    });
                }

                return mode;
            });

            var data = favoriteModes;

            var buttons = selection.selectAll('button.add-button')
                .data(data, function(d, index) { return d.button + index; });

            // exit
            buttons.exit()
                .remove();

            // enter
            var buttonsEnter = buttons.enter()
                .append('button')
                .attr('tabindex', -1)
                .attr('class', function(d) { return d.button + ' add-button bar-button'; })
                .on('click.mode-buttons', function(d) {
                    if (!enabled(d)) return;

                    // When drawing, ignore accidental clicks on mode buttons - #4042
                    var currMode = context.mode().id;
                    if (/^draw/.test(currMode)) return;

                    if (d.id === currMode) {
                        context.enter(modeBrowse(context));
                    } else {
                        context.enter(d);
                    }
                })
                .call(tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(function(d) { return uiTooltipHtml(d.description, d.key); })
                );

            buttonsEnter
                .each(function(d) {
                    if (d.preset.isFallback()) {
                        d3_select(this)
                            .call(svgIcon('#iD-icon-' + d.preset.id));
                    } else {
                        d3_select(this)
                            .call(uiPresetIcon()
                                .geometry(d.geometry)
                                .preset(d.preset)
                                .sizeClass('small')
                            );
                    }
                });

            var dragOrigin, targetIndex;

            buttonsEnter.call(d3_drag()
                .on('start', function() {
                    dragOrigin = {
                        x: d3_event.x,
                        y: d3_event.y
                    };
                    targetIndex = null;
                })
                .on('drag', function(d, index) {
                    var x = d3_event.x - dragOrigin.x,
                        y = d3_event.y - dragOrigin.y;

                    d3_select(this)
                        .classed('dragging', true)
                        .classed('removing', y > 50);

                    targetIndex = null;

                    selection.selectAll('button.add-preset')
                        .style('transform', function(d2, index2) {
                            if (index === index2) {
                                return 'translate(' + x + 'px, ' + y + 'px)';
                            } else if (y > 50) {
                                if (index2 > index) {
                                    return 'translateX(-100%)';
                                }
                            } else if (index2 > index && d3_event.x > d3_select(this).node().offsetLeft) {
                                if (targetIndex === null || index2 > targetIndex) {
                                    targetIndex = index2;
                                }
                                return 'translateX(-100%)';
                            } else if (index2 < index && d3_event.x < d3_select(this).node().offsetLeft + d3_select(this).node().offsetWidth) {
                                if (targetIndex === null || index2 < targetIndex) {
                                    targetIndex = index2;
                                }
                                return 'translateX(100%)';
                            }
                            return null;
                        });
                })
                .on('end', function(d, index) {

                    d3_select(this)
                        .classed('dragging', false)
                        .classed('removing', false);

                    selection.selectAll('button.add-preset')
                        .style('transform', null);

                    var y = d3_event.y - dragOrigin.y;
                    if (y > 50) {
                        // dragged out of the top bar, remove the favorite
                        context.favoritePreset(d.preset, d.geometry);
                    } else if (targetIndex !== null) {
                        // dragged to a new position, reorder
                        context.moveFavoritePreset(index, targetIndex);
                    }
                })
            );

            // update
            buttons = buttons
                .merge(buttonsEnter)
                .classed('disabled', function(d) { return !enabled(d); });

            // check if toolbar has overflowed
            context.ui().checkOverflow('#bar', true);
        }
    };
}
