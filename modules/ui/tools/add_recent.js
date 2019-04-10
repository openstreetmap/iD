import _debounce from 'lodash-es/debounce';

import { drag as d3_drag } from 'd3-drag';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { modeAddArea, modeAddLine, modeAddPoint, modeBrowse } from '../../modes';
import { t, textDirection } from '../../util/locale';
import { tooltip } from '../../util/tooltip';
import { uiPresetIcon } from '../preset_icon';
import { uiTooltipHtml } from '../tooltipHtml';


export function uiToolAddRecent(context) {

    var tool = {
        id: 'add_recent',
        klass: 'modes',
        label: t('toolbar.recent')
    };

    function enabled() {
        return osmEditable();
    }

    function osmEditable() {
        var mode = context.mode();
        return context.editable() && mode && mode.id !== 'save';
    }

    function toggleMode(d) {
        if (!enabled(d)) return;

        if (d.button === context.mode().button) {
            context.enter(modeBrowse(context));
        } else {
            if (d.preset &&
                // don't set a recent as most recent to avoid reordering buttons
                !d.isRecent()) {
                context.presets().setMostRecent(d.preset, d.geometry);
            }
            context.enter(d);
        }
    }

    function recentsToDraw() {
        var maxShown = 10;
        var maxRecents = 5;

        var favorites = context.presets().getFavorites().slice(0, maxShown);

        function isAFavorite(recent) {
            return favorites.some(function(favorite) {
                return favorite.matches(recent.preset, recent.geometry);
            });
        }

        var favoritesCount = favorites.length;
        maxRecents = Math.min(maxRecents, maxShown - favoritesCount);
        var items = [];
        if (maxRecents > 0) {
            var recents = context.presets().getRecents().filter(function(recent) {
                return recent.geometry !== 'relation';
            });
            for (var i in recents) {
                var recent = recents[i];
                if (!isAFavorite(recent)) {
                    items.push(recent);
                    if (items.length === maxRecents) {
                        break;
                    }
                }
            }
        }

        return items;
    }

    tool.shouldShow = function() {
        return recentsToDraw().length > 0;
    };


    tool.render = function(selection) {
        context
            .on('enter.editor.recent', function(entered) {
                selection.selectAll('button.add-button')
                    .classed('active', function(mode) { return entered.button === mode.button; });
                context.container()
                    .classed('mode-' + entered.id, true);
            });

        context
            .on('exit.editor.recent', function(exited) {
                context.container()
                    .classed('mode-' + exited.id, false);
            });

        var debouncedUpdate = _debounce(update, 500, { leading: true, trailing: true });

        context.map()
            .on('move.recent', debouncedUpdate)
            .on('drawn.recent', debouncedUpdate);

        context
            .on('enter.recent', update)
            .presets()
            .on('favoritePreset.recent', update)
            .on('recentsChange.recent', update);

        update();


        function update() {

            var items = recentsToDraw();
            var favoritesCount = context.presets().getFavorites().length;

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
                        tooltipTitleID = 'modes.add_preset.' + context.presets().fallback(d.geometry).id + '.title';
                    }
                }
                var protoMode = Object.assign({}, d);  // shallow copy
                protoMode.button = markerClass;
                protoMode.title = presetName;
                protoMode.description = t(tooltipTitleID, { feature: '<strong>' + presetName + '</strong>' });

                var totalIndex = favoritesCount + index;
                var keyCode;
                // use number row order: 1 2 3 4 5 6 7 8 9 0
                // use the same for RTL even though the layout is backward: #6107
                if (totalIndex === 9) {
                    keyCode = 0;
                } else if (totalIndex < 10) {
                    keyCode = totalIndex + 1;
                }
                if (keyCode !== undefined) {
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
                    context.keybinding().off(mode.key);
                    context.keybinding().on(mode.key, function() {
                        toggleMode(mode);
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
                .attr('class', function(d) {
                    return d.button + ' add-button bar-button';
                })
                .on('click.mode-buttons', function(d) {

                    // When drawing, ignore accidental clicks on mode buttons - #4042
                    if (/^draw/.test(context.mode().id)) return;

                    toggleMode(d);
                })
                .call(tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(function(d) { return uiTooltipHtml(d.description, d.key); })
                );

            buttonsEnter
                .each(function(d) {
                    d3_select(this)
                        .call(uiPresetIcon(context)
                            .geometry((d.geometry === 'point' && !d.preset.matchGeometry(d.geometry)) ? 'vertex' : d.geometry)
                            .preset(d.preset)
                            .sizeClass('small')
                        );
                });

            var dragOrigin, dragMoved, targetIndex, targetData;

            buttonsEnter.call(d3_drag()
                .on('start', function() {
                    dragOrigin = {
                        x: d3_event.x,
                        y: d3_event.y
                    };
                    targetIndex = null;
                    targetData = null;
                    dragMoved = false;
                })
                .on('drag', function(d, index) {
                    dragMoved = true;
                    var x = d3_event.x - dragOrigin.x,
                        y = d3_event.y - dragOrigin.y;

                    if (!d3_select(this).classed('dragging') &&
                        // don't display drag until dragging beyond a distance threshold
                        Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) <= 5) return;

                    d3_select(this)
                        .classed('dragging', true)
                        .classed('removing', y > 50);

                    targetIndex = null;
                    targetData = null;

                    selection.selectAll('button.add-preset')
                        .style('transform', function(d2, index2) {
                            var node = d3_select(this).node();
                            if (index === index2) {
                                return 'translate(' + x + 'px, ' + y + 'px)';
                            } else if (y > 50) {
                                if (index2 > index) {
                                    return 'translateX(' + (textDirection === 'rtl' ? '' : '-') + '100%)';
                                }
                            } else if (d.source === d2.source) {
                                if (index2 > index && (
                                    (d3_event.x > node.offsetLeft && textDirection === 'ltr') ||
                                    (d3_event.x < node.offsetLeft + node.offsetWidth && textDirection === 'rtl')
                                )) {
                                    if (targetIndex === null || index2 > targetIndex) {
                                        targetIndex = index2;
                                        targetData = d2;
                                    }
                                    return 'translateX(' + (textDirection === 'rtl' ? '' : '-') + '100%)';
                                } else if (index2 < index && (
                                    (d3_event.x < node.offsetLeft + node.offsetWidth && textDirection === 'ltr') ||
                                    (d3_event.x > node.offsetLeft && textDirection === 'rtl')
                                )) {
                                    if (targetIndex === null || index2 < targetIndex) {
                                        targetIndex = index2;
                                        targetData = d2;
                                    }
                                    return 'translateX(' + (textDirection === 'rtl' ? '-' : '') + '100%)';
                                }
                            }
                            return null;
                        });
                })
                .on('end', function(d) {

                    if (dragMoved && !d3_select(this).classed('dragging')) {
                        toggleMode(d);
                        return;
                    }

                    d3_select(this)
                        .classed('dragging', false)
                        .classed('removing', false);

                    selection.selectAll('button.add-preset')
                        .style('transform', null);

                    var y = d3_event.y - dragOrigin.y;
                    if (y > 50) {
                        // dragged out of the top bar, remove
                        if (d.isRecent()) {
                            context.presets().removeRecent(d.preset, d.geometry);
                        }
                    } else if (targetIndex !== null) {
                        // dragged to a new position, reorder
                        if (d.isRecent()) {
                            var item = context.presets().recentMatching(d.preset, d.geometry);
                            var beforeItem = context.presets().recentMatching(targetData.preset, targetData.geometry);
                            context.presets().moveRecent(item, beforeItem);
                        }
                    }
                })
            );

            // update
            buttons = buttons
                .merge(buttonsEnter)
                .classed('disabled', function(d) { return !enabled(d); });
        }
    };

    tool.uninstall = function() {

        context
            .on('enter.editor.recent', null)
            .on('exit.editor.recent', null)
            .on('enter.recent', null);

        context.presets()
            .on('favoritePreset.recent', null)
            .on('recentsChange.recent', null);

        context.map()
            .on('move.recent', null)
            .on('drawn.recent', null);
    };

    return tool;
}
