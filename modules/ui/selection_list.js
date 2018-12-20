import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { modeSelect } from '../modes';
import { osmEntity } from '../osm';
import { svgIcon } from '../svg';
import { utilDisplayName, utilHighlightEntity } from '../util';


export function uiSelectionList(context, selectedIDs) {

    function selectEntity(entity) {
        context.enter(modeSelect(context, [entity.id]));
    }


    function deselectEntity(entity) {
        d3_event.stopPropagation();
        var index = selectedIDs.indexOf(entity.id);
        if (index > -1) {
            selectedIDs.splice(index, 1);
        }
        context.enter(modeSelect(context, selectedIDs));
    }


    function selectionList(selection) {
        selection.classed('selection-list-pane', true);

        var header = selection
            .append('div')
            .attr('class', 'header fillL cf');

        header
            .append('h3')
            .text(t('inspector.multiselect'));

        var listWrap = selection
            .append('div')
            .attr('class', 'inspector-body');

        var list = listWrap
            .append('div')
            .attr('class', 'feature-list cf');

        context.history().on('change.selection-list', drawList);
        drawList();


        function drawList() {
            var entities = selectedIDs
                .map(function(id) { return context.hasEntity(id); })
                .filter(function(entity) { return entity; });

            var items = list.selectAll('.feature-list-item')
                .data(entities, osmEntity.key);

            items.exit()
                .remove();

            // Enter
            var enter = items.enter()
                .append('div')
                .attr('class', 'feature-list-item')
                .on('click', selectEntity);

            enter
                .each(function(d) {
                // highlight the feature in the map while hovering on the list item
                d3_select(this).on('mouseover', function() {
                    utilHighlightEntity(d.id, true, context);
                });
                d3_select(this).on('mouseout', function() {
                    utilHighlightEntity(d.id, false, context);
                });
            });

            var label = enter
                .append('button')
                .attr('class', 'label');

            enter
                .append('button')
                .attr('class', 'close')
                .on('click', deselectEntity)
                .call(svgIcon('#iD-icon-close'));

            label
                .append('span')
                .attr('class', 'entity-geom-icon')
                .call(svgIcon('', 'pre-text'));

            label
                .append('span')
                .attr('class', 'entity-type');

            label
                .append('span')
                .attr('class', 'entity-name');

            // Update
            items = items.merge(enter);

            items.selectAll('.entity-geom-icon use')
                .attr('href', function() {
                    var entity = this.parentNode.parentNode.__data__;
                    return '#iD-icon-' + context.geometry(entity.id);
                });

            items.selectAll('.entity-type')
                .text(function(entity) { return context.presets().match(entity, context.graph()).name(); });

            items.selectAll('.entity-name')
                .text(function(entity) { return utilDisplayName(entity); });
        }
    }

    return selectionList;
}
