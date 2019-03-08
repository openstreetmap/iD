import _clone from 'lodash-es/clone';
import _debounce from 'lodash-es/debounce';
import _uniqWith from 'lodash-es/uniqWith';

import { drag as d3_drag } from 'd3-drag';
import { event as d3_event, select as d3_select } from 'd3-selection';

import {
    modeAddArea,
    modeAddLine,
    modeAddPoint,
    modeBrowse
} from '../modes';

import { svgIcon } from '../svg';
import { t, textDirection } from '../util/locale';
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
            .presets()
            .on('favoritePreset.modes', update)
            .on('recentsChange.modes', update);

        update();


        function update() {

            for (var i = 0; i <= 9; i++) {
                context.keybinding().off(i.toString());
            }

            var items = context.presets().getFavorites();

            var favoritesCount = items.length;

            if (favoritesCount < 10) {
                items = _uniqWith(items.concat(context.presets().getRecents()), function(item1, item2) {
                    return item1.matches(item2.preset, item2.geometry);
                });
                items = items.slice(0, 10);
            }

            var modes = items.map(function(d, index) {
                var presetName = d.preset.name().split(' – ')[0];
                var markerClass = 'add-preset add-' + d.geometry + ' add-preset-' + presetName.replace(/\s+/g, '_')
                    + '-' + d.geometry + ' add-' + d.source; // replace spaces with underscores to avoid css interpretation
                if (d.preset.isFallback()) {
                    markerClass += ' add-generic-preset';
                }

                var supportedGeometry = d.preset.geometry.filter(function(geometry) {
                    return ['vertex', 'point', 'line', 'area'].indexOf(geometry) !== -1;
                });
                var vertexIndex = supportedGeometry.indexOf('vertex');
                if (vertexIndex !== -1 && supportedGeometry.indexOf('point') !== -1) {
                    // both point and vertex allowed, just combine them
                    supportedGeometry.splice(vertexIndex, 1);
                }
                var tooltipTitleID = 'modes.add_preset.title';
                if (supportedGeometry.length !== 1) {
                    if (d.preset.setTags({}, d.geometry).building) {
                        tooltipTitleID = 'modes.add_preset.building.title';
                    } else {
                        tooltipTitleID = 'modes.add_preset.' + d.geometry + '.title';
                    }
                }
                var protoMode = _clone(d);
                protoMode.button = markerClass;
                protoMode.title = presetName;
                protoMode.description = t(tooltipTitleID, { feature: '<strong>' + presetName + '</strong>' });
                var keyCode;
                if (textDirection === 'ltr') {
                    // use number row order: 1 2 3 4 5 6 7 8 9 0
                    if (index === 9) {
                        keyCode = 0;
                    } else if (index < 10) {
                        keyCode = index + 1;
                    }
                } else {
                    // use number row order from right to left
                    if (index === 0) {
                        keyCode = 0;
                    } else if (index < 10) {
                        keyCode = 10 - index;
                    }
                }
                if (keyCode !== null) {
                    protoMode.key = keyCode.toString();
                }

                var mode;
                switch (d.geometry) {
                    case 'point':
                    case 'vertex':
                        mode = modeAddPoint(context, protoMode);
                        break;
                    case 'line':
                        mode = modeAddLine(context, protoMode);
                        break;
                    case 'area':
                        mode = modeAddArea(context, protoMode);
                }

                if (mode.key) {
                    context.keybinding().on(mode.key, function() {
                        if (!enabled(mode)) return;

                        if (mode.button === context.mode().button) {
                            context.enter(modeBrowse(context));
                        } else {
                            if (mode.preset && mode.isFavorite()) {
                                context.presets().setMostRecent(mode.preset, mode.geometry);
                            }
                            context.enter(mode);
                        }
                    });
                }

                return mode;
            });

            var buttons = selection.selectAll('button.add-button')
                .data(modes, function(d, index) { return d.button + index; });

            // exit
            buttons.exit()
                .remove();

            // enter
            var buttonsEnter = buttons.enter()
                .append('button')
                .attr('tabindex', -1)
                .attr('class', function(d, index) {
                    var classes = d.button + ' add-button bar-button';
                    if (index === favoritesCount && index !== 0) {
                        classes += ' first-recent';
                    }
                    return classes;
                })
                .on('click.mode-buttons', function(d) {
                    if (!enabled(d)) return;

                    // When drawing, ignore accidental clicks on mode buttons - #4042
                    var currMode = context.mode().id;
                    if (/^draw/.test(currMode)) return;

                    if (d.id === currMode) {
                        context.enter(modeBrowse(context));
                    } else {
                        if (d.preset && d.isFavorite()) {
                            context.presets().setMostRecent(d.preset, d.geometry);
                        }
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
                            var node = d3_select(this).node();
                            if (index === index2) {
                                return 'translate(' + x + 'px, ' + y + 'px)';
                            } else if (y > 50) {
                                if (index2 > index) {
                                    return 'translateX(' + (textDirection === 'rtl' ? '' : '-') + '100%)';
                                }
                            } else if (d.source === 'favorite' && d.source === d2.source) {
                                if (index2 > index && (
                                    (d3_event.x > node.offsetLeft && textDirection === 'ltr') ||
                                    (d3_event.x < node.offsetLeft + node.offsetWidth && textDirection === 'rtl')
                                )) {
                                    if (targetIndex === null || index2 > targetIndex) {
                                        targetIndex = index2;
                                    }
                                    return 'translateX(' + (textDirection === 'rtl' ? '' : '-') + '100%)';
                                } else if (index2 < index && (
                                    (d3_event.x < node.offsetLeft + node.offsetWidth && textDirection === 'ltr') ||
                                    (d3_event.x > node.offsetLeft && textDirection === 'rtl')
                                )) {
                                    if (targetIndex === null || index2 < targetIndex) {
                                        targetIndex = index2;
                                    }
                                    return 'translateX(' + (textDirection === 'rtl' ? '-' : '') + '100%)';
                                }
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
                        // dragged out of the top bar, remove
                        if (d.isFavorite()) {
                            context.presets().toggleFavorite(d.preset, d.geometry);
                        } else if (d.isRecent()) {
                            context.presets().removeRecent(d.preset, d.geometry);
                        }
                    } else if (targetIndex !== null) {
                        // dragged to a new position, reorder
                        if (d.isFavorite()) {
                            context.presets().moveFavorite(index, targetIndex);
                        } else if (d.isRecent()) {
                            //context.presets().moveRecent(index - favoritesCount, targetIndex - favoritesCount);
                        }
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
