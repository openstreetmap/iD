import * as d3 from 'd3';
import { t } from '../util/locale';
import { svgIcon } from '../svg';
import {
    utilDisplayName,
    utilDisplayType,
    utilEntityOrMemberSelector
} from '../util';


export function uiCommitChanges(context) {

    function commitChanges(selection) {

        var summary = context.history().difference().summary();

        var container = selection.selectAll('.modal-section.commit-section')
            .data([0]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'commit-section modal-section fillL2');

        containerEnter
            .append('h3')
            .text(t('commit.changes', { count: summary.length }));

        containerEnter
            .append('ul')
            .attr('class', 'changeset-list');

        container = containerEnter
            .merge(container);


        var items = container.select('ul').selectAll('li')
            .data(summary);

        var itemsEnter = items.enter()
            .append('li')
            .attr('class', 'change-item');

        itemsEnter
            .each(function(d) {
                d3.select(this)
                    .call(svgIcon('#icon-' + d.entity.geometry(d.graph), 'pre-text ' + d.changeType));
            });

        itemsEnter
            .append('span')
            .attr('class', 'change-type')
            .text(function(d) { return t('commit.' + d.changeType) + ' '; });

        itemsEnter
            .append('strong')
            .attr('class', 'entity-type')
            .text(function(d) {
                var matched = context.presets().match(d.entity, d.graph);
                return (matched && matched.name()) || utilDisplayType(d.entity.id);
            });

        itemsEnter
            .append('span')
            .attr('class', 'entity-name')
            .text(function(d) {
                var name = utilDisplayName(d.entity) || '',
                    string = '';
                if (name !== '') {
                    string += ':';
                }
                return string += ' ' + name;
            });

        itemsEnter
            .style('opacity', 0)
            .transition()
            .style('opacity', 1);

        items = itemsEnter
            .merge(items);

        items
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', zoomToEntity);


        function mouseover(d) {
            if (d.entity) {
                context.surface().selectAll(
                    utilEntityOrMemberSelector([d.entity.id], context.graph())
                ).classed('hover', true);
            }
        }


        function mouseout() {
            context.surface().selectAll('.hover')
                .classed('hover', false);
        }


        function zoomToEntity(change) {
            var entity = change.entity;
            if (change.changeType !== 'deleted' &&
                context.graph().entity(entity.id).geometry(context.graph()) !== 'vertex') {
                context.map().zoomTo(entity);
                context.surface().selectAll(utilEntityOrMemberSelector([entity.id], context.graph()))
                    .classed('hover', true);
            }
        }
    }


    return commitChanges;
}
