import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_selectAll
} from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { uiDisclosure } from './disclosure';
import {
    utilRebind,
    utilHighlightEntity
} from '../util';
import { tooltip } from '../util/tooltip';
import { uiTooltipHtml } from './tooltipHtml';


export function uiEntityIssues(context) {
    var dispatch = d3_dispatch('change');
    var _entityID;

    context.validator().on('reload.entity_issues', issuesDidReload);

    function issuesDidReload() {
        var selection = d3_selectAll('.entity-issues .disclosure-wrap');
        renderContent(selection);
        update();
    }

    function entityIssues(selection) {
        selection.call(uiDisclosure(context, 'entity_issues', true)
            .content(renderContent)
        );
        update();
    }

    function update() {

        var issues = context.validator().getIssuesForEntityWithID(_entityID);

        d3_selectAll('.entity-issues')
            .classed('hide', issues.length === 0);

        d3_selectAll('.hide-toggle-entity_issues span')
            .text(t('issues.list_title', { count: issues.length }));
    }

    function renderContent(selection) {

        var issues = context.validator().getIssuesForEntityWithID(_entityID);

        var items = selection.selectAll('.issue')
            .data(issues, function(d) {
                return d.id();
            });

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('div')
            .attr('class', function (d) {
                return 'issue severity-' + d.severity;
            })
            .on('mouseover.highlight', function(d) {
                d.entities.forEach(function(entity) {
                    if (entity.id !== _entityID) {
                        utilHighlightEntity(entity.id, true, context);
                    }
                });
            })
            .on('mouseout.highlight', function(d) {
                d.entities.forEach(function(entity) {
                    if (entity.id !== _entityID) {
                        utilHighlightEntity(entity.id, false, context);
                    }
                });
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
            d3_selectAll(this)
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

            var issue = d3_selectAll(this);

            var list = issue
                .selectAll('ul.fixes')
                .data([0]);

            if (d.fixes && d.fixes.length > 0) {
                list = list.enter()
                    .append('ul')
                    .attr('class', 'fixes')
                    .merge(list);

                issue.selectAll('.label')
                    .on('click', function() {
                        if (!issue.classed('fixes-open')) {
                            issue.classed('fixes-open', true);
                            var loc = d.loc();
                            if (loc) {
                                context.map().centerZoomEase(loc, Math.max(context.map().zoom(), 18));
                            } else if (d.entities && d.entities.length > 0 &&
                                !d.entities[0].intersects(context.map().extent(), context.graph())) {
                                context.map().zoomToEase(d.entities[0]);
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
                    })
                    .on('mouseover.highlight', function(d) {
                        d.entityIds.forEach(function(entityId) {
                            utilHighlightEntity(entityId, true, context);
                        });
                    })
                    .on('mouseout.highlight', function(d) {
                        d.entityIds.forEach(function(entityId) {
                            utilHighlightEntity(entityId, false, context);
                        });
                    });
            }
        });

        // Update
        items = items
            .merge(enter);

        // open the fixes for the first issue if no others are already open
        if (selection.selectAll('.issue.fixes-open').empty()) {
            selection.selectAll('.issue:first-child').classed('fixes-open', true);
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
