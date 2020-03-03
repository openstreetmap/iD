import { event as d3_event, select as d3_select } from 'd3-selection';

import { svgIcon } from '../svg/icon';
import { t } from '../util/locale';
import { tooltip } from '../util/tooltip';


export function uiIssuesInfo(context) {

    var warningsItem = {
        id: 'warnings',
        count: 0,
        iconID: 'iD-icon-alert',
        descriptionID: 'issues.warnings_and_errors'
    };

    var resolvedItem = {
        id: 'resolved',
        count: 0,
        iconID: 'iD-icon-apply',
        descriptionID: 'issues.user_resolved_issues'
    };

    function update(selection) {

        var shownItems = [];

        var liveIssues = context.validator().getIssues({
            what: context.storage('validate-what') || 'edited',
            where: context.storage('validate-where') || 'all'
        });
        if (liveIssues.length) {
            warningsItem.count = liveIssues.length;
            shownItems.push(warningsItem);
        }

        if (context.storage('validate-what') === 'all') {
            var resolvedIssues = context.validator().getResolvedIssues();
            if (resolvedIssues.length) {
                resolvedItem.count = resolvedIssues.length;
                shownItems.push(resolvedItem);
            }
        }

        var chips = selection.selectAll('.chip')
            .data(shownItems, function(d) {
                return d.id;
            });

        chips.exit().remove();

        var enter = chips.enter()
            .append('a')
            .attr('class', function(d) {
                return 'chip ' + d.id + '-count';
            })
            .attr('href', '#')
            .attr('tabindex', -1)
            .each(function(d) {

                var chipSelection = d3_select(this);

                var tooltipBehavior = tooltip()
                    .placement('top')
                    .title(t(d.descriptionID));

                chipSelection
                    .call(tooltipBehavior)
                    .on('click', function() {
                        d3_event.preventDefault();

                        tooltipBehavior.hide(d3_select(this));
                        // open the Issues pane
                        context.ui().togglePanes(d3_select('.map-panes .issues-pane'));
                    });

                chipSelection.call(svgIcon('#' + d.iconID));

            });

        enter.append('span')
            .attr('class', 'count');

        enter.merge(chips)
            .selectAll('span.count')
            .text(function(d) {
                return d.count.toString();
            });
    }


    return function(selection) {
        update(selection);

        context.validator().on('validated.infobox', function() {
            update(selection);
        });
    };
}
