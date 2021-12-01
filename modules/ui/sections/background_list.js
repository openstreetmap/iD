import _debounce from 'lodash-es/debounce';
import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import {
    select as d3_select
} from 'd3-selection';

import { prefs } from '../../core/preferences';
import { t, localizer } from '../../core/localizer';
import { utilSortString } from '../../util/util';
import { uiTooltip } from '../tooltip';
import { svgIcon } from '../../svg/icon';
import { uiCmd } from '../cmd';
import { uiSettingsCustomBackground } from '../settings/custom_background';
import { uiSection } from '../section';

export function uiSectionBackgroundList(context) {

    const categoryGroups = [
        { id: 'photo', sort: 1, label: 'photo', disclosureExpanded: true },
        { id: 'map', sort: 3, label: 'map', disclosureExpanded: true },
        { id: 'qa', sort: 5, label: 'qa' },
        { id: 'osm', sort: 6, label: 'osm' },
        { id: 'other', sort: 8, label: 'other' },
        { id: 'builtin', sort: 9, disclosure: false }
    ].reduce((acc, cur) => { acc[cur.id] = cur; return acc; }, {});

    const _eliCategoryMappings = {
        'photo': categoryGroups.photo,
        'historicphoto': categoryGroups.photo,
        'map': categoryGroups.map,
        'historicmap': categoryGroups.map,
        'elevation': categoryGroups.map,
        'osmbasedmap': categoryGroups.osm,
        'qa': categoryGroups.qa,
        'other': categoryGroups.other
    };

    const _layerIdMappings = {
        'none': categoryGroups.builtin,
        'custom': categoryGroups.builtin,
        'mapbox_locator_overlay': categoryGroups.builtin,
        'osm-gps': categoryGroups.builtin
    };

    function categoryMapping(layer) {
        return _layerIdMappings[layer && layer.id] ||
               _eliCategoryMappings[layer && layer.category] ||
               categoryGroups.photo; // default = photo
    }

    var _backgroundLists = {};

    var _customSource = context.background().findSource('custom');

    var _settingsCustomBackground = uiSettingsCustomBackground(context)
        .on('change', customChanged);

    var _sources = updateSources();

    var sections = (function() {
        var groupCounts = getGroupCounts();
        return Object.keys(categoryGroups)
            .map(groupId => categoryGroups[groupId])
            .sort((a,b) => d3_ascending(a.sort, b.sort))
            .map(group => {
                var section = uiSection('background-list-' + group.id, context)
                    .classes('background-list');
                section._categoryGroup = group;
                if (group.disclosure !== false) {
                    return group.section = section
                        .label(sectionLabelHtml(group, groupCounts[group.id]))
                        .disclosureContent(selection => renderContent(selection, group))
                        .disclosureExpanded(group.disclosureExpanded
                            || categoryMapping(context.background().baseLayerSource()).id === group.id
                            || context.background().overlayLayerSources().map(categoryMapping).some(overlayGroup => overlayGroup.id === group.id));
                } else {
                    return group.section = section.content(selection => renderContent(selection, group));
                }
            });
    })();

    var section = uiSection('imagery-list', context).content(selection =>
        sections.forEach(section => section.render(selection)));

    function previousBackgroundID() {
        return prefs('background-last-used-toggle');
    }

    function sectionLabelHtml(group, count) {
        var html = t.html('background.backgrounds.' + group.label);
        if (count) {
            html += ' (' + count + ')';
        }
        return html;
    }

    function renderContent(selection, group) {
        // the background list
        var container = selection.selectAll('.layer-background-list')
            .data([0]);

        _backgroundLists[group.id] = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-background-list')
            .attr('dir', 'auto')
            .merge(container);

        _backgroundLists[group.id].call(drawListItems, function(d3_event, d) {
            d3_event.preventDefault();
            chooseBackground(d);
        }, function(d) {
            return categoryMapping(d).id === group.id;
        });
    }

    function setTooltips(selection) {
        selection.each(function(d, i, nodes) {
            var item = d3_select(this).select('label');
            var span = item.select('span');
            var placement = (i < nodes.length / 2) ? 'bottom' : 'top';
            var description = d.description();
            var isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));

            item.call(uiTooltip().destroyAny);

            if (d.id === previousBackgroundID()) {
                item.call(uiTooltip()
                    .placement(placement)
                    .title('<div>' + t.html('background.switch') + '</div>')
                    .keys([uiCmd('⌘' + t('background.key'))])
                );
            } else if (description || isOverflowing) {
                item.call(uiTooltip()
                    .placement(placement)
                    .title(description || d.label())
                );
            }
        });
    }

    function updateSources() {
        return context.background()
            .sources(context.map().extent(), context.map().zoom(), true)
            .filter(source => !source.isHidden())
            .sort(function(a, b) {
                return d3_ascending(categoryMapping(a).sort, categoryMapping(b).sort) ||
                       d3_descending(a.best() ? 1 : 0, b.best() ? 1 : 0) ||
                       d3_ascending(a.overlay ? 1 : 0, b.overlay ? 1 : 0) ||
                       d3_ascending(Math.floor(Math.log(Math.abs(a.area()))/3), Math.floor(Math.log(Math.abs(b.area()))/3)) ||
                       d3_descending(a.endDate || a.startDate, b.endDate || b.startDate) ||
                       utilSortString(localizer.localeCode()) || 0;
            });
    }

    function drawListItems(layerList, change, filter) {
        var sources = _sources
            .filter(filter);

        var layerLinks = layerList.selectAll('li')
            // We have to be a bit inefficient about reordering the list since
            // arrow key navigation of radio values likes to work in the order
            // they were added, not the display document order.
            .data(sources, function(d, i) { return d.id + '---' + i; });

        layerLinks.exit()
            .remove();

        var enter = layerLinks.enter()
            .append('li')
            .classed('layer-custom', function(d) { return d.id === 'custom'; });

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', d => d.overlay ? 'checkbox' : 'radio')
            .attr('name', 'background-layer')
            .attr('value', function(d) {
                return d.id;
            })
            .on('change', change);

        const showThirdPartyIcons = prefs('preferences.privacy.thirdpartyicons') || 'true';
        var showIcons = showThirdPartyIcons === 'true';
        label
            .append('span')
            .style('background-image', d => showIcons && d.icon !== undefined ? 'url(' + d.icon + ')' : undefined)
            .classed('imagery-show-icons', showIcons)
            .html(function(d) { return d.label(); });

        enter.filter(function(d) { return d.id === 'custom'; })
            .append('button')
            .attr('class', 'layer-browse')
            .call(uiTooltip()
                .title(t.html('settings.custom_background.tooltip'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                editCustom();
            })
            .call(svgIcon('#iD-icon-more'));

        enter.filter(function(d) { return d.category && d.category.match(/^historic/); })
            .append('div')
            .attr('class', 'stamp')
            .call(svgIcon('#iD-icon-info'))
            .call(uiTooltip()
                .title(t.html('background.historic_imagery'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            );
        enter.filter(function(d) { return d.best(); })
            .append('div')
            .attr('class', 'stamp')
            .call(svgIcon('#maki-star-stroked-11'))
            .call(uiTooltip()
                .title(t.html('background.best_imagery'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            );
        enter.filter(function(d) { return d.area() > 1E14; })
            .append('div')
            .attr('class', 'stamp')
            .call(svgIcon('#maki-globe-11'))
            .call(uiTooltip()
                .title(t.html('background.global_imagery'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            );

        layerList
            .call(updateLayerSelections);
    }

    function updateLayerSelections(selection) {
        function active(d) {
            return context.background().showsLayer(d);
        }

        selection.selectAll('li')
            .classed('active', active)
            .classed('switch', function(d) { return d.id === previousBackgroundID(); })
            .call(setTooltips)
            .selectAll('input')
            .property('checked', active);
    }


    function chooseBackground(d) {
        if (d.id === 'custom' && !d.template()) {
            return editCustom();
        }

        if (d.overlay) {
            context.background().toggleOverlayLayer(d);
            document.activeElement.blur();
        } else {
            var previousBackground = context.background().baseLayerSource();
            prefs('background-last-used-toggle', previousBackground.id);
            prefs('background-last-used', d.id);
            context.background().baseLayerSource(d);
        }
    }


    function customChanged(d) {
        if (d && d.template) {
            _customSource.template(d.template);
            chooseBackground(_customSource);
        } else {
            _customSource.template('');
            chooseBackground(context.background().findSource('none'));
        }
    }


    function editCustom() {
        context.container()
            .call(_settingsCustomBackground);
    }

    function getGroupCounts() {
        var groupCounts = {};
        _sources.forEach(source => {
            var groupId = categoryMapping(source).id;
            groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
        });
        return groupCounts;
    }


    context.background()
        .on('change.background_list', function() {
            // update headings
            var groupCounts = getGroupCounts();
            sections.forEach(section => {
                var count = groupCounts[section._categoryGroup.id];
                section.shouldDisplay(count > 0);
                if (section._categoryGroup.disclosure !== false) {
                    (section.disclosure() || section).label(sectionLabelHtml(section._categoryGroup, count));
                }
            });
            // update content
            Object.keys(_backgroundLists)
                .map(groupId => _backgroundLists[groupId])
                .map(backgroundList => backgroundList.call(updateLayerSelections));
        });

    context.map()
        .on('move.background_list',
            _debounce(() => window.requestIdleCallback(() => {
                // layers in-view may have changed due to map move
                _sources = updateSources();
                var groupCounts = getGroupCounts();
                sections.forEach(section => {
                    var count = groupCounts[section._categoryGroup.id];
                    section.shouldDisplay(count > 0);
                    if (section._categoryGroup.disclosure !== false) {
                        (section.disclosure() || section).label(sectionLabelHtml(section._categoryGroup, count));
                    }
                    section.reRender();
                });
            }), 1000)
        );

    function chooseBackgroundAtOffset(offset) {
        const backgrounds = _sources.filter(d => {
            var group = categoryMapping(d);
            return !d.overlay &&
                d.id !== 'custom' &&
                (group.disclosure === false || group.section.disclosure().expanded())
        });
        const currentBackground = context.background().baseLayerSource();
        const foundIndex = backgrounds.indexOf(currentBackground);
        if (foundIndex === -1) {
            // Can't find the current background, so just do nothing
            return;
        }
    
        let nextBackgroundIndex = (foundIndex + offset + backgrounds.length) % backgrounds.length;
        let nextBackground = backgrounds[nextBackgroundIndex];
        chooseBackground(nextBackground);
    }

    context.keybinding()
        .on(t('background.next_background.key'), () => chooseBackgroundAtOffset(1))
        .on(t('background.previous_background.key'), () => chooseBackgroundAtOffset(-1));

    return section;
}
