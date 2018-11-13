import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { actionChangePreset } from '../actions/index';
import { operationDelete } from '../operations/index';
import { modeBrowse } from '../modes/index';
import { svgIcon } from '../svg/index';
import { uiPresetIcon } from './preset_icon';
import { uiTagReference } from './tag_reference';
import { utilKeybinding, utilNoAuto, utilRebind } from '../util';


export function uiPresetList(context) {
    var dispatch = d3_dispatch('choose');
    var _entityID;
    var _currentPreset;
    var _autofocus = false;


    function presetList(selection) {
        var entity = context.entity(_entityID);
        var geometry = context.geometry(_entityID);

        // Treat entities on addr:interpolation lines as points, not vertices (#3241)
        if (geometry === 'vertex' && entity.isOnAddressLine(context.graph())) {
            geometry = 'point';
        }

        var presets = context.presets().matchGeometry(geometry);

        selection.html('');

        var messagewrap = selection
            .append('div')
            .attr('class', 'header fillL cf');

        var message = messagewrap
            .append('h3')
            .text(t('inspector.choose'));

        if (context.entity(_entityID).isUsed(context.graph())) {
            messagewrap
                .append('button')
                .attr('class', 'preset-choose')
                .on('click', function() { dispatch.call('choose', this, _currentPreset); })
                .call(svgIcon((textDirection === 'rtl') ? '#iD-icon-backward' : '#iD-icon-forward'));
        } else {
            messagewrap
                .append('button')
                .attr('class', 'close')
                .on('click', function() {
                    context.enter(modeBrowse(context));
                })
                .call(svgIcon('#iD-icon-close'));
        }

        function initialKeydown() {
            // hack to let delete shortcut work when search is autofocused
            if (search.property('value').length === 0 &&
                (d3_event.keyCode === utilKeybinding.keyCodes['⌫'] ||
                 d3_event.keyCode === utilKeybinding.keyCodes['⌦'])) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                operationDelete([_entityID], context)();

            // hack to let undo work when search is autofocused
            } else if (search.property('value').length === 0 &&
                (d3_event.ctrlKey || d3_event.metaKey) &&
                d3_event.keyCode === utilKeybinding.keyCodes.z) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                context.undo();
            } else if (!d3_event.ctrlKey && !d3_event.metaKey) {
                // don't check for delete/undo hack on future keydown events
                d3_select(this).on('keydown', keydown);
                keydown.call(this);
            }
        }

        function keydown() {
            // down arrow
            if (d3_event.keyCode === utilKeybinding.keyCodes['↓'] &&
                // if insertion point is at the end of the string
                search.node().selectionStart === search.property('value').length) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                // move focus to the first item in the preset list
                list.select('.preset-list-button').node().focus();
            }
        }

        function keypress() {
            // enter
            var value = search.property('value');
            if (d3_event.keyCode === 13 && value.length) {
                list.selectAll('.preset-list-item:first-child').datum().choose();
            }
        }

        function inputevent() {
            var value = search.property('value');
            list.classed('filtered', value.length);
            if (value.length) {
                var results = presets.search(value, geometry);
                message.text(t('inspector.results', {
                    n: results.collection.length,
                    search: value
                }));
                list.call(drawList, results);
            } else {
                list.call(drawList, context.presets().defaults(geometry, 36));
                message.text(t('inspector.choose'));
            }
        }

        var searchWrap = selection
            .append('div')
            .attr('class', 'search-header');

        var search = searchWrap
            .append('input')
            .attr('class', 'preset-search-input')
            .attr('placeholder', t('inspector.search'))
            .attr('type', 'search')
            .call(utilNoAuto)
            .on('keydown', initialKeydown)
            .on('keypress', keypress)
            .on('input', inputevent);

        searchWrap
            .call(svgIcon('#iD-icon-search', 'pre-text'));

        if (_autofocus) {
            search.node().focus();
        }

        var listWrap = selection
            .append('div')
            .attr('class', 'inspector-body');

        var list = listWrap
            .append('div')
            .attr('class', 'preset-list fillL cf')
            .call(drawList, context.presets().defaults(geometry, 36));
    }


    function drawList(list, presets) {
        var collection = presets.collection.map(function(preset) {
            return preset.members ? CategoryItem(preset) : PresetItem(preset);
        });

        var items = list.selectAll('.preset-list-item')
            .data(collection, function(d) { return d.preset.id; });

        items.order();

        items.exit()
            .remove();

        items.enter()
            .append('div')
            .attr('class', function(item) { return 'preset-list-item preset-' + item.preset.id.replace('/', '-'); })
            .classed('current', function(item) { return item.preset === _currentPreset; })
            .each(function(item) { d3_select(this).call(item); })
            .style('opacity', 0)
            .transition()
            .style('opacity', 1);
    }

    function itemKeydown(){
        // the actively focused item
        var item = d3_select(this.closest('.preset-list-item'));
        var parentItem = d3_select(item.node().parentElement.closest('.preset-list-item'));

        // arrow down, move focus to the next, lower item
        if (d3_event.keyCode === utilKeybinding.keyCodes['↓']) {
            d3_event.preventDefault();
            d3_event.stopPropagation();
            // the next item in the list at the same level
            var nextItem = d3_select(item.node().nextElementSibling);
            // if there is no next item in this list
            if (nextItem.empty()) {
                // if there is a parent item
                if (!parentItem.empty()) {
                    // the item is the last item of a sublist,
                    // select the next item at the parent level
                    nextItem = d3_select(parentItem.node().nextElementSibling);
                }
            // if the focused item is expanded
            } else if (d3_select(this).classed('expanded')) {
                // select the first subitem instead
                nextItem = item.select('.subgrid .preset-list-item:first-child');
            }
            if (!nextItem.empty()) {
                // focus on the next item
                nextItem.select('.preset-list-button').node().focus();
            }

        // arrow up, move focus to the previous, higher item
        } else if (d3_event.keyCode === utilKeybinding.keyCodes['↑']) {
            d3_event.preventDefault();
            d3_event.stopPropagation();
            // the previous item in the list at the same level
            var previousItem = d3_select(item.node().previousElementSibling);

            // if there is no previous item in this list
            if (previousItem.empty()) {
                // if there is a parent item
                if (!parentItem.empty()) {
                    // the item is the first subitem of a sublist select the parent item
                    previousItem = parentItem;
                }
            // if the previous item is expanded
            } else if (previousItem.select('.preset-list-button').classed('expanded')) {
                // select the last subitem of the sublist of the previous item
                previousItem = previousItem.select('.subgrid .preset-list-item:last-child');
            }

            if (!previousItem.empty()) {
                // focus on the previous item
                previousItem.select('.preset-list-button').node().focus();
            } else {
                // the focus is at the top of the list, move focus back to the search field
                var search = d3_select(this.closest('.preset-list-pane')).select('.preset-search-input');
                search.node().focus();
            }

        // arrow left, move focus to the parent item if there is one
        } else if (d3_event.keyCode === utilKeybinding.keyCodes[(textDirection === 'rtl') ? '→' : '←']) {
            d3_event.preventDefault();
            d3_event.stopPropagation();
            // if there is a parent item, focus on the parent item
            if (!parentItem.empty()) {
                parentItem.select('.preset-list-button').node().focus();
            }

        // arrow right, choose this item
        } else if (d3_event.keyCode === utilKeybinding.keyCodes[(textDirection === 'rtl') ? '←' : '→']) {
            d3_event.preventDefault();
            d3_event.stopPropagation();
            item.datum().choose();
        }
    }


    function CategoryItem(preset) {
        var box, sublist, shown = false;

        function item(selection) {
            var wrap = selection.append('div')
                .attr('class', 'preset-list-button-wrap category col12');

            function click() {
                var isExpanded = d3_select(this).classed('expanded');
                var iconName = isExpanded ?
                    (textDirection === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward') : '#iD-icon-down';
                d3_select(this)
                    .classed('expanded', !isExpanded);
                d3_select(this).selectAll('div.label svg.icon use')
                    .attr('href', iconName);
                item.choose();
            }

            var button = wrap
                .append('button')
                .attr('class', 'preset-list-button')
                .classed('expanded', false)
                .call(uiPresetIcon()
                    .geometry(context.geometry(_entityID))
                    .preset(preset))
                .on('click', click)
                .on('keydown', function() {
                    // right arrow, expand the focused item
                    if (d3_event.keyCode === utilKeybinding.keyCodes[(textDirection === 'rtl') ? '←' : '→']) {
                        d3_event.preventDefault();
                        d3_event.stopPropagation();
                        // if the item isn't expanded
                        if (!d3_select(this).classed('expanded')) {
                            // toggle expansion (expand the item)
                            click.call(this);
                        }
                    // left arrow, collapse the focused item
                    } else if (d3_event.keyCode === utilKeybinding.keyCodes[(textDirection === 'rtl') ? '→' : '←']) {
                        d3_event.preventDefault();
                        d3_event.stopPropagation();
                        // if the item is expanded
                        if (d3_select(this).classed('expanded')) {
                            // toggle expansion (collapse the item)
                            click.call(this);
                        }
                    } else {
                        itemKeydown.call(this);
                    }
                });

            var label = button
                .append('div')
                .attr('class', 'label');

            label
                .call(svgIcon((textDirection === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward'), 'inline'))
                .append('span')
                .html(function() { return preset.name() + '&hellip;'; });

            box = selection.append('div')
                .attr('class', 'subgrid col12')
                .style('max-height', '0px')
                .style('opacity', 0);

            box.append('div')
                .attr('class', 'arrow');

            sublist = box.append('div')
                .attr('class', 'preset-list fillL3 cf fl');
        }


        item.choose = function() {
            if (!box || !sublist) return;

            if (shown) {
                shown = false;
                box.transition()
                    .duration(200)
                    .style('opacity', '0')
                    .style('max-height', '0px')
                    .style('padding-bottom', '0px');
            } else {
                shown = true;
                sublist.call(drawList, preset.members);
                box.transition()
                    .duration(200)
                    .style('opacity', '1')
                    .style('max-height', 200 + preset.members.collection.length * 190 + 'px')
                    .style('padding-bottom', '20px');
            }
        };

        item.preset = preset;
        return item;
    }


    function PresetItem(preset) {
        function item(selection) {
            var wrap = selection.append('div')
                .attr('class', 'preset-list-button-wrap col12');

            wrap.append('button')
                .attr('class', 'preset-list-button')
                .call(uiPresetIcon()
                    .geometry(context.geometry(_entityID))
                    .preset(preset))
                .on('click', item.choose)
                .on('keydown', itemKeydown)
                .append('div')
                .attr('class', 'label')
                .text(preset.name());

            wrap.call(item.reference.button);
            selection.call(item.reference.body);
        }

        item.choose = function() {
            context.presets().choose(preset);
            context.perform(
                actionChangePreset(_entityID, _currentPreset, preset),
                t('operations.change_tags.annotation')
            );

            dispatch.call('choose', this, preset);
        };

        item.help = function() {
            d3_event.stopPropagation();
            item.reference.toggle();
        };

        item.preset = preset;
        item.reference = uiTagReference(preset.reference(context.geometry(_entityID)), context);

        return item;
    }


    presetList.autofocus = function(val) {
        if (!arguments.length) return _autofocus;
        _autofocus = val;
        return presetList;
    };


    presetList.entityID = function(val) {
        if (!arguments.length) return _entityID;
        _entityID = val;
        presetList.preset(context.presets().match(context.entity(_entityID), context.graph()));
        return presetList;
    };


    presetList.preset = function(val) {
        if (!arguments.length) return _currentPreset;
        _currentPreset = val;
        return presetList;
    };


    return utilRebind(presetList, dispatch, 'on');
}
