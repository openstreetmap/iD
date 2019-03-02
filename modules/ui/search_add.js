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
            .on('focus', function() {
                popover.classed('hide', false);
            })
            .on('blur', function() {
                popover.classed('hide', true);
            })
            .on('input', function () {
                var value = search.property('value');
                //list.classed('filtered', value.length);
                if (value.length) {
                    var results = presets.search(value);
                    list.call(drawList, results);
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
    }

    function supportedGeometry(preset) {
        return preset.geometry.filter(function(geometry) {
            return ['point', 'line', 'area'].indexOf(geometry) !== -1;
        }).sort();
    }
    function defaultGeometry(item) {
        if (item.geometry.filter) {
            var supportedGeom = supportedGeometry(item);
            if (supportedGeom.length === 1) {
                return supportedGeom[0];
            }
        } else {
            return item.geometry;
        }
        return 'point';
    }

    function drawList(list, presets) {

        var collection = presets.collection.map(function(preset) {
            if (preset.members) {
                return CategoryItem(preset);
            } else if (preset.visible()) {
                var supportedGeom = supportedGeometry(preset);
                if (supportedGeom.length === 1) {
                    return AddablePresetItem(preset, supportedGeom[0]);
                }
                return MultiGeometryPresetItem(preset, supportedGeom);
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
            .attr('class', function(d) { return 'list-item preset-' + d.preset.id.replace(/\//g, '-'); })
            .attr('id', function(d) {
                var id = 'search-add-list-item-preset-' + d.preset.id.replace(/\//g, '-');
                if (d.geometry) {
                    id += '-' + d.geometry;
                }
                return id;
            });

        row.append('button')
            .attr('class', 'choose')
            .on('click', function(d) {
                d.choose.call(this);
            });

        row.each(function(d) {
            d3_select(this).call(
                uiPresetIcon()
                    .geometry(d.geometry || defaultGeometry(d.preset))
                    .preset(d.preset)
                    .sizeClass('small')
            );
        });
        row.append('div')
            .attr('class', 'label')
            .append('div')
            .attr('class', 'label-inner')
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
        function item(selection) {

        }
        item.preset = preset;
        item.choose = function() {
        };
        return item;
    }

    function MultiGeometryPresetItem(preset, geometries) {

        var subsection = d3_select(null);

        function item(selection) {

        }
        item.preset = preset;
        item.geometries = geometries;
        item.choose = function() {
            var selection = d3_select(this);
            if (selection.classed('disabled')) return;

            var shouldExpand = !selection.classed('expanded');

            selection.classed('expanded', shouldExpand)

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
        function item(selection) {

        }
        item.isSubitem = isSubitem;
        item.preset = preset;
        item.geometry = geometry;
        item.choose = function() {
            if (d3_select(this).classed('disabled')) return;

            var markerClass = 'add-preset add-' + geometry +
                ' add-preset-' + preset.name().replace(/\s+/g, '_') + '-' + geometry;n
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
