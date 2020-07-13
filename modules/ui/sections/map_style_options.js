import {
    event as d3_event
} from 'd3-selection';

import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';

export function uiSectionMapStyleOptions(context) {

    var section = uiSection('fill-area', context)
        .title(t('map_data.style_options'))
        .disclosureContent(renderDisclosureContent)
        .expandedByDefault(false);

    function renderDisclosureContent(selection) {
        var container = selection.selectAll('.layer-fill-list')
            .data([0]);

        container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-fill-list')
            .merge(container)
            .call(drawListItems, context.map().areaFillOptions, 'radio', 'area_fill', setFill, isActiveFill);

        var container2 = selection.selectAll('.layer-visual-diff-list')
            .data([0]);

        container2.enter()
            .append('ul')
            .attr('class', 'layer-list layer-visual-diff-list')
            .merge(container2)
            .call(drawListItems, ['highlight_edits'], 'checkbox', 'visual_diff', toggleHighlightEdited, function() {
                return context.surface().classed('highlight-edited');
            });
    }

    function drawListItems(selection, data, type, name, change, active) {
        var items = selection.selectAll('li')
            .data(data);

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .call(uiTooltip()
                .title(function(d) {
                    return t(name + '.' + d + '.tooltip');
                })
                .keys(function(d) {
                    var key = (d === 'wireframe' ? t('area_fill.wireframe.key') : null);
                    if (d === 'highlight_edits') key = t('map_data.highlight_edits.key');
                    return key ? [key] : null;
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
            .text(function(d) { return t(name + '.' + d + '.description'); });

        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active)
            .property('indeterminate', false);
    }

    function isActiveFill(d) {
        return context.map().activeAreaFill() === d;
    }

    function toggleHighlightEdited() {
        d3_event.preventDefault();
        context.map().toggleHighlightEdited();
    }

    function setFill(d) {
        context.map().activeAreaFill(d);
    }

    context.map()
        .on('changeHighlighting.ui_style, changeAreaFill.ui_style', section.reRender);

    return section;
}
