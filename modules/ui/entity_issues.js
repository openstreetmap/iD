import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { uiDisclosure } from './disclosure';
import { utilRebind } from '../util';
import { tooltip } from '../util/tooltip';
import { uiTooltipHtml } from './tooltipHtml';


export function uiEntityIssues(context) {
    var dispatch = d3_dispatch('change');
    var _entityID;

    context.validator().on('reload.entity_issues', update);

    function update() {
        var selection = d3_select('.entity-issues .disclosure-wrap');
        render(selection);
    }

    function entityIssues(selection) {
        selection.call(uiDisclosure(context, 'entity_issues', true)
            .title(t('issues.title'))
            .content(render)
        );
    }


    function render(selection) {

        var issues = context.validator().getIssuesForEntityWithID(_entityID);

        if (issues.length > 0) {
            d3_select('.entity-issues')
                .style('display', 'block');
        } else {
            d3_select('.entity-issues')
                .style('display', 'none');
            return;
        }

        var items = selection.selectAll('.issue')
            .data(issues, function(d) {
                if (d.id) {
                    return d.id();
                }
                return null;
            });

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('div')
            .attr('class', function (d) {
                return 'issue severity-' + d.severity;
            });

        var label = enter
            .append('button')
            .classed('label', true)
            .call(tooltip()
                .html(true)
                .title(function(d) {
                    var tip = d.tooltip ? d.tooltip : '';
                    return uiTooltipHtml(tip);
                })
                .placement('top')
            );

        label.each(function(d) {
            var iconSuffix = d.severity === 'warning' ? 'alert' : 'error';
            d3_select(this)
                .append('div')
                .attr('title', t('issues.'+d.severity+'s.icon_tooltip'))
                .style('display', 'inline')
                .call(svgIcon('#iD-icon-' + iconSuffix, 'pre-text'));
        });

        label
            .append('span')
            .append('strong')
            .text(function(d) { return d.message; });

        enter.each(function(d) {

            var issue = d3_select(this);

            var list = issue
                .selectAll('ul.fixes')
                .data([0]);

            if (d.fixes && d.fixes.length > 0) {
                list = list.enter()
                    .append('ul')
                    .attr('class', 'fixes')
                    .merge(list);

                issue.select('.label')
                    .on('click', function() {
                        if (!issue.classed('fixes-open')) {
                            issue.classed('fixes-open', true);
                            var loc = d.loc();
                            if (loc) {
                                context.map().centerZoomEase(loc, Math.max(context.map().zoom(), 18));
                            }
                        } else {
                            issue.classed('fixes-open', false);
                        }
                    });

                var fixItems = list
                    .selectAll('li')
                    .data(d.fixes);

                fixItems.exit()
                    .remove();

                fixItems.enter()
                    .append('li')
                    .append('button')
                    .text(function(d) {
                        return d.title;
                    })
                    .on('click', function(d) {
                        d.onClick();
                    });
            }
        });

        // Update
        items = items
            .merge(enter);

        // open the fixes for the first issue if no others are already open
        if (selection.selectAll('.issue.fixes-open').empty()) {
            selection.select('.issue:first-child').classed('fixes-open', true);
        }

    }

    entityIssues.entityID = function(val) {
        if (!arguments.length) return _entityID;
        if (_entityID === val) return entityIssues;
        _entityID = val;
        return entityIssues;
    };


    return utilRebind(entityIssues, dispatch, 'on');
}
