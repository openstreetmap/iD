import { select as d3_select } from 'd3-selection';

import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';
import type { coreContext } from '../../core';

export function uiSectionMapFeatures(context: coreContext) {

    var _features = context.features().keys();

    var section = uiSection('map-features', context)
        .label(() => t.append('map_data.map_features'))
        .disclosureContent(renderDisclosureContent)
        .expandedByDefault(false);

    function renderDisclosureContent(selection: d3.Selection<HTMLDivElement>) {

        var container = selection.selectAll<HTMLDivElement, 0>('.layer-feature-list-container')
            .data([0]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'layer-feature-list-container');

        containerEnter
            .append('ul')
            .attr('class', 'layer-list layer-feature-list');

        var footer = containerEnter
            .append('div')
            .attr('class', 'feature-list-links section-footer');

        footer
            .append('a')
            .attr('class', 'feature-list-link')
            .attr('role', 'button')
            .attr('href', '#')
            .call(t.append('issues.disable_all'))
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                context.features().disableAll();
            });

        footer
            .append('a')
            .attr('class', 'feature-list-link')
            .attr('role', 'button')
            .attr('href', '#')
            .call(t.append('issues.enable_all'))
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                context.features().enableAll();
            });

        // Update
        container = container
            .merge(containerEnter);

        container.selectAll<HTMLDivElement, unknown>('.layer-feature-list')
            .call(drawListItems, _features, 'checkbox', 'feature', clickFeature, showsFeature);
    }

    function drawListItems(selection: d3.Selection<HTMLDivElement>, data: unknown[], type: string, name: string, change: (d3_event: Event, d: unknown) => void, active: (d: unknown) => any) {
        var items = selection.selectAll<HTMLLIElement, unknown>('li')
            .data(data);

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .call(uiTooltip<HTMLLIElement>()
                .title(function(d) {
                    var tip = t.append(name + '.' + d + '.tooltip');
                    if (autoHiddenFeature(d)) {
                        var msg = showsLayer('osm') ? t.append('map_data.autohidden') : t.append('map_data.osmhidden');
                        return selection => {
                            selection.call(tip);
                            selection.append('div').call(msg);
                        };
                    }
                    return tip;
                })
                .placement('top')
            );

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);

        label
            .append('span')
            .each(function(d) {
                d3_select(this).call(t.append(name + '.' + d + '.description'));
            });

        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active)
            .property('indeterminate', autoHiddenFeature);
    }

    function autoHiddenFeature(d: unknown) {
        return context.features().autoHidden(d);
    }

    function showsFeature(d: unknown) {
        return context.features().enabled(d);
    }

    function clickFeature(d3_event: Event, d: unknown) {
        context.features().toggle(d);
    }

    function showsLayer(id: string) {
        var layer = context.layers().layer(id);
        return layer && layer.enabled();
    }

    // add listeners
    context.features()
        .on('change.map_features', section.reRender);

    return section;
}
