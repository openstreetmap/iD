import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import {
    modeAddArea,
    modeAddLine,
    modeAddPoint
} from '../modes';

import { t, textDirection } from '../util/locale';
import { actionChangePreset } from '../actions/index';
import { operationDelete } from '../operations/index';
import { svgIcon } from '../svg/index';
import { tooltip } from '../util/tooltip';
import { uiPresetFavorite } from './preset_favorite';
import { uiPresetIcon } from './preset_icon';
import { uiTagReference } from './tag_reference';
import { utilKeybinding, utilNoAuto, utilRebind } from '../util';


export function uiSearchAdd(context) {
    var dispatch = d3_dispatch('choose');
    var presets;
    var search = d3_select(null), popover = d3_select(null), list = d3_select(null);

    function searchAdd(selection) {

        presets = context.presets().matchAnyGeometry(['point', 'line', 'area']);

        var searchWrap = selection
            .append('div')
            .attr('class', 'search-wrap');

        search = searchWrap
            .append('input')
            .attr('class', 'search-input')
            .attr('placeholder', t('modes.add_feature.title'))
            .attr('type', 'search')
            .call(utilNoAuto)
            .on('keypress', function() {
                // enter/return
                if (d3_event.keyCode === 13) {
                    popover.selectAll('.list .list-item.focused button.choose')
                        .each(function(d) { d.choose.call(this); });
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                }
            })
            .on('keydown', function(){
                // up/down arrow key navigation

                if (d3_event.keyCode === utilKeybinding.keyCodes['↓']) {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();

                    var nextFocus,
                        priorFocus = popover.selectAll('.list .list-item.focused');
                    if (priorFocus.empty()) {
                        nextFocus = popover.selectAll('.list > .list-item:first-child');
                    } else {
                        nextFocus = popover.selectAll('.list .list-item.focused + .list-item');
                        if (nextFocus.empty()) {
                            nextFocus = d3_select(priorFocus.nodes()[0].nextElementSibling)
                                .selectAll('.list-item:first-child');
                        }
                    }
                    if (!nextFocus.empty()) {
                        focusListItem(nextFocus);
                        priorFocus.classed('focused', false);
                    }

                } else if (d3_event.keyCode === utilKeybinding.keyCodes['↑']) {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();

                    var priorFocus = popover.selectAll('.list .list-item.focused');
                    if (!priorFocus.empty()) {
                        var nextFocus = d3_select(priorFocus.nodes()[0].previousElementSibling);
                        if (!nextFocus.empty() && !nextFocus.classed('list-item')) {
                            nextFocus = nextFocus.selectAll('.list-item:last-child');
                        }
                        if (!nextFocus.empty()) {
                            focusListItem(nextFocus);
                            priorFocus.classed('focused', false);
                        }
                    }
                }
            })
            .on('mousedown', function() {
                search.attr('clicking', true);
            })
            .on('mouseup', function() {
                search.attr('clicking', null);
            })
            .on('focus', function() {
                if (search.attr('clicking')) {
                    search.attr('focusing', true);
                    search.attr('clicking', null);
                } else {
                    search.node().setSelectionRange(0, search.property('value').length);
                }
                popover.classed('hide', false);
            })
            .on('blur', function() {
                popover.classed('hide', true);
            })
            .on('click', function() {
                if (search.attr('focusing')) {
                    search.node().setSelectionRange(0, search.property('value').length);
                    search.attr('focusing', null);
                }
            })
            .on('input', function () {
                var value = search.property('value');
                //list.classed('filtered', value.length);
                if (value.length) {
                    popover.selectAll('.subsection').remove();
                    var results = presets.search(value);
                    list.call(drawList, results);
                    popover.selectAll('.list .list-item.focused')
                        .classed('focused', false);
                    focusListItem(popover.selectAll('.list > .list-item:first-child'));
                } else {
                    //list.call(drawList, context.presets().defaults(geometry, 36));
                }
            });

        searchWrap
            .call(svgIcon('#iD-icon-search', 'search-icon pre-text'));

        popover = selection
            .append('div')
            .attr('class', 'popover fillL hide')
            .on('mousedown', function() {
                // don't blur the search input (and thus close results)
                d3_event.preventDefault();
                d3_event.stopPropagation();
            });

        list = popover
            .append('div')
            .attr('class', 'list');//
            //.call(drawList, context.presets().defaults(geometry, 36));

        context.features().on('change.search-add', updateForFeatureHiddenState);

        context.keybinding().on('1', function() {
            search.node().focus();
            d3_event.preventDefault();
            d3_event.stopPropagation();
        });
    }

    function focusListItem(selection) {
        if (!selection.empty()) {
            selection.classed('focused', true);
            var node = selection.nodes()[0];
            var popoverNode = popover.node();
            var nodeRect = node.getBoundingClientRect();

            // scroll to keep the focused item visible
            if (node.offsetTop < popoverNode.scrollTop) {
                popoverNode.scrollTop = node.offsetTop;

            } else if (node.offsetTop + node.offsetHeight > popoverNode.scrollTop + popoverNode.offsetHeight) {
                popoverNode.scrollTop = node.offsetTop + node.offsetHeight - popoverNode.offsetHeight;
            }
        }
    }

    function drawList(list, presets) {

        var collection = presets.collection.map(function(preset) {
            if (preset.members) {
                return CategoryItem(preset);
            } else if (preset.visible()) {
                var supportedGeometry = preset.geometry.filter(function(geometry) {
                    return ['point', 'line', 'area'].indexOf(geometry) !== -1;
                }).sort();
                if (supportedGeometry.length === 1) {
                    return AddablePresetItem(preset, supportedGeometry[0]);
                }
                return MultiGeometryPresetItem(preset, supportedGeometry);
            }
        });

        var items = list.selectAll('.list-item')
            .data(collection, function(d) { return d.preset.id; });

        items.order();

        items.exit()
            .remove();

        items.enter();
        drawItems(items.enter());

        updateForFeatureHiddenState();
    }

    function drawItems(selection) {

        var row = selection
            .append('div')
            .attr('class', 'list-item')
            .attr('id', function(d) {
                var id = 'search-add-list-item-preset-' + d.preset.id.replace(/[^a-zA-Z\d:]/g, '-');
                if (d.geometry) {
                    id += '-' + d.geometry;
                }
                return id;
            })
            .on('mouseover', function(d) {
                list.selectAll('.list-item.focused')
                    .classed('focused', false);
                d3_select(this)
                    .classed('focused', true);
            })
            .on('mouseout', function(d) {
                d3_select(this)
                    .classed('focused', false);
            });

        row.append('button')
            .attr('class', 'choose')
            .on('click', function(d) {
                d.choose.call(this);
            });

        row.each(function(d) {
            d3_select(this).call(
                uiPresetIcon()
                    .geometry(d.geometry)
                    .preset(d.preset)
                    .sizeClass('small')
            );
        });
        row.append('div')
            .attr('class', 'label')
            .text(function(d) {
                if (d.isSubitem) {
                    return t('modes.add_' + d.geometry + '.title');
                }
                return d.preset.name();
            });

        row.each(function(d) {
            if (d.geometry) {
                var presetFavorite = uiPresetFavorite(d.preset,d.geometry, context, 'accessory');
                d3_select(this).call(presetFavorite.button);
            }
        });
    }

    function updateForFeatureHiddenState() {

        var listItem = d3_selectAll('.search-add .popover .list-item');

        // remove existing tooltips
        listItem.selectAll('button.choose').call(tooltip().destroyAny);

        listItem.each(function(item, index) {
            if (!item.geometry) return;

            var hiddenPresetFeaturesId = context.features().isHiddenPreset(item.preset, item.geometry);
            var isHiddenPreset = !!hiddenPresetFeaturesId;

            var button = d3_select(this).selectAll('button.choose');

            d3_select(this).classed('disabled', isHiddenPreset);
            button.classed('disabled', isHiddenPreset);

            if (isHiddenPreset) {
                var isAutoHidden = context.features().autoHidden(hiddenPresetFeaturesId);
                var tooltipIdSuffix = isAutoHidden ? 'zoom' : 'manual';
                var tooltipObj = { features: t('feature.' + hiddenPresetFeaturesId + '.description') };
                button.call(tooltip('dark')
                    .html(true)
                    .title(t('inspector.hidden_preset.' + tooltipIdSuffix, tooltipObj))
                    .placement(index < 2 ? 'bottom' : 'top')
                );
            }
        });
    }

    function CategoryItem(preset) {
        var item = {};
        item.preset = preset;
        item.choose = function() {
        };
        return item;
    }

    function MultiGeometryPresetItem(preset, geometries) {

        var subsection = d3_select(null);

        var item = {};
        item.preset = preset;
        item.geometries = geometries;
        item.choose = function() {
            var selection = d3_select(this);
            if (selection.classed('disabled')) return;

            var shouldExpand = !selection.classed('expanded');

            selection.classed('expanded', shouldExpand);

            if (shouldExpand) {
                var subitems = geometries.map(function(geometry) {
                    return AddablePresetItem(preset, geometry, true);
                });
                var selector = '#' + selection.node().closest('.list-item').id + ' + *';
                subsection = d3_selectAll('.search-add .popover .list').insert('div', selector)
                    .attr('class', 'subsection');
                var subitemsEnter = subsection.selectAll('.list-item')
                    .data(subitems)
                    .enter();
                drawItems(subitemsEnter);
                updateForFeatureHiddenState();
            } else {
                subsection.remove();
            }
        };
        return item;
    }

    function AddablePresetItem(preset, geometry, isSubitem) {
        var item = {};
        item.isSubitem = isSubitem;
        item.preset = preset;
        item.geometry = geometry;
        item.choose = function() {
            if (d3_select(this).classed('disabled')) return;

            var markerClass = 'add-preset add-' + geometry +
                ' add-preset-' + preset.name().replace(/\s+/g, '_') + '-' + geometry;
            var modeInfo = {
                id: markerClass,
                button: markerClass,
                preset: preset,
                geometry: geometry
            };
            var mode;
            switch (geometry) {
                case 'point':
                case 'vertex':
                    mode = modeAddPoint(context, modeInfo);
                    break;
                case 'line':
                    mode = modeAddLine(context, modeInfo);
                    break;
                case 'area':
                    mode = modeAddArea(context, modeInfo);
            }
            search.node().blur();
            context.enter(mode);
        };
        return item;
    }

    return utilRebind(searchAdd, dispatch, 'on');
}
