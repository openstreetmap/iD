import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiTooltip } from './tooltip';
import { utilEntityOrMemberSelector } from '../util';


export function uiCommitWarnings(context) {

    function commitWarnings(selection) {
        var issuesBySeverity = context.validator()
            .getIssuesBySeverity({ what: 'edited', where: 'all', includeDisabledRules: true });

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
                .attr('class', 'issue-message');

            itemsEnter.filter(function(d) { return d.tooltip; })
                .call(uiTooltip()
                    .title(function(d) { return d.tooltip; })
                    .placement('top')
                );

            items = itemsEnter
                .merge(items);

            items.selectAll('.issue-message')
                .text(function(d) {
                    return d.message(context);
                });

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
                    context.validator().focusIssue(d);
                });
        }
    }


    return commitWarnings;
}
