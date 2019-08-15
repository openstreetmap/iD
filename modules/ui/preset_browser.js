import {
    event as d3_event,
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { services } from '../services';
import { svgIcon } from '../svg/index';
import { tooltip } from '../util/tooltip';
import { uiTagReference } from './tag_reference';
import { uiPresetFavoriteButton } from './preset_favorite_button';
import { uiPresetIcon } from './preset_icon';
import { groupManager } from '../entities/group_manager';
import { utilKeybinding, utilNoAuto } from '../util';

export function uiPresetBrowser(context, allowedGeometry, onChoose, onCancel) {

    // multiple preset browsers could be instantiated at once, give each a unique ID
    var uid = (new Date()).getTime().toString();

    var presets;

    var shownGeometry = [];
    updateShownGeometry(allowedGeometry);

    var popover = d3_select(null),
        search = d3_select(null),
        popoverContent = d3_select(null);

    var _countryCode;

    var browser = {};

    browser.render = function(selection) {

        popover = selection.selectAll('.preset-browser')
            .data([0]);

        var popoverEnter = popover
            .enter()
            .append('div')
            .attr('class', 'preset-browser popover fillL hide');

        var header = popoverEnter
            .append('div')
            .attr('class', 'popover-header');

        header
            .append('input')
            .attr('class', 'search-input')
            .attr('placeholder', t('modes.add_feature.search_placeholder'))
            .attr('type', 'search')
            .call(utilNoAuto)
            .on('blur', function() {
                context.features()
                    .on('change.preset-browser.' + uid , null);

                popover.classed('hide', true);
                if (onCancel) onCancel();
            })
            .on('keypress', keypress)
            .on('keydown', keydown)
            .on('input', updateResultsList);

        header
            .call(svgIcon('#iD-icon-search', 'search-icon pre-text'));

        popoverEnter
            .append('div')
            .attr('class', 'popover-content')
            .on('mousedown', function() {
                // don't blur the search input (and thus close results)
                d3_event.preventDefault();
                d3_event.stopPropagation();
            })
            .append('div')
            .attr('class', 'list');

        var footer = popoverEnter
            .append('div')
            .attr('class', 'popover-footer')
            .on('mousedown', function() {
                // don't blur the search input (and thus close results)
                d3_event.preventDefault();
                d3_event.stopPropagation();
            });

        footer.append('div')
            .attr('class', 'message');

        footer.append('div')
            .attr('class', 'filter-wrap');

        popover = popoverEnter.merge(popover);
        search = popover.selectAll('.search-input');
        popoverContent = popover.selectAll('.popover-content');

        renderFilterButtons();
    };

    browser.isShown = function() {
        return popover && !popover.empty() && !popover.classed('hide');
    };

    browser.show = function() {
        popover.classed('hide', false);
        search.node().focus();
        search.node().setSelectionRange(0, search.property('value').length);

        updateResultsList();

        context.features()
            .on('change.preset-browser.' + uid , updateForFeatureHiddenState);

        // reload in case the user moved countries
        reloadCountryCode();
    };

    browser.hide = function() {
        search.node().blur();
    };

    function renderFilterButtons() {
        var selection = popover.select('.popover-footer .filter-wrap');

        var geomForButtons = allowedGeometry.slice();
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
                if (shownGeometry.length === 0) {
                    updateShownGeometry(allowedGeometry);
                    toggleShownGeometry(d);
                }
                updateFilterButtonsStates();
                updateResultsList();
            });

        updateFilterButtonsStates();
    }


    browser.setAllowedGeometry = function(array) {
        allowedGeometry = array;
        updateShownGeometry(array);
        renderFilterButtons();
        updateResultsList();
    };


    function updateShownGeometry(geom) {
        shownGeometry = geom.slice().sort();
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
        popover.selectAll('.popover-footer button.filter')
            .classed('active', function(d) {
                return shownGeometry.indexOf(d) !== -1;
            });
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

    function getDefaultResults() {

        var graph = context.graph();

        var superGroups = groupManager.groupsWithNearby;
        var scoredGroups = {};
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

        return Object.values(scoredPresets).sort(function(item1, item2) {
            return item2.score - item1.score;
        }).map(function(item) {
            return item.preset ? item.preset : item;
        }).filter(function(d) {
            var preset = d.preset || d;
            // skip non-visible
            if (preset.visible && !preset.visible()) return false;

            // skip presets not valid in this country
            if (_countryCode && preset.countryCodes && preset.countryCodes.indexOf(_countryCode) === -1) return false;

            for (var i in shownGeometry) {
                if (preset.geometry.indexOf(shownGeometry[i]) !== -1) {
                    // skip currently hidden features
                    if (!context.features().isHiddenPreset(preset, shownGeometry[i])) return true;
                }
            }
            return false;
        }).slice(0, 50);
    }


    function reloadCountryCode() {
        if (!services.geocoder) return;

        var center = context.map().center();
        services.geocoder.countryCode(center, function countryCallback(err, countryCode) {
            if (_countryCode !== countryCode) {
                _countryCode = countryCode;
                updateResultsList();
            }
        });
    }

    function getRawResults() {
        if (search.empty()) return [];

        var value = search.property('value');
        var results;
        if (value.length) {
            results = presets.search(value, shownGeometry, _countryCode).collection
                .filter(function(d) {
                    if (d.members) {
                        return d.members.collection.some(function(preset) {
                            return preset.visible();
                        });
                    }
                    return d.visible();
                });
        } else {
            results = getDefaultResults();
        }
        return results;
    }

    function updateResultsList() {

        if (!browser.isShown()) return;

        var list = popoverContent.selectAll('.list');

        if (search.empty() || list.empty()) return;

        var results = getRawResults();
        list.call(drawList, results);

        list.selectAll('.list-item.focused')
            .classed('focused', false);
        focusListItem(popover.selectAll('.list > .list-item:first-child'), false);

        popoverContent.node().scrollTop = 0;

        var resultCount = results.length;
        popover.selectAll('.popover-footer .message')
            .text(t('modes.add_feature.' + (resultCount === 1 ? 'result' : 'results'), { count: resultCount }));
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
                popover.selectAll('.list .list-item.focused')
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
            var geometry = d.preset.geometry[0];
            if (d.preset.geometry.length !== 1 ||
                (geometry !== 'area' && geometry !== 'line' && geometry !== 'vertex')) {
                geometry = null;
            }
            d3_select(this).call(
                uiPresetIcon(context)
                    .geometry(geometry)
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
            if (d.preset) {
                var presetFavorite = uiPresetFavoriteButton(d.preset, null, context, 'accessory');
                d3_select(this).call(presetFavorite.button);
            }
        });
        item.each(function(d) {
            if ((d.preset && (!d.isSubitem || d.isInNameGroup)) || d.geometries) {

                var reference = uiTagReference(d.preset.reference(d.preset.defaultAddGeometry(context, shownGeometry)), context);

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

        var listItem = d3_selectAll('.add-feature .popover .list-item');

        // remove existing tooltips
        listItem.selectAll('button.choose').call(tooltip().destroyAny);

        listItem.each(function(item, index) {
            if (!item.geometry) return;

            var hiddenPresetFeatures = context.features().isHiddenPreset(item.preset, item.geometry);
            var isHiddenPreset = !!hiddenPresetFeatures;

            var button = d3_select(this).selectAll('button.choose');

            d3_select(this).classed('disabled', isHiddenPreset);
            button.classed('disabled', isHiddenPreset);

            if (isHiddenPreset) {
                var isAutoHidden = context.features().autoHidden(hiddenPresetFeatures.key);
                var tooltipIdSuffix = isAutoHidden ? 'zoom' : 'manual';
                var tooltipObj = { features: hiddenPresetFeatures.title };
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
            return preset.members.matchAnyGeometry(shownGeometry).collection
                .filter(function(preset) {
                    return preset.visible();
                })
                .map(function(preset) {
                    return itemForPreset(preset);
                });
        };
        return item;
    }

    function AddablePresetItem(preset, isSubitem, isInNameGroup) {
        var item = {};
        item.id = function() {
            return preset.id + isSubitem;
        };
        item.name = function() {
            return preset.name();
        };
        item.isInNameGroup = isInNameGroup;
        item.isSubitem = isSubitem;
        item.preset = preset;
        item.choose = function() {
            if (d3_select(this).classed('disabled')) return;

            if (onChoose) onChoose(preset, preset.defaultAddGeometry(context, shownGeometry));

            search.node().blur();
        };
        return item;
    }

    // load the initial country code
    reloadCountryCode();

    return browser;
}
