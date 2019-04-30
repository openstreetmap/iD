import { t } from '../util/locale';
import { modeSelect } from '../modes/select';
import { svgIcon } from '../svg/icon';
import { tooltip } from '../util/tooltip';
import { utilEntityOrMemberSelector } from '../util';


export function uiCommitWarnings(context) {

    function commitWarnings(selection) {
        var issuesBySeverity = context.validator()
            .getIssuesBySeverity({ what: 'edited', where: 'all' });

        for (var severity in issuesBySeverity) {
            var issues = issuesBySeverity[severity];
            var section = severity + '-section';
            var issueItem = severity + '-item';

            var container = selection.selectAll('.' + section)
                .data(issues.length ? [0] : []);

            container.exit()
                .remove();

            var containerEnter = container.enter()
                .append('div')
                .attr('class', 'modal-section ' + section + ' fillL2');

            containerEnter
                .append('h3')
                .text(severity === 'warning' ? t('commit.warnings') : t('commit.errors'));

            containerEnter
                .append('ul')
                .attr('class', 'changeset-list');

            container = containerEnter
                .merge(container);


            var items = container.select('ul').selectAll('li')
                .data(issues, function(d) { return d.id; });

            items.exit()
                .remove();

            var itemsEnter = items.enter()
                .append('li')
                .attr('class', issueItem);

            itemsEnter
                .call(svgIcon('#iD-icon-alert', 'pre-text'));

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
                .on('mouseover', function(d) {
                    if (d.entityIds) {
                        context.surface().selectAll(
                            utilEntityOrMemberSelector(
                                d.entityIds,
                                context.graph()
                            )
                        ).classed('hover', true);
                    }
                })
                .on('mouseout', function() {
                    context.surface().selectAll('.hover')
                        .classed('hover', false);
                })
                .on('click', function(d) {
                    if (d.entityIds && d.entityIds.length > 0) {
                        context.map().zoomTo(context.entity(d.entityIds[0]));
                        context.enter(modeSelect(context, d.entityIds));
                    }
                });
        }
    }


    return commitWarnings;
}
