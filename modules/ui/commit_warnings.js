import { t } from '../util/locale';
import { modeSelect } from '../modes';
import { svgIcon } from '../svg';
import { tooltip } from '../util/tooltip';
import { utilEntityOrMemberSelector } from '../util';


export function uiCommitWarnings(context) {

    function commitWarnings(selection) {

        var changes = context.history().changes();
        var warnings = context.history().validate(changes);

        var container = selection.selectAll('.warning-section')
            .data(warnings.length ? [0] : []);

        container.exit()
            .remove();

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'modal-section warning-section fillL2');

        containerEnter
            .append('h3')
            .text(t('commit.warnings'));

        containerEnter
            .append('ul')
            .attr('class', 'changeset-list');

        container = containerEnter
            .merge(container);


        var items = container.select('ul').selectAll('li')
            .data(warnings);

        items.exit()
            .remove();

        var itemsEnter = items.enter()
            .append('li')
            .attr('class', 'warning-item');

        itemsEnter
            .call(svgIcon('#icon-alert', 'pre-text'));

        itemsEnter
            .append('strong')
            .text(function(d) { return d.message; });

        itemsEnter.filter(function(d) { return d.tooltip; })
            .call(tooltip()
                .title(function(d) { return d.tooltip; })
                .placement('top')
            );

        items = itemsEnter
            .merge(items);

        items
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', warningClick);


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


        function warningClick(d) {
            if (d.entity) {
                context.map().zoomTo(d.entity);
                context.enter(modeSelect(context, [d.entity.id]));
            }
        }

    }


    return commitWarnings;
}
