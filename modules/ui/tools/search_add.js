import _debounce from 'lodash-es/debounce';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
    event as d3_event,
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import { modeAddArea, modeAddLine, modeAddPoint } from '../../modes';
import { t, textDirection } from '../../util/locale';
import { svgIcon } from '../../svg/index';
import { tooltip } from '../../util/tooltip';
import { uiTagReference } from '../tag_reference';
import { uiTooltipHtml } from '../tooltipHtml';
import { uiPresetFavoriteButton } from '../preset_favorite_button';
import { uiPresetIcon } from '../preset_icon';
import { utilKeybinding, utilNoAuto, utilRebind } from '../../util';


export function uiToolSearchAdd(context) {

    var tool = {
        id: 'search_add',
        label: t('inspector.search')
    };

    var dispatch = d3_dispatch('choose');
    var presets;
    var searchWrap = d3_select(null),
        search = d3_select(null),
        popover = d3_select(null),
        popoverContent = d3_select(null),
        list = d3_select(null),
        footer = d3_select(null),
        message = d3_select(null);

    var allowedGeometry = ['area', 'line', 'point', 'vertex'];
    var shownGeometry = [];
    var key = t('modes.add_feature.key');

    function updateShownGeometry(geom) {
        shownGeometry = geom.sort();
        presets = context.presets().matchAnyGeometry(shownGeometry);
    }

    function toggleShownGeometry(d) {
        var geom = shownGeometry;
        var index = geom.indexOf(d);
        if (index === -1) {
            geom.push(d);
            if (d === 'point') geom.push('vertex');
        } else {
            geom.splice(index, 1);
            if (d === 'point') geom.splice(geom.indexOf('vertex'), 1);
        }
        updateShownGeometry(geom);
    }

    function updateFilterButtonsStates() {
        footer.selectAll('button.filter')
            .classed('active', function(d) {
                return shownGeometry.indexOf(d) !== -1;
            });
    }


    tool.render = function(selection) {
        updateShownGeometry(allowedGeometry.slice());   // shallow copy

        searchWrap = selection
            .append('div')
            .attr('class', 'search-wrap')
            .call(tooltip()
                .placement('bottom')
                .html(true)
                .title(function() { return uiTooltipHtml(t('modes.add_feature.description'), key); })
            );

        search = searchWrap
            .append('input')
            .attr('class', 'search-input')
            .attr('placeholder', t('modes.add_feature.title'))
            .attr('type', 'search')
            .call(utilNoAuto)
            .on('mousedown', function() {
                search.attr('clicking', true);
            })
            .on('mouseup', function() {
                search.attr('clicking', null);
            })
            .on('focus', function() {
                searchWrap.classed('focused', true);
                if (search.attr('clicking')) {
                    search.attr('focusing', true);
                    search.attr('clicking', null);
                } else {
                    search.node().setSelectionRange(0, search.property('value').length);
                }
                popover.classed('hide', false);
            })
            .on('blur', function() {
                searchWrap.classed('focused', false);
                popover.classed('hide', true);
            })
            .on('click', function() {
                if (search.attr('focusing')) {
                    search.node().setSelectionRange(0, search.property('value').length);
                    search.attr('focusing', null);
                }
            })
            .on('keypress', keypress)
            .on('keydown', keydown)
            .on('input', updateResultsList);

        searchWrap
            .call(svgIcon('#iD-icon-search', 'search-icon pre-text'));

        popover = searchWrap
            .append('div')
            .attr('class', 'popover fillL hide')
            .on('mousedown', function() {
                // don't blur the search input (and thus close results)
                d3_event.preventDefault();
                d3_event.stopPropagation();
            });

        popoverContent = popover
            .append('div')
            .attr('class', 'popover-content');

        list = popoverContent.append('div')
            .attr('class', 'list');

        footer = popover
            .append('div')
            .attr('class', 'popover-footer');

        message = footer.append('div')
            .attr('class', 'message');

        footer.append('div')
            .attr('class', 'filter-wrap')
            .selectAll('button.filter')
            .data(['point', 'line', 'area'])
            .enter()
            .append('button')
            .attr('class', 'filter active')
            .attr('title', function(d) {
                return t('modes.add_' + d + '.filter_tooltip');
            })
            .each(function(d) {
                d3_select(this).call(svgIcon('#iD-icon-' + d));
            })
            .on('click', function(d) {
                toggleShownGeometry(d);
                if (shownGeometry.length === 0) {
                    updateShownGeometry(allowedGeometry.slice());   // shallow copy
                    toggleShownGeometry(d);
                }
                updateFilterButtonsStates();
                updateResultsList();
            });

        context.features()
            .on('change.search-add', updateForFeatureHiddenState);

        context.keybinding().on(key, function() {
            search.node().focus();
            d3_event.preventDefault();
            d3_event.stopPropagation();
        });

        var debouncedUpdate = _debounce(updateEnabledState, 500, { leading: true, trailing: true });

        context.map()
            .on('move.search-add', debouncedUpdate)
            .on('drawn.search-add', debouncedUpdate);

        updateEnabledState();

        updateResultsList();
    };

    tool.uninstall = function() {
        context.keybinding().off(key);

        context.features()
            .on('change.search-add', null);

        context.map()
            .on('move.search-add', null)
            .on('drawn.search-add', null);
    };

    function osmEditable() {
        var mode = context.mode();
        return context.editable() && mode && mode.id !== 'save';
    }

    function updateEnabledState() {
        var isEnabled = osmEditable();
        searchWrap.classed('disabled', !isEnabled);
        if (!isEnabled) {
            search.node().blur();
        }
        search.attr('disabled', isEnabled ? null : true);
    }

    function keypress() {
        if (d3_event.keyCode === utilKeybinding.keyCodes.enter) {
            popover.selectAll('.list .list-item.focused button.choose')
                .each(function(d) { d.choose.call(this); });
            d3_event.preventDefault();
            d3_event.stopPropagation();
        }
    }

    function keydown() {

        var nextFocus,
            priorFocus,
            parentSubsection;
        if (d3_event.keyCode === utilKeybinding.keyCodes['↓'] ||
            d3_event.keyCode === utilKeybinding.keyCodes.tab && !d3_event.shiftKey) {
            d3_event.preventDefault();
            d3_event.stopPropagation();

            priorFocus = popover.selectAll('.list .list-item.focused');
            if (priorFocus.empty()) {
                nextFocus = popover.selectAll('.list > .list-item:first-child');
            } else {
                nextFocus = d3_select(priorFocus.nodes()[0].nextElementSibling);
                if (!nextFocus.empty() && !nextFocus.classed('list-item')) {
                    nextFocus = nextFocus.selectAll('.list-item:first-child');
                }
                if (nextFocus.empty()) {
                    parentSubsection = priorFocus.nodes()[0].closest('.list .subsection');
                    if (parentSubsection && parentSubsection.nextElementSibling) {
                        nextFocus = d3_select(parentSubsection.nextElementSibling);
                    }
                }
            }
            if (!nextFocus.empty()) {
                focusListItem(nextFocus, true);
                priorFocus.classed('focused', false);
            }

        } else if (d3_event.keyCode === utilKeybinding.keyCodes['↑'] ||
            d3_event.keyCode === utilKeybinding.keyCodes.tab && d3_event.shiftKey) {
            d3_event.preventDefault();
            d3_event.stopPropagation();

            priorFocus = popover.selectAll('.list .list-item.focused');
            if (!priorFocus.empty()) {

                nextFocus = d3_select(priorFocus.nodes()[0].previousElementSibling);
                if (!nextFocus.empty() && !nextFocus.classed('list-item')) {
                    nextFocus = nextFocus.selectAll('.list-item:last-child');
                }
                if (nextFocus.empty()) {
                    parentSubsection = priorFocus.nodes()[0].closest('.list .subsection');
                    if (parentSubsection && parentSubsection.previousElementSibling) {
                        nextFocus = d3_select(parentSubsection.previousElementSibling);
                    }
                }
                if (!nextFocus.empty()) {
                    focusListItem(nextFocus, true);
                    priorFocus.classed('focused', false);
                }
            }
        } else if (d3_event.keyCode === utilKeybinding.keyCodes.esc) {
            search.node().blur();
            d3_event.preventDefault();
            d3_event.stopPropagation();
        }
    }

    function updateResultsList() {

        var value = search.property('value');
        var results;
        if (value.length) {
            results = presets.search(value, shownGeometry).collection;
        } else {
            var recents = context.presets().getRecents();
            recents = recents.filter(function(d) {
                return shownGeometry.indexOf(d.geometry) !== -1;
            });
            results = recents.slice(0, 35);
        }

        list.call(drawList, results);

        popover.selectAll('.list .list-item.focused')
            .classed('focused', false);
        focusListItem(popover.selectAll('.list > .list-item:first-child'), false);

        popoverContent.node().scrollTop = 0;

        var resultCount = results.length;
        message.text(t('modes.add_feature.' + (resultCount === 1 ? 'result' : 'results'), { count: resultCount }));
    }

    function focusListItem(selection, scrollingToShow) {
        if (!selection.empty()) {
            selection.classed('focused', true);
            if (scrollingToShow) {
                // scroll to keep the focused item visible
                scrollPopoverToShow(selection);
            }
        }
    }

    function scrollPopoverToShow(selection) {
        if (selection.empty()) return;

        var node = selection.nodes()[0];
        var scrollableNode = popoverContent.node();

        if (node.offsetTop < scrollableNode.scrollTop) {
            scrollableNode.scrollTop = node.offsetTop;

        } else if (node.offsetTop + node.offsetHeight > scrollableNode.scrollTop + scrollableNode.offsetHeight &&
            node.offsetHeight < scrollableNode.offsetHeight) {
            scrollableNode.scrollTop = node.offsetTop + node.offsetHeight - scrollableNode.offsetHeight;
        }
    }

    function itemForPreset(preset) {
        if (preset.members) {
            return CategoryItem(preset);
        }
        if (preset.preset && preset.geometry) {
            return AddablePresetItem(preset.preset, preset.geometry);
        }
        var supportedGeometry = preset.geometry.filter(function(geometry) {
            return shownGeometry.indexOf(geometry) !== -1;
        }).sort();
        var vertexIndex = supportedGeometry.indexOf('vertex');
        if (vertexIndex !== -1 && supportedGeometry.indexOf('point') !== -1) {
            // both point and vertex allowed, just show point
            supportedGeometry.splice(vertexIndex, 1);
        }
        if (supportedGeometry.length === 1) {
            return AddablePresetItem(preset, supportedGeometry[0]);
        }
        return MultiGeometryPresetItem(preset, supportedGeometry);
    }

    function drawList(list, data) {

        list.selectAll('.subsection.subitems').remove();

        var dataItems = [];
        for (var i = 0; i < data.length; i++) {
            var preset = data[i];
            if (i < data.length - 1) {
                var nextPreset = data[i+1];
                // group neighboring presets with the same name
                if (preset.name && nextPreset.name && preset.name() === nextPreset.name()) {
                    var groupedPresets = [preset, nextPreset].sort(function(p1, p2) {
                        return (p1.geometry[0] < p2.geometry[0]) ? -1 : 1;
                    });
                    dataItems.push(MultiPresetItem(groupedPresets));
                    i++; // skip the next preset since we accounted for it
                    continue;
                }
            }
            dataItems.push(itemForPreset(preset));
        }

        var items = list.selectAll('.list-item')
            .data(dataItems, function(d) { return d.id(); });

        items.order();

        items.exit()
            .remove();

        drawItems(items.enter());

        list.selectAll('.list-item.expanded')
            .classed('expanded', false)
            .selectAll('.label svg.icon use')
            .attr('href', textDirection === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward');

        updateForFeatureHiddenState();
    }

    function drawItems(selection) {

        var item = selection
            .append('div')
            .attr('class', 'list-item')
            .attr('id', function(d) {
                return 'search-add-list-item-preset-' + d.id().replace(/[^a-zA-Z\d:]/g, '-');
            })
            .on('mouseover', function() {
                list.selectAll('.list-item.focused')
                    .classed('focused', false);
                d3_select(this)
                    .classed('focused', true);
            })
            .on('mouseout', function() {
                d3_select(this)
                    .classed('focused', false);
            });

        var row = item.append('div')
            .attr('class', 'row');

        row.append('button')
            .attr('class', 'choose')
            .on('click', function(d) {
                d.choose.call(this);
            });

        row.each(function(d) {
            d3_select(this).call(
                uiPresetIcon(context)
                    .geometry(d.geometry)
                    .preset(d.preset || d.presets[0])
                    .sizeClass('small')
            );
        });
        var label = row.append('div')
            .attr('class', 'label');

        label.each(function(d) {
            if (d.subitems) {
                d3_select(this)
                    .call(svgIcon((textDirection === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward'), 'inline'));
            }
        });

        label.each(function(d) {
            // NOTE: split/join on en-dash, not a hypen (to avoid conflict with fr - nl names in Brussels etc)
            d3_select(this)
                .append('div')
                .attr('class', 'label-inner')
                .selectAll('.namepart')
                .data(d.name().split(' – '))
                .enter()
                .append('div')
                .attr('class', 'namepart')
                .text(function(d) { return d; });
        });

        row.each(function(d) {
            if (d.geometry) {
                var presetFavorite = uiPresetFavoriteButton(d.preset, d.geometry, context, 'accessory');
                d3_select(this).call(presetFavorite.button);
            }
        });
        item.each(function(d) {
            if ((d.geometry && (!d.isSubitem || d.isInNameGroup)) || d.geometries) {

                var reference = uiTagReference(d.preset.reference(d.geometry || d.geometries[0]), context);

                var thisItem = d3_select(this);
                thisItem.selectAll('.row').call(reference.button, 'accessory', 'info');

                var subsection = thisItem
                    .append('div')
                    .attr('class', 'subsection reference');
                subsection.call(reference.body);
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

    function chooseExpandable(item, itemSelection) {

        var shouldExpand = !itemSelection.classed('expanded');

        itemSelection.classed('expanded', shouldExpand);

        var iconName = shouldExpand ?
            '#iD-icon-down' : (textDirection === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward');
        itemSelection.selectAll('.label svg.icon use')
            .attr('href', iconName);

        if (shouldExpand) {
            var subitems = item.subitems();
            var selector = '#' + itemSelection.node().id + ' + *';
            item.subsection = d3_select(itemSelection.node().parentNode).insert('div', selector)
                .attr('class', 'subsection subitems');
            var subitemsEnter = item.subsection.selectAll('.list-item')
                .data(subitems)
                .enter();
            drawItems(subitemsEnter);
            updateForFeatureHiddenState();
            scrollPopoverToShow(item.subsection);
        } else {
            item.subsection.remove();
        }
    }

    function CategoryItem(preset) {
        var item = {};
        item.id = function() {
            return preset.id;
        };
        item.name = function() {
            return preset.name();
        };
        item.subsection = d3_select(null);
        item.preset = preset;
        item.choose = function() {
            var selection = d3_select(this);
            if (selection.classed('disabled')) return;
            chooseExpandable(item, d3_select(selection.node().closest('.list-item')));
        };
        item.subitems = function() {
            return preset.members.matchAnyGeometry(shownGeometry).collection.map(function(preset) {
                return itemForPreset(preset);
            });
        };
        return item;
    }

    function MultiPresetItem(presets) {
        var item = {};
        item.id = function() {
            return presets.map(function(preset) { return preset.id; }).join();
        };
        item.name = function() {
            return presets[0].name();
        };
        item.subsection = d3_select(null);
        item.presets = presets;
        item.choose = function() {
            var selection = d3_select(this);
            if (selection.classed('disabled')) return;
            chooseExpandable(item, d3_select(selection.node().closest('.list-item')));
        };
        item.subitems = function() {
            var items = [];
            presets.forEach(function(preset) {
                preset.geometry.filter(function(geometry) {
                    return shownGeometry.indexOf(geometry) !== -1;
                }).forEach(function(geometry) {
                    items.push(AddablePresetItem(preset, geometry, true, true));
                });
            });
            return items;
        };
        return item;
    }

    function MultiGeometryPresetItem(preset, geometries) {

        var item = {};
        item.id = function() {
            return preset.id + geometries;
        };
        item.name = function() {
            return preset.name();
        };
        item.subsection = d3_select(null);
        item.preset = preset;
        item.geometries = geometries;
        item.choose = function() {
            var selection = d3_select(this);
            if (selection.classed('disabled')) return;
            chooseExpandable(item, d3_select(selection.node().closest('.list-item')));
        };
        item.subitems = function() {
            return geometries.map(function(geometry) {
                return AddablePresetItem(preset, geometry, true);
            });
        };
        return item;
    }

    function AddablePresetItem(preset, geometry, isSubitem, isInNameGroup) {
        var item = {};
        item.id = function() {
            return preset.id + geometry + isSubitem;
        };
        item.name = function() {
            if (isSubitem) {
                if (preset.setTags({}, geometry).building) {
                    return t('presets.presets.building.name');
                }
                return t('modes.add_' + context.presets().fallback(geometry).id + '.title');
            }
            return preset.name();
        };
        item.isInNameGroup = isInNameGroup;
        item.isSubitem = isSubitem;
        item.preset = preset;
        item.geometry = geometry;
        item.choose = function() {
            if (d3_select(this).classed('disabled')) return;

            var markerClass = 'add-preset add-' + geometry +
                ' add-preset-' + preset.name().replace(/\s+/g, '_') + '-' + geometry;
            var modeInfo = {
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
            context.presets().setMostRecent(preset, geometry);
            context.enter(mode);
        };
        return item;
    }

    return utilRebind(tool, dispatch, 'on');
}
