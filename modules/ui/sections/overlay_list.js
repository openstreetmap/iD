import _debounce from 'lodash-es/debounce';
import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import {
    select as d3_select
} from 'd3-selection';

import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';

export function uiSectionOverlayList(context) {

    const section = uiSection('overlay-list', context)
        .label(() => t.append('background.overlays'))
        .disclosureContent(renderDisclosureContent);

    let _overlayList = d3_select(null);

    function setTooltips(selection) {
        selection.each(function(d, i, nodes) {
            const item = d3_select(this).select('label');
            const span = item.select('span');
            const placement = (i < nodes.length / 2) ? 'bottom' : 'top';
            const description = d.description();
            const isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));

            item.call(uiTooltip().destroyAny);

            if (description || isOverflowing) {
                item.call(uiTooltip()
                    .placement(placement)
                    .title(() => description || d.name())
                );
            }
        });
    }

    function updateLayerSelections(selection) {
        function active(d) {
            return context.background().showsLayer(d);
        }

        selection.selectAll('li')
            .classed('active', active)
            .call(setTooltips)
            .selectAll('input')
            .property('checked', active);
    }


    function chooseOverlay(d3_event, d) {
        d3_event.preventDefault();
        context.background().toggleOverlayLayer(d);
        _overlayList.call(updateLayerSelections);
        document.activeElement.blur();
    }

    function drawListItems(layerList, type, change, filter) {
        const sources = context.background()
            .sources(context.map().extent(), context.map().zoom(), true)
            .filter(filter);

        const layerLinks = layerList.selectAll('li')
            .data(sources, function(d) { return d.name(); });

        layerLinks.exit()
            .remove();

        const enter = layerLinks.enter()
            .append('li');

        const label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', 'layers')
            .on('change', change);

        label
            .append('span')
            .each(function(d) { d.label()(d3_select(this)); });


        layerList.selectAll('li')
            .sort(sortSources);

        layerList
            .call(updateLayerSelections);


        function sortSources(a, b) {
            return a.best() && !b.best() ? -1
                : b.best() && !a.best() ? 1
                : d3_descending(a.area(), b.area()) || d3_ascending(a.name(), b.name()) || 0;
        }
    }

    function renderDisclosureContent(selection) {

        const container = selection.selectAll('.layer-overlay-list')
            .data([0]);

        _overlayList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-overlay-list')
            .attr('dir', 'auto')
            .merge(container);

        _overlayList
            .call(drawListItems, 'checkbox', chooseOverlay, function(d) { return !d.isHidden() && d.overlay; });
    }

    context.map()
        .on('move.overlay_list',
            _debounce(function() {
                // layers in-view may have changed due to map move
                window.requestIdleCallback(section.reRender);
            }, 1000)
        );

    return section;
}
