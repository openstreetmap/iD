import { debounce } from 'es-toolkit';
import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import {
    select as d3_select
} from 'd3-selection';

import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';
import type { coreContext } from '../../core';
import type { Placement } from '../popover';
import type { TileSource } from '../../renderer/background_source';

export function uiSectionOverlayList(context: coreContext) {

    var section = uiSection('overlay-list', context)
        .label(() => t.append('background.overlays'))
        .disclosureContent(renderDisclosureContent);

    var _overlayList = d3_select<HTMLUListElement, 0>(null!);

    function setTooltips(selection: d3.Selection<HTMLLIElement>) {
        selection.each(function(d, i, nodes) {
            var item = d3_select(this).select<HTMLLabelElement>('label');
            var span = item.select('span');
            var placement: Placement = (i < nodes.length / 2) ? 'bottom' : 'top';
            var description = d.description();
            var isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));

            item.call(uiTooltip<HTMLLabelElement>().destroyAny);

            if (description || isOverflowing) {
                item.call(uiTooltip<HTMLLabelElement>()
                    .placement(placement)
                    .title(() => description || d.name())
                );
            }
        });
    }

    function updateLayerSelections(selection: d3.Selection<HTMLUListElement>) {
        function active(d: TileSource) {
            return context.background().showsLayer(d);
        }

        selection.selectAll<HTMLLIElement, TileSource>('li')
            .classed('active', active)
            .call(setTooltips)
            .selectAll('input')
            .property('checked', active);
    }


    function chooseOverlay(d3_event: Event, d: TileSource) {
        d3_event.preventDefault();
        context.background().toggleOverlayLayer(d);
        _overlayList.call(updateLayerSelections);
        (document.activeElement as HTMLElement).blur();
    }

    function drawListItems(layerList: d3.Selection<HTMLUListElement>, type: string, change: (d3_event: Event, d: TileSource) => void, filter: (item: TileSource) => boolean) {
        var sources = context.background()
            .sources(context.map().extent(), context.map().zoom(), true)
            .filter(filter);

        var layerLinks = layerList.selectAll<HTMLLIElement, TileSource>('li')
            .data(sources, function(d) { return d.name(); });

        layerLinks.exit()
            .remove();

        var enter = layerLinks.enter()
            .append('li');

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', 'layers')
            .on('change', change);

        label
            .append('span')
            .each(function(d) { d.label()(d3_select(this)); });


        layerList.selectAll<HTMLLIElement, TileSource>('li')
            .sort(sortSources);

        layerList
            .call(updateLayerSelections);


        function sortSources(a: TileSource, b: TileSource) {
            return a.best() && !b.best() ? -1
                : b.best() && !a.best() ? 1
                : d3_descending(a.area(), b.area()) || d3_ascending(a.name(), b.name()) || 0;
        }
    }

    function renderDisclosureContent(selection: d3.Selection<HTMLDivElement>) {

        var container = selection.selectAll<HTMLUListElement, 0>('.layer-overlay-list')
            .data<0>([0]);

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
            debounce(function() {
                // layers in-view may have changed due to map move
                window.requestIdleCallback(section.reRender);
            }, 1000)
        );

    return section;
}
