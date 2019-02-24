import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { svgIcon } from '../svg';
import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { modeSelect } from '../modes';
import { uiBackground } from './background';
import { uiDisclosure } from './disclosure';
import { uiHelp } from './help';
import { uiMapData } from './map_data';
import { uiTooltipHtml } from './tooltipHtml';
import { utilHighlightEntities } from '../util';


export function uiIssues(context) {
    var key = t('issues.key');
    //var _featureApplicabilityList = d3_select(null);
    var _errorsList = d3_select(null);
    var _warningsList = d3_select(null);
    var _pane = d3_select(null);
    var _toggleButton = d3_select(null);
    var _shown = false;

    context.validator().on('reload.issues_pane', update);

    /*function renderIssuesOptions(selection) {
        var container = selection.selectAll('.issues-options-container')
            .data([0]);

        container = container.enter()
            .append('div')
            .attr('class', 'issues-options-container')
            .merge(container);

        _featureApplicabilityList = container.selectAll('.feature-applicability-list')
            .data([0]);

        _featureApplicabilityList = _featureApplicabilityList.enter()
            .append('ul')
            .attr('class', 'layer-list feature-applicability-list')
            .merge(_featureApplicabilityList);

        updateFeatureApplicabilityList();
    }*/

    function addIconBadge(selection) {
        var d = 10;
        selection.selectAll('svg.icon-badge')
            .data([0])
            .enter()
            .append('svg')
            .attr('viewbox', '0 0 ' + d + ' ' + d)
            .attr('class', 'icon-badge')
            .append('circle')
            .attr('cx', d / 2)
            .attr('cy', d / 2)
            .attr('r', (d / 2) - 1)
            .attr('fill', 'currentColor');
    }

    function renderErrorsList(selection) {
        _errorsList = selection.selectAll('.errors-list')
            .data([0]);

        _errorsList = _errorsList.enter()
            .append('ul')
            .attr('class', 'layer-list errors-list issues-list')
            .merge(_errorsList);

        updateErrorsList();
    }

    function renderWarningsList(selection) {
        _warningsList = selection.selectAll('.warnings-list')
            .data([0]);

        _warningsList = _warningsList.enter()
            .append('ul')
            .attr('class', 'layer-list warnings-list issues-list')
            .merge(_warningsList);

        updateWarningsList();
    }


    function drawIssuesList(selection, issues) {
        var items = selection.selectAll('li')
            .data(issues, function(d) { return d.id(); });

        // Exit
        items.exit()
            .remove();

        // Enter
        var itemsEnter = items.enter()
            .append('li')
            .attr('class', function (d) { return 'issue severity-' + d.severity; })
            .on('click', function(d) {
                var extent = d.extent(context.graph());
                if (extent) {
                    var msec = 0;
                    var view = context.map().trimmedExtent();
                    var zoom = context.map().zoom();

                    // make sure user can see the issue
                    if (!view.contains(extent) || zoom < 19) {
                        msec = 250;
                        context.map().centerZoomEase(extent.center(), Math.max(zoom, 19), msec);
                    }

                    // select the first entity
                    if (d.entities && d.entities.length) {
                        window.setTimeout(function() {
                            var ids = d.entities.map(function(e) { return e.id; });
                            context.enter(modeSelect(context, [ids[0]]));
                            utilHighlightEntities(ids, true, context);
                        }, msec);
                    }
                }
            })
            .on('mouseover', function(d) {
                var ids = d.entities.map(function(e) { return e.id; });
                utilHighlightEntities(ids, true, context);
            })
            .on('mouseout', function(d) {
                var ids = d.entities.map(function(e) { return e.id; });
                utilHighlightEntities(ids, false, context);
            });


        var messagesEnter = itemsEnter
            .append('button')
            .attr('class', 'message');

        messagesEnter
            .call(tooltip()
                .html(true)
                .title(function(d) { return uiTooltipHtml(d.tooltip); })
                .placement('top')
            );

        messagesEnter
            .append('span')
            .attr('class', 'issue-icon')
            .call(svgIcon('', 'pre-text'));

        messagesEnter
            .append('span')
            .attr('class', 'issue-text');


        // Update
        items = items
            .merge(itemsEnter);

        items.select('.issue-icon svg use')     // propagate bound data
            .attr('href', function(d) {
                return '#iD-icon-' + (d.severity === 'warning' ? 'alert' : 'error');
            });

        items.select('.issue-text')     // propagate bound data
            .text(function(d) { return d.message; });
    }


    function renderNoIssuesBox(selection) {
        selection
            .append('div')
            .call(svgIcon('#iD-icon-apply', 'pre-text'));

        var noIssuesMessage = selection
            .append('span');

        noIssuesMessage
            .append('strong')
            .text(t('issues.no_issues.message'));

        noIssuesMessage
            .append('br');

        noIssuesMessage
            .append('span')
            .text(t('issues.no_issues.info'));
    }

    /*
    function showsFeatureApplicability(d) {
        return context.validator().getFeatureApplicability() === d;
    }

    function setFeatureApplicability(d) {
        context.validator().setFeatureApplicability(d);
        update();
    }

    function updateFeatureApplicabilityList() {
        _featureApplicabilityList
            .call(
                drawListItems,
                context.validator().featureApplicabilityOptions,
                'radio',
                'features_to_validate',
                setFeatureApplicability,
                showsFeatureApplicability
            );
    }*/

    function updateErrorsList() {
        var errors = context.validator().getErrors();
        _errorsList
            .call(drawIssuesList, errors);
    }


    function updateWarningsList() {
        var warnings = context.validator().getWarnings();
        _warningsList
            .call(drawIssuesList, warnings);
    }


    function update() {
        var errors = context.validator().getErrors();
        var warnings = context.validator().getWarnings();

        _toggleButton.selectAll('.icon-badge')
            .classed('error', (errors.length > 0))
            .classed('warning', (errors.length === 0 && warnings.length > 0))
            .classed('hide', (errors.length === 0 && warnings.length === 0));

        _pane.select('.issues-errors')
            .classed('hide', errors.length === 0);

        if (errors.length > 0) {
            _pane.select('.hide-toggle-issues_errors .hide-toggle-text')
                .text(t('issues.errors.list_title', { count: errors.length }));
            if (!_pane.select('.disclosure-wrap-issues_errors').classed('hide')) {
                updateErrorsList();
            }
        }

        _pane.select('.issues-warnings')
            .classed('hide', warnings.length === 0);

        if (warnings.length > 0) {
            _pane.select('.hide-toggle-issues_warnings .hide-toggle-text')
                .text(t('issues.warnings.list_title', { count: warnings.length }));
            if (!_pane.select('.disclosure-wrap-issues_warnings').classed('hide')) {
                updateWarningsList();
            }
        }

        _pane.select('.issues-none')
            .classed('hide', warnings.length > 0 || errors.length > 0);

        //if (!_pane.select('.disclosure-wrap-issues_options').classed('hide')) {
        //    updateFeatureApplicabilityList();
        //}
    }

    var paneTooltip = tooltip()
        .placement((textDirection === 'rtl') ? 'right' : 'left')
        .html(true)
        .title(uiTooltipHtml(t('issues.title'), key));

    uiIssues.hidePane = function() {
        uiIssues.setVisible(false);
    };

    uiIssues.togglePane = function() {
        if (d3_event) d3_event.preventDefault();
        paneTooltip.hide(_toggleButton);
        uiIssues.setVisible(!_toggleButton.classed('active'));
    };

    uiIssues.setVisible = function(show) {
        if (show !== _shown) {
            _toggleButton.classed('active', show);
            _shown = show;

            if (show) {
                uiBackground.hidePane();
                uiHelp.hidePane();
                uiMapData.hidePane();
                update();

                _pane
                    .style('display', 'block')
                    .style('right', '-300px')
                    .transition()
                    .duration(200)
                    .style('right', '0px');

            } else {
                _pane
                    .style('display', 'block')
                    .style('right', '0px')
                    .transition()
                    .duration(200)
                    .style('right', '-300px')
                    .on('end', function() {
                        d3_select(this).style('display', 'none');
                    });
            }
        }
    };

    uiIssues.renderToggleButton = function(selection) {

        _toggleButton = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', uiIssues.togglePane)
            .call(svgIcon('#iD-icon-alert', 'light'))
            .call(addIconBadge)
            .call(paneTooltip);

    };

    uiIssues.renderPane = function(selection) {

        _pane = selection
            .append('div')
            .attr('class', 'fillL map-pane issues-pane hide');

        var heading = _pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('issues.title'));

        heading
            .append('button')
            .on('click', uiIssues.hidePane)
            .call(svgIcon('#iD-icon-close'));

        var content = _pane
            .append('div')
            .attr('class', 'pane-content');

        content
            .append('div')
            .attr('class', 'issues-none')
            .call(renderNoIssuesBox);

        // errors
        content
            .append('div')
            .attr('class', 'issues-errors')
            .call(uiDisclosure(context, 'issues_errors', true)
                .content(renderErrorsList)
            );

        // warnings
        content
            .append('div')
            .attr('class', 'issues-warnings')
            .call(uiDisclosure(context, 'issues_warnings', true)
                .content(renderWarningsList)
            );

        // options
        /*
        // add this back to core.yaml when re-enabling the options
        options:
          title: Options
        features_to_validate:
          edited:
            description: Edited features only
            tooltip: Flag issues with features you create and modify
          all:
            description: All features
            tooltip: Flag issues with all nearby features

        content
            .append('div')
            .attr('class', 'issues-options')
            .call(uiDisclosure(context, 'issues_options', true)
                .title(t('issues.options.title'))
                .content(renderIssuesOptions)
            );
        */
        update();

        context.keybinding()
            .on(key, uiIssues.togglePane);
    };

    return uiIssues;
}
