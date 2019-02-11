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
    var pane = d3_select(null);
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

    /*function drawListItems(selection, data, type, name, change, active) {
        var items = selection.selectAll('li')
            .data(data);

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .call(tooltip()
                .html(true)
                .title(function(d) {
                    var tip = t('issues.' + name + '.' + d + '.tooltip');
                    return uiTooltipHtml(tip);
                })
                .placement('top')
            );

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);

        label
            .append('span')
            .text(function(d) { return t('issues.' + name + '.' + d + '.description'); });

        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active);
    }*/

    function drawIssuesList(selection, issues) {

        var items = selection.selectAll('li')
            .data(issues, function(d) { return d.id(); });

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', function (d) {
                return 'issue severity-' + d.severity;
            })
            .on('click', function(d) {
                var loc = d.loc();
                if (loc) {
                    context.map().centerZoomEase(loc, Math.max(context.map().zoom(), 18));
                } else if (d.entities && d.entities.length > 0) {
                    context.map().zoomTo(d.entities[0]);
                }
                if (d.entities) {
                    var ids = d.entities.map(function(e) { return e.id; });
                    context.enter(modeSelect(context, ids));
                    utilHighlightEntities(ids, true, context);
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

        var label = enter
            .append('button')
            .attr('class', 'label')
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
            .text(function(d) { return d.message; });

        // Update
        items = items
            .merge(enter);
    }


    function renderNoIssuesBox(selection) {
        selection
            .append('div')
            .call(svgIcon('#iD-icon-apply', 'pre-text'));

        var noIssuesLabel = selection
            .append('span');

        noIssuesLabel
            .append('strong')
            .text(t('issues.no_issues.message'));

        noIssuesLabel
            .append('br');

        noIssuesLabel
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
        pane.select('.issues-errors').classed('hide', errors.length === 0);
        if (errors.length > 0) {
            pane.select('.hide-toggle-issues_errors .hide-toggle-text')
                .text(t('issues.errors.list_title', { count: errors.length }));
            if (!pane.select('.disclosure-wrap-issues_errors').classed('hide')) {
                updateErrorsList();
            }
        }

        var warnings = context.validator().getWarnings();
        pane.select('.issues-warnings').classed('hide', warnings.length === 0);
        if (warnings.length > 0) {
            pane.select('.hide-toggle-issues_warnings .hide-toggle-text')
                .text(t('issues.warnings.list_title', { count: warnings.length }));
            if (!pane.select('.disclosure-wrap-issues_warnings').classed('hide')) {
                updateWarningsList();
            }
        }

        pane.select('.issues-none')
            .classed('hide', warnings.length > 0 || errors.length > 0);

        //if (!pane.select('.disclosure-wrap-issues_options').classed('hide')) {
        //    updateFeatureApplicabilityList();
        //}
    }

    function issues(selection) {

        function hidePane() {
            setVisible(false);
        }

        function togglePane() {
            if (d3_event) d3_event.preventDefault();
            setVisible(!button.classed('active'));
        }

        function setVisible(show) {
            if (show !== _shown) {
                button.classed('active', show);
                _shown = show;

                if (show) {
                    uiBackground.hidePane();
                    uiHelp.hidePane();
                    uiMapData.hidePane();
                    update();

                    pane
                        .style('display', 'block')
                        .style('right', '-300px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');

                } else {
                    pane
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
        }

        pane = selection
            .append('div')
            .attr('class', 'fillL map-pane hide');

        var paneTooltip = tooltip()
            .placement((textDirection === 'rtl') ? 'right' : 'left')
            .html(true)
            .title(uiTooltipHtml(t('issues.title'), key));

        var button = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', togglePane)
            .call(svgIcon('#iD-icon-alert', 'light'))
            .call(paneTooltip);

        var heading = pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('issues.title'));

        heading
            .append('button')
            .on('click', function() { uiIssues.hidePane(); })
            .call(svgIcon('#iD-icon-close'));

        var content = pane
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
            .on(key, togglePane);

        uiIssues.hidePane = hidePane;
        uiIssues.togglePane = togglePane;
        uiIssues.setVisible = setVisible;
    }

    return issues;
}
