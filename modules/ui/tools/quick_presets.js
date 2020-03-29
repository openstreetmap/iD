import _debounce from 'lodash-es/debounce';

import { drag as d3_drag } from 'd3-drag';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { modeAddArea, modeAddLine, modeAddPoint, modeBrowse } from '../../modes';
import { t, textDirection } from '../../util/locale';
import { uiTooltip } from '../tooltip';
import { utilSafeClassName } from '../../util/util';
import { uiPresetIcon } from '../preset_icon';


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
            var markerClass = 'add-preset add-preset-' + d.preset.safeid
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
                var layerTitle = t('feature.' + hiddenPresetFeatures + '.description');
                protoMode.description = t('inspector.hidden_preset.' + tooltipIdSuffix, { features: layerTitle });
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
            .data(modes, function(d) { return d.button; })
            .order();

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
            .attr('id', function(d) {
                return utilSafeClassName(d.button);
            })
            .on('click.mode-buttons', function(d) {
                if (d3_select(this).classed('disabled')) return;
                toggleMode(d);
            })
            .call(uiTooltip()
                .placement('bottom')
                .title(function(d) {
                    return d.description;
                })
                .keys(function(d) {
                    return d.key ? [d.key] : null;
                })
                .scrollContainer(context.container().select('.top-toolbar'))
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

        buttonsEnter
            .filter('.add-favorite, .add-recent')
            .call(_d3Dragger);

        // update
        buttons = buttons
            .merge(buttonsEnter)
            .classed('disabled', function(d) { return !enabled(d); });
    }

    var _scrollNode, _dragOrigin, _dragMoved, _targetData;

    var _d3Dragger = d3_drag()
        .on('start', function() {
            _scrollNode = context.container().select('.top-toolbar').node();

            var node = d3_select(this).node();
            _dragOrigin = {
                x: d3_event.x,
                y: d3_event.y,
                nodeLeft: node.offsetLeft,
                nodeTop: node.offsetTop,
            };
            _targetData = null;
            _dragMoved = false;
        })
        .on('drag', function(d) {
            _dragMoved = true;

            var ltr = textDirection === 'ltr',
                rtl = !ltr;

            var deltaX = d3_event.x - _dragOrigin.x,
                deltaY = d3_event.y - _dragOrigin.y;

            var button = d3_select(this);

            if (!button.classed('dragging')) {
                // haven't committed to dragging yet

                // don't display drag until dragging beyond a distance threshold
                if (Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2)) <= 5) return;

                // setup dragging

                d3_select(this.parentNode)
                    .insert('div', '#' + button.attr('id'))
                    .attr('class', 'drag-placeholder');

                button
                    .classed('dragging', true)
                    // must use absolute position so button will display if dragged out of the toolbar
                    .style('position', 'absolute');
            }

            var draggingNode = button.node();
            var eventX = d3_event.x + draggingNode.parentNode.offsetLeft;
            var origLeft = _dragOrigin.nodeLeft;

            button
                .classed('removing', deltaY > 50)
                .style('left', _dragOrigin.nodeLeft + deltaX - _scrollNode.scrollLeft + 'px')
                .style('top', _dragOrigin.nodeTop + deltaY + 'px');

            _targetData = null;

            context.container().selectAll('.top-toolbar button.add-favorite, .top-toolbar button.add-recent')
                .style('transform', function(d2) {

                    if (d.button === d2.button) return null;

                    // no need to reposition elements if dragging out of toolbar
                    if (deltaY > 50) return null;

                    var node = d3_select(this).node(),
                        nodeLeft = node.offsetLeft,
                        nodeRight = nodeLeft + node.offsetWidth;

                    if ((ltr && nodeLeft > origLeft && eventX > nodeLeft) ||
                        (rtl && nodeLeft < origLeft && eventX < nodeRight)) {

                        if ((ltr && eventX < nodeRight) ||
                            (rtl && eventX > nodeLeft)) {
                            _targetData = d2;
                        }
                        return 'translateX(' + (ltr ? '-' : '') + '100%)';

                    } else if ((ltr && nodeLeft < origLeft && eventX < nodeRight) ||
                               (rtl && nodeLeft > origLeft && eventX > nodeLeft)) {

                        if ((ltr && eventX > nodeLeft) ||
                            (rtl && eventX < nodeRight)) {
                            _targetData = d2;
                        }
                        return 'translateX(' + (ltr ? '' : '-') + '100%)';
                    }

                    return null;
                });
        })
        .on('end', function(d) {

            if (_dragMoved && !d3_select(this).classed('dragging')) {
                // didn't move, interpret as a click
                toggleMode(d);
                return;
            }

            var ltr = textDirection === 'ltr',
                rtl = !ltr;

            context.container().selectAll('.top-toolbar .drag-placeholder')
                .remove();

            d3_select(this)
                .classed('dragging', false)
                .classed('removing', false)
                .style('position', null);

            context.container().selectAll('.top-toolbar button.add-favorite, .top-toolbar button.add-recent')
                .style('transform', null);

            var deltaY = d3_event.y - _dragOrigin.y;
            if (deltaY > 50) {
                // dragged out of the top bar, remove

                if (d.isFavorite()) {
                    context.presets().removeFavorite(d.preset);
                    // also remove this as a recent so it doesn't still appear
                    context.presets().removeRecent(d.preset);
                } else if (d.isRecent()) {
                    context.presets().removeRecent(d.preset);
                }
            } else if (_targetData !== null) {
                // dragged to a new position, reorder

                if (d.isFavorite()) {
                    context.presets().removeFavorite(d.preset);
                    if (_targetData.isRecent()) {
                        // also remove this as a recent so it doesn't appear twice
                        context.presets().removeRecent(d.preset);
                    }
                } else if (d.isRecent()) {
                    context.presets().removeRecent(d.preset);
                }

                var draggingAfter = (ltr && d3_event.x > _dragOrigin.x) ||
                                    (rtl && d3_event.x < _dragOrigin.x);

                if (_targetData.isFavorite()) {
                    context.presets().addFavorite(d.preset, _targetData.preset, draggingAfter);
                } else if (_targetData.isRecent()) {
                    context.presets().addRecent(d.preset, _targetData.preset, draggingAfter);
                }
            }
        });

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
