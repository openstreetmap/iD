import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import deepEqual from 'fast-deep-equal';
import * as countryCoder from '@ideditor/country-coder';

import { t, localizer } from '../core/localizer';
import { svgIcon } from '../svg/index';
import { uiTooltip } from './tooltip';
import { uiPopover } from './popover';
import { uiTagReference } from './tag_reference';
import { uiPresetFavoriteButton } from './preset_favorite_button';
import { uiPresetIcon } from './preset_icon';
//import { groupManager } from '../entities/group_manager';
import { utilKeybinding, utilNoAuto, utilUniqueDomId } from '../util';
import { utilRebind } from '../util/rebind';

export function uiPresetBrowser(context) {

    var dispatch = d3_dispatch('choose', 'hide');

    // multiple preset browsers could be instantiated at once, give each a unique ID
    var _uid = (new Date()).getTime().toString();

    var _presets;

    // the hotkey that was used to open the browser
    var _openKey;

    // all possible geometries
    var _allowedGeometry = [];
    // subset of `_allowedGeometry` toggled on by the user
    var _shownGeometry = [];

    var search = d3_select(null),
        poplistContent = d3_select(null),
        poplistFooter = d3_select(null);

    var _countryCode;

    var browser = uiPopover('poplist preset-browser fillL')
        .placement('bottom')
        .alignment('leading')
        .hasArrow(false);

    browser.allowedGeometry = function(val) {
        if (!arguments.length) return _allowedGeometry;
        _allowedGeometry = val;
        updateShownGeometry(val);
        renderFilterButtons();
        updateResultsList();
        return browser;
    };

    browser.openKey = function(val) {
        if (!arguments.length) return _openKey && _openKey.key;
        _openKey = { key: val, time: new Date().getTime() };
        return browser;
    };

    browser.content(function() {
        return function(selection) {

            var header = selection.selectAll('.poplist-header')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'poplist-header');

            header
                .append('input')
                .attr('class', 'search-input')
                .attr('placeholder', t('modes.add_feature.search_placeholder'))
                .attr('type', 'search')
                .call(utilNoAuto)
                .on('blur', function() {
                    browser.hide();
                })
                .on('keypress', keypress)
                .on('keydown', keydown)
                .on('input', updateResultsList);

            header
                .call(svgIcon('#iD-icon-search', 'search-icon pre-text'));

            selection.selectAll('.poplist-content')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'poplist-content')
                .on('mousedown', function() {
                    // don't blur the search input (and thus close results)
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                })
                .append('div')
                .attr('class', 'list');

            var footer = selection.selectAll('.poplist-footer')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'poplist-footer')
                .on('mousedown', function() {
                    // don't blur the search input (and thus close results)
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                });

            footer.append('div')
                .attr('class', 'message');

            footer.append('div')
                .attr('class', 'filter-wrap');

            search = selection.selectAll('.search-input');
            poplistContent = selection.selectAll('.poplist-content');
            poplistFooter = selection.selectAll('.poplist-footer');

            renderFilterButtons();
        };
    });

    var parentShow = browser.show;
    browser.show = function() {
        parentShow();
        search.node().focus();
        search.node().setSelectionRange(0, search.property('value').length);

        reloadCountryCode();

        updateResultsList();

        context.features()
            .on('change.preset-browser.' + _uid , updateForFeatureHiddenState);
    };

    var parentHide = browser.hide;
    browser.hide = function() {
        parentHide();
        dispatch.call('hide', this);
    };

    function renderFilterButtons() {
        var selection = poplistFooter.select('.filter-wrap');

        var geomForButtons = _allowedGeometry.slice();
        var vertexIndex = geomForButtons.indexOf('vertex');
        if (vertexIndex !== -1) geomForButtons.splice(vertexIndex, 1);

        if (geomForButtons.length === 1) {
            // don't show filter buttons if only one geometry allowed
            geomForButtons = [];
        }

        var buttons = selection
            .selectAll('button.filter')
            .data(geomForButtons, function(d) { return d; });

        buttons.exit()
            .remove();

        buttons
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
                if (_shownGeometry.length === 0) {
                    // invert the selection instead of toggling all types off
                    updateShownGeometry(_allowedGeometry);
                    toggleShownGeometry(d);
                }
                updateFilterButtonsStates();
                updateResultsList();
            });

        updateFilterButtonsStates();
    }

    function updateShownGeometry(geom) {
        _shownGeometry = geom.slice().sort();
        _presets = context.presets().matchAnyGeometry(_shownGeometry);
    }

    function toggleShownGeometry(d) {
        var geom = _shownGeometry;
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
        poplistFooter.selectAll('button.filter')
            .classed('active', function(d) {
                return _shownGeometry.indexOf(d) !== -1;
            });
    }

    function keypress() {
        if (d3_event.keyCode === utilKeybinding.keyCodes.enter) {
            poplistContent.selectAll('.list .list-item.focused button.choose')
                .each(function(d) { d.choose.call(this); });
            d3_event.preventDefault();
            d3_event.stopPropagation();
        }
    }

    function keydown() {

        if (_openKey && d3_event.key === _openKey.key) {
            if (new Date().getTime() - _openKey.time < 750) {
                // Close the browser if the open key is pressed again within a short
                // timeframe, but not longer since the key could be used for search input
                search.node().blur();
                d3_event.preventDefault();
                d3_event.stopPropagation();
            }
            _openKey = null;
        }

        var nextFocus,
            priorFocus,
            parentSubsection;
        if (d3_event.keyCode === utilKeybinding.keyCodes['↓'] ||
            d3_event.keyCode === utilKeybinding.keyCodes.tab && !d3_event.shiftKey) {
            d3_event.preventDefault();
            d3_event.stopPropagation();

            priorFocus = poplistContent.selectAll('.list .list-item.focused');
            if (priorFocus.empty()) {
                nextFocus = poplistContent.selectAll('.list > .list-item:first-child');
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

            priorFocus = poplistContent.selectAll('.list .list-item.focused');
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

    function getDefaultResults(geometries, countryCode) {

        //var graph = context.graph();

        //var superGroups = groupManager.groupsWithNearby;
        //var scoredGroups = {};
        var scoredPresets = {};

        context.presets().getRecents().slice(0, 15).forEach(function(item, index) {
            var score = (15 - index) / 15;

            var id = item.preset.id;
            if (!scoredPresets[id]) {
                scoredPresets[id] = {
                    preset: item.preset,
                    score: score
                };
            }
        });
/*
        var queryExtent = context.map().extent();
        var nearbyEntities = context.history().tree().intersects(queryExtent, graph);
        for (var i in nearbyEntities) {
            var entity = nearbyEntities[i];
            // ignore boring features
            if (!entity.hasInterestingTags()) continue;

            var geom = entity.geometry(graph);

            // evaluate preset
            var preset = context.presets().match(entity, graph);
            if (preset.searchable !== false && // don't recommend unsearchables
                !preset.isFallback() && // don't recommend generics
                !preset.suggestion) { // don't recommend brand suggestions again
                if (!scoredPresets[preset.id]) {
                    scoredPresets[preset.id] = {
                        preset: preset,
                        score: 0
                    };
                }
                scoredPresets[preset.id].score += 1;
            }

            // evaluate groups
            for (var j in superGroups) {
                var group = superGroups[j];
                if (group.matchesTags(entity.tags, geom)) {
                    var nearbyGroupID = group.nearby;
                    if (!scoredGroups[nearbyGroupID]) {
                        scoredGroups[nearbyGroupID] = {
                            group: groupManager.group(nearbyGroupID),
                            score: 0
                        };
                    }
                    var entityScore;
                    if (geom === 'area') {
                        // significantly prefer area features that dominate the viewport
                        // (e.g. editing within a park or school grounds)
                        var containedPercent = queryExtent.percentContainedIn(entity.extent(graph));
                        entityScore = Math.max(1, containedPercent * 10);
                    } else {
                        entityScore = 1;
                    }
                    scoredGroups[nearbyGroupID].score += entityScore;
                }
            }
        }

        Object.values(scoredGroups).forEach(function(scoredGroupItem) {
            scoredGroupItem.group.scoredPresets().forEach(function(groupScoredPreset) {
                var combinedScore = groupScoredPreset.score * scoredGroupItem.score;
                if (!scoredPresets[groupScoredPreset.preset.id]) {
                    scoredPresets[groupScoredPreset.preset.id] = {
                        preset: groupScoredPreset.preset,
                        score: combinedScore
                    };
                } else {
                    scoredPresets[groupScoredPreset.preset.id].score += combinedScore;
                }
            });
        });
*/
        return Object.values(scoredPresets).sort(function(item1, item2) {
            return item2.score - item1.score;
        }).map(function(item) {
            return item.preset ? item.preset : item;
        }).filter(function(d) {
            var preset = d.preset || d;
            // skip non-visible
            if (preset.addable && !preset.addable()) return false;

            // skip presets not valid in this country
            if (countryCode && preset.countryCodes && preset.countryCodes.indexOf(countryCode) === -1) return false;

            return preset.defaultAddGeometry(context, geometries);
        }).slice(0, 50);
    }


    function reloadCountryCode() {
        var center = context.map().center();
        var countryCode = countryCoder.iso1A2Code(center);
        if (countryCode) countryCode = countryCode.toLowerCase();
        if (_countryCode !== countryCode) {
            _countryCode = countryCode;
        }
    }

    // the query that was run to
    var _shownQuery = {
        value: null,
        geometry: null,
        countryCode: null
    };

    function updateResultsList() {

        // update only if the browser is visible
        if (!browser.isShown()) return;

        var list = poplistContent.selectAll('.list');
        if (search.empty() || list.empty()) return;

        var value = search.property('value').trim();

        var query = {
            value: value,
            geometry: _shownGeometry.slice(),
            countryCode: _countryCode
        };

        // the results will be the same if the parameters are the same, so don't reload
        if (deepEqual(query, _shownQuery)) return;

        var results;

        if (value.length) {
            results = _presets.search(query.value, query.geometry, query.countryCode).collection
                .filter(function(d) {
                    if (d.members) {
                        return d.members.collection.some(function(preset) {
                            return preset.addable();
                        });
                    }
                    return d.addable();
                });
        } else {
            results = getDefaultResults(query.geometry, query.countryCode);
        }

        list.call(drawList, results);

        list.selectAll('.list-item.focused')
            .classed('focused', false);
        focusListItem(poplistContent.selectAll('.list > .list-item:first-child'), false);

        poplistContent.node().scrollTop = 0;

        var resultCount = results.length;
        poplistFooter.selectAll('.message')
            .text(t('modes.add_feature.' + (resultCount === 1 ? 'result' : 'results'), { count: resultCount }));

        _shownQuery = query;
    }

    function focusListItem(selection, scrollingToShow) {
        if (!selection.empty()) {
            selection.classed('focused', true);
            if (scrollingToShow) {
                // scroll to keep the focused item visible
                scrollPoplistToShow(selection);
            }
        }
    }

    function scrollPoplistToShow(selection) {
        if (selection.empty()) return;

        var node = selection.nodes()[0];
        var scrollableNode = poplistContent.node();

        if (node.offsetTop < scrollableNode.scrollTop) {
            scrollableNode.scrollTop = node.offsetTop;

        } else if (node.offsetTop + node.offsetHeight > scrollableNode.scrollTop + scrollableNode.offsetHeight &&
            node.offsetHeight < scrollableNode.offsetHeight) {
            scrollableNode.scrollTop = node.offsetTop + node.offsetHeight - scrollableNode.offsetHeight;
        }
    }

    function itemForPreset(d) {
        if (d.members) {
            return CategoryItem(d);
        }
        var preset = d.preset || d;
        return AddablePresetItem(preset);
    }

    function drawList(list, rawItems) {

        list.selectAll('.subsection.subitems').remove();

        var dataItems = rawItems.map(function(rawItem) {
            return itemForPreset(rawItem);
        });

        var items = list.selectAll('.list-item')
            .data(dataItems, function(d) { return d.id(); });

        items.order();

        items.exit()
            .remove();

        drawItems(items.enter());

        list.selectAll('.list-item.expanded')
            .classed('expanded', false)
            .selectAll('.label svg.icon use')
            .attr('href', localizer.textDirection() === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward');

        updateForFeatureHiddenState();
    }

    function drawItems(selection) {

        var item = selection
            .append('div')
            .attr('class', 'list-item')
            .attr('id', function(d) { return utilUniqueDomId('preset-browser-list-item-' + d.id()); })
            .on('mouseover', function() {
                poplistContent.selectAll('.list .list-item.focused')
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
            var geometry = d.preset && d.preset.geometry[0];
            if ((d.preset && d.preset.geometry.length !== 1) ||
                (geometry !== 'area' && geometry !== 'line' && geometry !== 'vertex')) {
                geometry = null;
            }
            d3_select(this).call(
                uiPresetIcon(context)
                    .geometry(geometry)
                    .preset(d.preset || d.category)
                    .sizeClass('small')
            );
        });
        var label = row.append('div')
            .attr('class', 'label');

        label.each(function(d) {
            if (d.subitems) {
                d3_select(this)
                    .call(svgIcon((localizer.textDirection() === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward'), 'inline'));
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
            if (!d.preset) return;

            var presetFavorite = uiPresetFavoriteButton(d.preset, null, context, 'accessory');
            d3_select(this).call(presetFavorite.button);
        });
        item.each(function(d) {
            if (!d.preset) return;

            var reference = uiTagReference(d.preset.reference(d.preset.defaultAddGeometry(context, _shownGeometry)), context);

            var thisItem = d3_select(this);
            thisItem.selectAll('.row').call(reference.button, 'accessory', 'info');

            var subsection = thisItem
                .append('div')
                .attr('class', 'subsection reference');
            subsection.call(reference.body);
        });
    }

    function updateForFeatureHiddenState() {

        var listItem = poplistContent.selectAll('.list-item');
        if (listItem.empty()) return;

        // remove existing tooltips
        listItem.selectAll('button.choose').call(uiTooltip().destroyAny);

        listItem.each(function(item, index) {

            if (!item.preset) return;

            var hiddenPresetFeatures;

            for (var i in item.preset.geometry) {
                if (_shownGeometry.indexOf(item.preset.geometry[i]) !== -1) {
                    hiddenPresetFeatures = context.features().isHiddenPreset(item.preset, item.preset.geometry[i]);
                    if (!hiddenPresetFeatures) {
                        break;
                    }
                }
            }

            var button = d3_select(this).selectAll('button.choose');

            d3_select(this).classed('disabled', !!hiddenPresetFeatures);
            button.classed('disabled', !!hiddenPresetFeatures);

            if (!hiddenPresetFeatures) return;

            var isAutoHidden = context.features().autoHidden(hiddenPresetFeatures.key);
            var tooltipIdSuffix = isAutoHidden ? 'zoom' : 'manual';
            var tooltipObj = { features: t('feature.' + hiddenPresetFeatures + '.description') };
            button.call(uiTooltip('dark')
                .title(t('inspector.hidden_preset.' + tooltipIdSuffix, tooltipObj))
                .placement(index < 2 ? 'bottom' : 'top')
            );
        });
    }

    function chooseExpandable(item, itemSelection) {

        var shouldExpand = !itemSelection.classed('expanded');

        itemSelection.classed('expanded', shouldExpand);

        var iconName = shouldExpand ?
            '#iD-icon-down' : (localizer.textDirection() === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward');
        itemSelection.selectAll('.label svg.icon use')
            .attr('href', iconName);

        if (shouldExpand) {
            var subitems = item.subitems();
            var selector = '#' + itemSelection.attr('id') + ' + *';
            item.subsection = d3_select(itemSelection.node().parentNode).insert('div', selector)
                .attr('class', 'subsection subitems');
            var subitemsEnter = item.subsection.selectAll('.list-item')
                .data(subitems)
                .enter();
            drawItems(subitemsEnter);
            updateForFeatureHiddenState();
            scrollPoplistToShow(item.subsection);
        } else {
            item.subsection.remove();
        }
    }

    function CategoryItem(category) {
        var item = {};
        item.id = function() {
            return category.id;
        };
        item.name = function() {
            return category.name();
        };
        item.subsection = d3_select(null);
        item.category = category;
        item.choose = function() {
            var selection = d3_select(this);
            if (selection.classed('disabled')) return;
            chooseExpandable(item, d3_select(selection.node().closest('.list-item')));
        };
        item.subitems = function() {
            return category.members.matchAnyGeometry(_shownGeometry).collection
                .filter(function(preset) {
                    return preset.addable();
                })
                .map(function(preset) {
                    return itemForPreset(preset);
                });
        };
        return item;
    }

    function AddablePresetItem(preset, isSubitem) {
        var item = {};
        item.id = function() {
            return preset.id + isSubitem;
        };
        item.name = function() {
            return preset.name();
        };
        item.isSubitem = isSubitem;
        item.preset = preset;
        item.choose = function() {
            if (d3_select(this).classed('disabled')) return;

            var geometry = preset.defaultAddGeometry(context, _shownGeometry);
            dispatch.call('choose', this, preset, geometry);

            search.node().blur();
        };
        return item;
    }

    return utilRebind(browser, dispatch, 'on');
}
