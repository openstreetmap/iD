import { select as d3_select } from 'd3-selection';

import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';

export type MapStyle = 'wireframe' | 'area_fill' | 'highlight_edits';

export function uiSectionMapStyleOptions(context: iD.Context) {

    const section = (uiSection('fill-area', context) as any)
        .label(() => t.append('map_data.style_options'))
        .disclosureContent(renderDisclosureContent)
        .expandedByDefault(false);

    function renderDisclosureContent(selection: d3.Selection) {
        const container = selection.selectAll<HTMLUListElement, any>('ul.layer-fill-list')
            .data([0]);

        container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-fill-list')
            .merge(container)
            .call(drawListItems, context.map().areaFillOptions, 'radio', 'area_fill', setFill, isActiveFill);

        const container2 = selection.selectAll<HTMLUListElement, any>('ul.layer-visual-diff-list')
            .data([0]);

        container2.enter()
            .append('ul')
            .attr('class', 'layer-list layer-visual-diff-list')
            .merge(container2)
            .call(drawListItems, ['highlight_edits'], 'checkbox', 'visual_diff', toggleHighlightEdited, () =>
                context.surface().classed('highlight-edited')
            );
    }

    function drawListItems(
        selection: d3.Selection<HTMLUListElement>,
        data: MapStyle[],
        type: 'radio' | 'checkbox',
        name: string,
        change: any,
        active: (d: string) => boolean
    ) {
        let items = selection.selectAll<HTMLLIElement, any>('li')
            .data(data);

        // Exit
        items.exit()
            .remove();

        // Enter
        const enter = items.enter()
            .append('li')
            .call((uiTooltip() as any)
                .title((d: MapStyle) => t.append(`${name}.${d}.tooltip`))
                .keys((d: MapStyle) => {
                    let key = (d === 'wireframe' ? t('area_fill.wireframe.key') : null);
                    if (d === 'highlight_edits') key = t('map_data.highlight_edits.key');
                    return key ? [key] : null;
                })
                .placement('top')
            );

        const label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);

        label
            .append('span')
            .each(function(d: string) {
                d3_select(this).call(t.append(`${name}.${d}.description`));
            });

        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active)
            .property('indeterminate', false);
    }

    function isActiveFill(d: string) {
        return context.map().activeAreaFill() === d;
    }

    function toggleHighlightEdited(d3_event: Event) {
        d3_event.preventDefault();
        context.map().toggleHighlightEdited();
    }

    function setFill(ignored: Event, d: string) {
        context.map().activeAreaFill(d);
    }

    context.map()
        .on('changeHighlighting.ui_style, changeAreaFill.ui_style', section.reRender);

    return section;
}
