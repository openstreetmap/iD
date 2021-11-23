import _debounce from 'lodash-es/debounce';
import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import {
    select as d3_select
} from 'd3-selection';

import { prefs } from '../../core/preferences';
import { t, localizer } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { svgIcon } from '../../svg/icon';
import { uiCmd } from '../cmd';
import { uiSettingsCustomBackground } from '../settings/custom_background';
import { uiSection } from '../section';

export function uiSectionBackgroundList(context) {

    const categoryGroups = [
        { id: 'photo', weight: 1, label: 'photo', expanded: true },
        { id: 'map', weight: 3, label: 'map', expanded: true },
        { id: 'osm', weight: 7, label: 'osm' },
        { id: 'other', weight: 5, label: 'other', expanded: true }
    ].reduce((acc, cur) => { acc[cur.id] = cur; return acc; }, {});

    var _backgroundList = d3_select(null);

    var _customSource = context.background().findSource('custom');

    var _settingsCustomBackground = uiSettingsCustomBackground(context)
        .on('change', customChanged);

    var _sources = updateSources();

    var sections = (function() {
        var groupCounts = getGroupCounts();
        return Object.keys(categoryGroups).map(groupId => categoryGroups[groupId]).map(group =>
            uiSection('background-list-' + group.id, context)
                .classes('background-list')
                .label(sectionLabelHtml(group, groupCounts[group.id]))
                .disclosureContent(selection => renderDisclosureContent(selection, group))
                .disclosureExpanded(group.expanded || categoryMapping(context.background().baseLayerSource()).id === group.id)
        );
    })();

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

    function renderDisclosureContent(selection, group) {
        // the background list
        var container = selection.selectAll('.layer-background-list')
            .data([0]);

        _backgroundList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-background-list')
            .attr('dir', 'auto')
            .merge(container);

        _backgroundList.call(drawListItems, function(d3_event, d) {
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

    function categoryMapping(layer) {
        var categoryWeights = {
            'photo': categoryGroups.photo,
            'historicphoto': categoryGroups.photo,
            'map': categoryGroups.map,
            'historicmap': categoryGroups.map,
            'elevation': categoryGroups.map,
            'osmbasedmap': categoryGroups.osm,
            'qa': categoryGroups.osm,
            'other': categoryGroups.other
        };
        var layerIdWeights = {
            'none': categoryGroups.other,
            'custom': categoryGroups.other
        };
        return layerIdWeights[layer && layer.id] ||
               categoryWeights[layer && layer.category] ||
               categoryGroups.photo; // default = photo
    }

    function updateSources() {
        return context.background()
            .sources(context.map().extent(), context.map().zoom(), true)
            .filter(source => !source.isHidden());
    }

    function drawListItems(layerList, change, filter) {
        var sources = _sources
            .filter(filter)
            .sort(function(a, b) {
                return d3_descending(a.best ? 1 : 0, b.best ? 1 : 0) ||
                       d3_ascending(a.overlay ? 1 : 0, b.overlay ? 1 : 0) ||
                       d3_ascending(Math.floor(Math.log(a.area())/3), Math.floor(Math.log(b.area())/3)) ||
                       d3_descending(a.endDate, b.endDate) ||
                       d3_ascending(a.name(), b.name()) || 0;
            });

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

        label
            .append('span')
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

        enter.filter(function(d) { return d.best(); })
            .append('div')
            .attr('class', 'stamp')
            .call(uiTooltip()
                .title(t.html('background.best_imagery'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .append('span')
            .html('&#9733;'); // ★
        enter.filter(function(d) { return d.area() > 1E14; })
            .append('div')
            .attr('class', 'stamp')
            .call(uiTooltip()
                .title(t.html('background.global_imagery'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .append('span')
            .html('&#127760;'); // 🌐

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
            _backgroundList.call(updateLayerSelections);
        });

    context.map()
        .on('move.background_list',
            _debounce(() => window.requestIdleCallback(() => {
                // layers in-view may have changed due to map move
                _sources = updateSources();
                var groupCounts = getGroupCounts();
                sections.forEach(section => {
                    section.reRender();
                    Object.keys(categoryGroups)
                        .filter(groupId => section.id === 'background-list-' + groupId)
                        .forEach(groupId => {
                            var count = groupCounts[groupId];
                            section.shouldDisplay(count > 0);
                            section.disclosure().label(sectionLabelHtml(categoryGroups[groupId], count));
                        });
                });
            }), 1000)
        );

    return sections;
}
