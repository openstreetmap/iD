import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { t, textDirection } from '../util/locale';
import { actionChangePreset } from '../actions/index';
import { operationDelete } from '../operations/index';
import { modeBrowse } from '../modes/index';
import { svgIcon } from '../svg/index';
import { uiPresetIcon } from './preset_icon';
import { uiTagReference } from './tag_reference';
import { utilNoAuto, utilRebind } from '../util';


export function uiPresetList(context) {
    var dispatch = d3_dispatch('choose'),
        id,
        currentPreset,
        autofocus = false;


    function presetList(selection) {
        var entity = context.entity(id),
            geometry = context.geometry(id);

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

        if (context.entity(id).isUsed(context.graph())) {
            messagewrap
                .append('button')
                .attr('class', 'preset-choose')
                .on('click', function() { dispatch.call('choose', this, currentPreset); })
                .call(svgIcon((textDirection === 'rtl') ? '#icon-backward' : '#icon-forward'));
        } else {
            messagewrap
                .append('button')
                .attr('class', 'close')
                .on('click', function() {
                    context.enter(modeBrowse(context));
                })
                .call(svgIcon('#icon-close'));
        }

        function keydown() {
            // hack to let delete shortcut work when search is autofocused
            if (search.property('value').length === 0 &&
                (d3_event.keyCode === d3_keybinding.keyCodes['⌫'] ||
                 d3_event.keyCode === d3_keybinding.keyCodes['⌦'])) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                operationDelete([id], context)();
            } else if (search.property('value').length === 0 &&
                (d3_event.ctrlKey || d3_event.metaKey) &&
                d3_event.keyCode === d3_keybinding.keyCodes.z) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                context.undo();
            } else if (!d3_event.ctrlKey && !d3_event.metaKey) {
                d3_select(this).on('keydown', null);
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
            .on('keydown', keydown)
            .on('keypress', keypress)
            .on('input', inputevent);

        searchWrap
            .call(svgIcon('#icon-search', 'pre-text'));

        if (autofocus) {
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
            .classed('current', function(item) { return item.preset === currentPreset; })
            .each(function(item) { d3_select(this).call(item); })
            .style('opacity', 0)
            .transition()
            .style('opacity', 1);
    }


    function CategoryItem(preset) {
        var box, sublist, shown = false;

        function item(selection) {
            var wrap = selection.append('div')
                .attr('class', 'preset-list-button-wrap category col12');

            var button = wrap
                .append('button')
                .attr('class', 'preset-list-button')
                .classed('expanded', false)
                .call(uiPresetIcon()
                    .geometry(context.geometry(id))
                    .preset(preset))
                .on('click', function() {
                    var isExpanded = d3_select(this).classed('expanded');
                    var iconName = isExpanded ?
                        (textDirection === 'rtl' ? '#icon-backward' : '#icon-forward') : '#icon-down';
                    d3_select(this)
                        .classed('expanded', !isExpanded);
                    d3_select(this).selectAll('div.label svg.icon use')
                        .attr('href', iconName);
                    item.choose();
                });

            var label = button
                .append('div')
                .attr('class', 'label');

            label
                .call(svgIcon((textDirection === 'rtl' ? '#icon-backward' : '#icon-forward'), 'inline'))
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
                    .geometry(context.geometry(id))
                    .preset(preset))
                .on('click', item.choose)
                .append('div')
                .attr('class', 'label')
                .text(preset.name());

            wrap.call(item.reference.button);
            selection.call(item.reference.body);
        }

        item.choose = function() {
            context.presets().choose(preset);

            context.perform(
                actionChangePreset(id, currentPreset, preset),
                t('operations.change_tags.annotation')
            );

            dispatch.call('choose', this, preset);
        };

        item.help = function() {
            d3_event.stopPropagation();
            item.reference.toggle();
        };

        item.preset = preset;
        item.reference = uiTagReference(preset.reference(context.geometry(id)), context);

        return item;
    }


    presetList.autofocus = function(_) {
        if (!arguments.length) return autofocus;
        autofocus = _;
        return presetList;
    };


    presetList.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        presetList.preset(context.presets().match(context.entity(id), context.graph()));
        return presetList;
    };


    presetList.preset = function(_) {
        if (!arguments.length) return currentPreset;
        currentPreset = _;
        return presetList;
    };


    return utilRebind(presetList, dispatch, 'on');
}
