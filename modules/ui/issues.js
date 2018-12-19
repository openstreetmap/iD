import _map from 'lodash-es/map';
import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { svgIcon } from '../svg';
import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { geoExtent } from '../geo';
import { modeBrowse,
        modeSelect
} from '../modes';
import { uiBackground } from './background';
import { uiDisclosure } from './disclosure';
import { uiHelp } from './help';
import { uiMapData } from './map_data';
import { uiSettingsCustomData } from './settings/custom_data';
import { uiTooltipHtml } from './tooltipHtml';

export function uiIssues(context) {
    var key = t('issues.key');
    var _issuesOptionsContainer = d3_select(null);
    var _featureApplicabilityList = d3_select(null);
    var _issuesList = d3_select(null);
    var _shown = false;

    function renderIssuesOptions(selection) {
        var container = selection.selectAll('.issues-options-container')
            .data([0]);

        _issuesOptionsContainer = container.enter()
            .append('div')
            .attr('class', 'issues-options-container')
            .merge(container);

        _featureApplicabilityList = container.selectAll('.feature-applicability-list')
            .data([0]);

        _featureApplicabilityList = container.enter()
            .append('ul')
            .attr('class', 'layer-list feature-applicability-list')
            .merge(_featureApplicabilityList);
    }

    function renderIssuesList(selection) {
        _issuesList = selection.selectAll('.issues-list')
            .data([0]);

        _issuesList = _issuesList.enter()
            .append('ul')
            .attr('class', 'layer-list issues-list')
            .merge(_issuesList);
    }

    function drawListItems(selection, data, type, name, change, active) {
        var items = selection.selectAll('li')
            .data(data);

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', 'layer')
            .call(tooltip()
                .html(true)
                .title(function(d) {
                    var tip = t('issues.' + name + '.' + d + '.tooltip');
                    return uiTooltipHtml(tip);
                })
                .placement('bottom')
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
            .property('checked', active)
            .property('indeterminate', function(d) {
                return (name === 'feature' && autoHiddenFeature(d));
            });
    }

    function drawIssuesList(selection) {

        var name = 'issues_list';
        
        var issues = context.issueManager().getIssues();

        /*validations = _reduce(issues, function(validations, val) {
            var severity = val.severity;
            if (validations.hasOwnProperty(severity)) {
                validations[severity].push(val);
            } else {
                validations[severity] = [val];
            }
            return validations;
        }, {});*/

        var items = selection.selectAll('li')
            .data(issues);

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', function (d) {
                return 'layer severity-' + d.severity;
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
                if (d.entities) {
                    context.enter(modeSelect(
                        context,
                        _map(d.entities, function(e) { return e.id; })
                    ));
                }
            });

        var label = enter
            .append('label');

        /*label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);
*/
        label
            .append('span')
            .text(function(d) { return d.message; });

        // Update
        items = items
            .merge(enter);

    /*    items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active)
            .property('indeterminate', function(d) {
                return (name === 'feature' && autoHiddenFeature(d));
            });*/
    }

    function showsFeatureApplicability(d) {
        return context.issueManager().getFeatureApplicability() === d;
    }

    function setFeatureApplicability(d) {
        context.issueManager().setFeatureApplicability(d);
        update();
    }

    function update() {
        _featureApplicabilityList
            .call(
                drawListItems,
                context.issueManager().featureApplicabilityOptions,
                'radio',
                'feature_applicability',
                setFeatureApplicability,
                showsFeatureApplicability
            );

        _issuesList
            .call(drawIssuesList);
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

        var pane = selection
            .append('div')
            .attr('class', 'fillL map-pane hide');

        var paneTooltip = tooltip()
            .placement((textDirection === 'rtl') ? 'right' : 'left')
            .html(true)
            .title(uiTooltipHtml(t('issues.description'), key));

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

        // issues
        content
            .append('div')
            .attr('class', 'issues-issues')
            .call(uiDisclosure(context, 'issues_issues', true)
                .title(t('issues.title'))
                .content(renderIssuesList)
            );

        // options
        content
            .append('div')
            .attr('class', 'issues-options')
            .call(uiDisclosure(context, 'issues_options', true)
                .title(t('issues.options.title'))
                .content(renderIssuesOptions)
            );

        update();

        context.keybinding()
            .on(key, togglePane);

        uiIssues.hidePane = hidePane;
        uiIssues.togglePane = togglePane;
        uiIssues.setVisible = setVisible;
    }

    return issues;
}
