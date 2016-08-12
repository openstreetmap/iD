import * as d3 from 'd3';
import { t } from '../util/locale';
import { Entity } from '../core/index';
import { Icon } from '../svg/index';
import { Select } from '../modes/index';
import { displayName } from '../util/index';

export function SelectionList(context, selectedIDs) {

    function selectEntity(entity) {
        context.enter(Select(context, [entity.id]).suppressMenu(true));
    }

    function deselectEntity(entity) {
        d3.event.stopPropagation();
        var index = selectedIDs.indexOf(entity.id);
        if (index > -1) {
            selectedIDs.splice(index, 1);
        }
        context.enter(Select(context, selectedIDs).suppressMenu(true));
    }

    function selectionList(selection) {
        selection.classed('selection-list-pane', true);

        var header = selection.append('div')
            .attr('class', 'header fillL cf');

        header.append('h3')
            .text(t('inspector.multiselect'));

        var listWrap = selection.append('div')
            .attr('class', 'inspector-body');

        var list = listWrap.append('div')
            .attr('class', 'feature-list cf');

        context.history().on('change.selection-list', drawList);
        drawList();

        function drawList() {
            var entities = selectedIDs
                .map(function(id) { return context.hasEntity(id); })
                .filter(function(entity) { return entity; });

            var items = list.selectAll('.feature-list-item')
                .data(entities, Entity.key);

            var enter = items.enter().append('div')
                .attr('class', 'feature-list-item')
                .on('click', selectEntity);

            // Enter
            var label = enter.append('button')
                .attr('class', 'label');

            enter.append('button')
                .attr('class', 'close')
                .on('click', deselectEntity)
                .call(Icon('#icon-close'));

            label.append('span')
                .attr('class', 'entity-geom-icon')
                .call(Icon('', 'pre-text'));

            label.append('span')
                .attr('class', 'entity-type');

            label.append('span')
                .attr('class', 'entity-name');

            // Update
            items.selectAll('.entity-geom-icon use')
                .attr('href', function() {
                    var entity = this.parentNode.parentNode.__data__;
                    return '#icon-' + context.geometry(entity.id);
                });

            items.selectAll('.entity-type')
                .text(function(entity) { return context.presets().match(entity, context.graph()).name(); });

            items.selectAll('.entity-name')
                .text(function(entity) { return displayName(entity); });

            // Exit
            items.exit()
                .remove();
        }
    }

    return selectionList;

}
