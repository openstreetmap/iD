import { select as d3_select } from 'd3-selection';

import { prefs } from '../core/preferences';
import { svgIcon } from '../svg/icon';
import { t } from '../core/localizer';
import { uiTooltip } from './tooltip';


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
            what: prefs('validate-what') || 'edited',
            where: prefs('validate-where') || 'all'
        });
        if (liveIssues.length) {
            warningsItem.count = liveIssues.length;
            shownItems.push(warningsItem);
        }

        if (prefs('validate-what') === 'all') {
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
            .each(function(d) {

                var chipSelection = d3_select(this);

                var tooltipBehavior = uiTooltip()
                    .placement('top')
                    .title(() => t.append(d.descriptionID));

                chipSelection
                    .call(tooltipBehavior)
                    .on('click', function(d3_event) {
                        d3_event.preventDefault();

                        tooltipBehavior.hide(d3_select(this));
                        // open the Issues pane
                        context.ui().togglePanes(context.container().select('.map-panes .issues-pane'));
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
