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

    function entityIssues(selection) {
        selection.call(uiDisclosure(context, 'entity_issues', true)
            .title(t('issues.title'))
            .content(render)
        );
    }


    function render(selection) {
        var issues = context.issueManager().getIssuesForEntityWithID(_entityID);

        var items = selection.selectAll('.issue')
            .data(issues, function(d) { return d.id(); });

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('div')
            .attr('class', function (d) {
                return 'issue severity-' + d.severity;
            })
            .call(tooltip()
                .html(true)
                .title(function(d) {
                    var tip = d.tooltip ? d.tooltip : '';
                    return uiTooltipHtml(tip);
                })
                .placement('bottom')
            )
            .on('click', function(d) {

            });

        var label = enter
            .append('button')
            .classed('label', true);

        label.each(function(d) {
            var iconSuffix = d.severity === 'warning' ? 'alert' : 'error';
            d3_select(this)
                .append('div')
                .attr('title', t('issues.severity.'+d.severity))
                .style('display', 'inline')
                .call(svgIcon('#iD-icon-' + iconSuffix, 'pre-text'));
        });

        label
            .append('span')
            .append('strong')
            .text(function(d) { return d.message; });

        // Update
        items = items
            .merge(enter);
    }

    entityIssues.entityID = function(val) {
        if (!arguments.length) return _entityID;
        if (_entityID === val) return entityIssues;
        _entityID = val;
        return entityIssues;
    };


    return utilRebind(entityIssues, dispatch, 'on');
}
