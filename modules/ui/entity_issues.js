import { select as d3_select } from 'd3-selection';

import { svgIcon } from '../svg';
import { t } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { uiDisclosure } from './disclosure';
import { uiTooltipHtml } from './tooltipHtml';
import { utilHighlightEntities } from '../util';


export function uiEntityIssues(context) {
    var _selection = d3_select(null);
    var _expanded = 0;
    var _entityID;


    context.validator().on('reload.entity_issues', function() {

        update();

         _selection.selectAll('.entity-issues')
             .call(render);
    });


    function clamp(num, min, max) {
        return Math.max(min, Math.min(num, max));
    }


    function entityIssues(selection) {
        _selection = selection;

        selection
            .call(uiDisclosure(context, 'entity_issues', true)
                .content(render)
            );

        update();
    }


    function update() {
        var issues = context.validator().getIssuesForEntityWithID(_entityID);

        _selection
            .classed('hide', issues.length === 0);

        _selection.selectAll('.hide-toggle-entity_issues span')
            .text(t('issues.list_title', { count: issues.length }));
    }


    function render(selection) {
        var issues = context.validator().getIssuesForEntityWithID(_entityID);
        _expanded = clamp(_expanded, 0, issues.length);

        var items = selection.selectAll('.issue')
            .data(issues, function(d) { return d.id(); });

        // Exit
        items.exit()
            .remove();

        // Enter
        var itemsEnter = items.enter()
            .append('div')
            .attr('class', function(d) { return 'issue severity-' + d.severity; })
            .call(tooltip()
                .html(true)
                .title(function(d) { return uiTooltipHtml(d.tooltip); })
                .placement('top')
            )
            .on('mouseover.highlight', function(d) {
                var ids = d.entities.map(function(e) { return e.id; });
                utilHighlightEntities(ids, true, context);
            })
            .on('mouseout.highlight', function(d) {
                var ids = d.entities.map(function(e) { return e.id; });
                utilHighlightEntities(ids, false, context);
            })
            .on('click', function(d, i) {
                _expanded = i;   // expand only the clicked item
                selection.selectAll('.issue')
                    .classed('expanded', function(d, i) { return i === _expanded; });

                var extent = d.extent(context.graph());
                if (extent) {
                    var view = context.map().trimmedExtent();
                    var zoom = context.map().zoom();
                    if (!view.contains(extent) || zoom < 19) {
                        context.map().centerZoomEase(extent.center(), Math.max(zoom, 19));
                    }
                }
            });

        var labelsEnter = itemsEnter
            .append('button')
            .attr('class', 'label');

        labelsEnter
            .append('span')
            .attr('class', 'issue-icon')
            .call(svgIcon('', 'pre-text'));

        labelsEnter
            .append('strong')
            .attr('class', 'issue-text');

        itemsEnter
            .append('ul')
            .attr('class', 'issue-fix-list');


        // Update
        items = items
            .merge(itemsEnter)
            .classed('expanded', function(d, i) { return i === _expanded; });

        items.select('.issue-icon svg use')     // propagate bound data
            .attr('href', function(d) {
                return '#iD-icon-' + (d.severity === 'warning' ? 'alert' : 'error');
            });

        items.select('.issue-text')     // propagate bound data
            .text(function(d) { return d.message; });


        // fixes
        var fixLists = items.selectAll('.issue-fix-list');

        var fixes = fixLists.selectAll('.issue-fix-item')
            .data(function(d) { return d.fixes; })
            .enter()
            .append('li')
            .attr('class', function(d) {
                return 'issue-fix-item ' + (d.onClick ? 'actionable' : '');
            })
            .append('button')
            .on('click', function(d) {
                if (d.onClick) {
                    utilHighlightEntities(d.entityIds, false, context);
                    d.onClick();
                }
            })
            .on('mouseover.highlight', function(d) {
                utilHighlightEntities(d.entityIds, true, context);
            })
            .on('mouseout.highlight', function(d) {
                utilHighlightEntities(d.entityIds, false, context);
            });

        fixes.append('span')
            .attr('class', 'fix-icon')
            .each(function(d) {
                var iconName = d.icon || 'iD-icon-wrench';
                if (iconName.startsWith('maki')) {
                    iconName += '-15';
                }
                d3_select(this).call(svgIcon('#' + iconName, 'pre-text'));
            });

        fixes.append('span')
            .text(function(d) { return d.title; });
    }


    entityIssues.entityID = function(val) {
        if (!arguments.length) return _entityID;
        if (_entityID !== val) {
            _entityID = val;
            _expanded = 0;
        }
        return entityIssues;
    };


    return entityIssues;
}
