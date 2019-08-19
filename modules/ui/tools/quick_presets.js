import _debounce from 'lodash-es/debounce';

import { drag as d3_drag } from 'd3-drag';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { modeAddArea, modeAddLine, modeAddPoint, modeBrowse } from '../../modes';
import { t, textDirection } from '../../util/locale';
import { tooltip } from '../../util/tooltip';
import { uiPresetIcon } from '../preset_icon';
import { uiTooltipHtml } from '../tooltipHtml';


export function uiToolQuickPresets(context) {

    var selection = d3_select(null);

    var tool = {
        itemClass: 'modes'
    };

    tool.itemsToDraw = function() {
        // override in subclass
        return [];
    };

    function enabled(d) {
        return d.id && context.editable();
    }

    function toggleMode(d) {
        if (!enabled(d)) return;

        if (context.mode().id.includes('draw') && context.mode().finish) {
            // gracefully complete the feature currently being drawn
            var didFinish = context.mode().finish();
            if (!didFinish) return;
        }

        if (context.mode().id.includes('add') && d.button === context.mode().button) {
            context.enter(modeBrowse(context));
        } else {
            if (d.preset &&
                // don't set a recent as most recent to avoid reordering buttons
                !d.isRecent()) {
                context.presets().setMostRecent(d.preset);
            }
            context.enter(d);
        }
    }

    tool.render = function(sel) {
        selection = sel;
        update();
    };

    tool.willUpdate = function() {};

    function update() {

        tool.willUpdate();

        var items = tool.itemsToDraw();

        var modes = items.map(function(d) {
            var presetName = d.preset.name().split(' – ')[0];
            var markerClass = 'add-preset add-preset-' + presetName.replace(/\s+/g, '_')
                + ' add-' + d.source; // replace spaces with underscores to avoid css interpretation
            if (d.preset.isFallback()) {
                markerClass += ' add-generic-preset';
            }

            var geometry = d.preset.defaultAddGeometry(context);

            var protoMode = Object.assign({}, d);  // shallow copy
            protoMode.geometry = geometry;
            protoMode.button = markerClass;
            protoMode.title = presetName;

            if (geometry) {
                protoMode.description = t('modes.add_preset.title', { feature: '<strong>' + presetName + '</strong>' });
            } else {
                var hiddenPresetFeatures = context.features().isHiddenPreset(d.preset, d.preset.geometry[0]);
                var isAutoHidden = context.features().autoHidden(hiddenPresetFeatures.key);
                var tooltipIdSuffix = isAutoHidden ? 'zoom' : 'manual';
                protoMode.description = t('inspector.hidden_preset.' + tooltipIdSuffix, { features: hiddenPresetFeatures.title });
                protoMode.key = null;
            }

            var mode;
            switch (geometry) {
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

            if (protoMode.key && mode) {
                context.keybinding().off(protoMode.key);
                context.keybinding().on(protoMode.key, function() {
                     toggleMode(mode);
                });
            }

            return mode || protoMode;
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
                if (d3_select(this).classed('disabled')) return;
                toggleMode(d);
            })
            .call(tooltip()
                .placement('bottom')
                .html(true)
                .title(function(d) {
                    return d.key ? uiTooltipHtml(d.description, d.key) : d.description;
                })
            );

        buttonsEnter
            .each(function(d) {

                var geometry = d.preset.geometry[0];
                if (d.preset.geometry.length !== 1 ||
                    (geometry !== 'area' && geometry !== 'line' && geometry !== 'vertex')) {
                    geometry = null;
                }

                d3_select(this)
                    .call(uiPresetIcon(context)
                        .geometry(geometry)
                        .preset(d.preset)
                        .sizeClass('small')
                        .pointMarker(true)
                    );
            });

        var dragOrigin, dragMoved, targetIndex, targetData;

        buttonsEnter
            .filter('.add-favorite,.add-recent')
            .call(d3_drag()
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
            .on('end', function(d, index) {

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
                    if (d.isFavorite()) {
                        context.presets().removeFavorite(d.preset);
                        // also remove this as a recent so it doesn't still appear
                        context.presets().removeRecent(d.preset);
                    } else if (d.isRecent()) {
                        context.presets().removeRecent(d.preset);
                    }
                } else if (targetIndex !== null) {
                    // dragged to a new position, reorder
                    if (d.isFavorite()) {
                        context.presets().moveFavorite(index, targetIndex);
                    } else if (d.isRecent()) {
                        var item = context.presets().recentMatching(d.preset);
                        var beforeItem = context.presets().recentMatching(targetData.preset);
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

    tool.allowed = function() {
        return tool.itemsToDraw().length > 0;
    };

    tool.install = function() {
        context
            .on('enter.editor.' + tool.id, function(entered) {
                selection.selectAll('button.add-button')
                    .classed('active', function(mode) { return entered.button === mode.button; });
            });

        var debouncedUpdate = _debounce(update, 500, { leading: true, trailing: true });

        context.map()
            .on('move.' + tool.id, debouncedUpdate)
            .on('drawn.' + tool.id, debouncedUpdate);

        context
            .on('enter.' + tool.id, update)
            .presets()
            .on('favoritePreset.' + tool.id, update)
            .on('recentsChange.' + tool.id, update);
    };

    tool.uninstall = function() {

        context
            .on('enter.editor.' + tool.id, null)
            .on('exit.editor.' + tool.id, null)
            .on('enter.' + tool.id, null);

        context.presets()
            .on('favoritePreset.' + tool.id, null)
            .on('recentsChange.' + tool.id, null);

        context.map()
            .on('move.' + tool.id, null)
            .on('drawn.' + tool.id, null);
    };

    return tool;
}
