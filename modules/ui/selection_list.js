import { event as d3_event, select as d3_select } from 'd3-selection';

import { modeSelect } from '../modes/select';
import { osmEntity } from '../osm';
import { svgIcon } from '../svg/icon';
import { utilDisplayName, utilHighlightEntities } from '../util';


export function uiSelectionList(context) {

    var selectedIDs = [];


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

        var list = selection.selectAll('.feature-list')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'feature-list');

        context.history()
            .on('change.selectionList', function(difference) {
                if (difference) drawList();
            });

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
                    d3_select(this).on('mouseover', function() {
                        utilHighlightEntities([d.id], true, context);
                    });
                    d3_select(this).on('mouseout', function() {
                        utilHighlightEntities([d.id], false, context);
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

    selectionList.setSelectedIDs = function(val) {
        selectedIDs = val;
        return selectionList;
    };

    return selectionList;
}
