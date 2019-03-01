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

    function isSingularItem(item) {
        if (item.geometry.filter) {
            return supportedGeometry(item).length === 1;
        }
        return false;
    }
    function supportedGeometry(preset) {
        return preset.geometry.filter(function(geometry) {
            return ['point', 'line', 'area'].indexOf(geometry) !== -1;
        });
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
        /*var collection = presets.collection.reduce(function(collection, preset) {
            if (preset.members) {
                collection.push(CategoryItem(preset));
            } else if (preset.visible()) {
                collection.push(PresetItem(preset));
            }
            return collection;
        }, []);*/

        var items = list.selectAll('.list-item')
            .data(presets.collection, function(d) { return d.id; });

        items.order();

        items.exit()
            .remove();

        var row = items.enter()
            .append('div')
            .attr('class', function(item) { return 'list-item preset-' + item.id.replace('/', '-'); });

        row.append('button')
            .attr('class', 'choose')
            .on('click', function(d) {
                if (d3_select(this).classed('disabled')) return;

                var geom = defaultGeometry(d);
                var markerClass = 'add-preset add-' + geom + ' add-preset-' + d.name()
                    .replace(/\s+/g, '_')
                    + '-' + geom; //replace spaces with underscores to avoid css interpretation
                var modeInfo = {
                    id: markerClass,
                    button: markerClass,
                    preset: d,
                    geometry: geom
                };
                var mode;
                switch (geom) {
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
            });

        row.each(function(d) {
            d3_select(this).call(
                uiPresetIcon()
                    .geometry(defaultGeometry(d))
                    .preset(d)
                    .sizeClass('small')
            );
        });
        row.append('div')
            .attr('class', 'label')
            .append('div')
            .attr('class', 'label-inner')
            .text(function(d) {
                return d.name();
            });

        row.each(function(d) {
            var supportedGeom = supportedGeometry(d);
            if (supportedGeom.length === 1) {
                var presetFavorite = uiPresetFavorite(d, supportedGeom[0], context, 'accessory');
                d3_select(this).call(presetFavorite.button);
            }
        });

        updateForFeatureHiddenState();
    }

    function updateForFeatureHiddenState() {

        var listItem = d3_selectAll('.search-add .popover .list-item');

        // remove existing tooltips
        listItem.selectAll('button.choose').call(tooltip().destroyAny);

        listItem.each(function(item, index) {
            if (!isSingularItem(item)) {
                return;
            }
            var geometry = defaultGeometry(item);

            var hiddenPresetFeaturesId = context.features().isHiddenPreset(item, geometry);
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

    return utilRebind(searchAdd, dispatch, 'on');
}
