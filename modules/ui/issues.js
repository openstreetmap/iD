import _debounce from 'lodash-es/debounce';

import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { geoSphericalDistance } from '../geo';
import { modeSelect } from '../modes';
import { svgIcon } from '../svg';
import { uiBackground } from './background';
import { uiDisclosure } from './disclosure';
import { uiHelp } from './help';
import { uiMapData } from './map_data';
import { uiTooltipHtml } from './tooltipHtml';
import { utilCallWhenIdle, utilHighlightEntities } from '../util';


export function uiIssues(context) {
    var key = t('issues.key');
    var _errorsList = d3_select(null);
    var _warningsList = d3_select(null);
    var _rulesList = d3_select(null);
    var _pane = d3_select(null);
    var _toggleButton = d3_select(null);

    var _errors = [];
    var _warnings = [];
    var _shown = false;
    var _options = {
        what: context.storage('validate-what') || 'edited',    // 'all', 'edited'
        where: context.storage('validate-where') || 'visible'  // 'all', 'visible'
    };

    // listeners
    context.validator().on('validated.uiIssues', utilCallWhenIdle(update));
    context.map().on('move.uiIssues', _debounce(utilCallWhenIdle(update), 1000));


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

        _errorsList
            .call(drawIssuesList, _errors);
    }

    function renderWarningsList(selection) {
        _warningsList = selection.selectAll('.warnings-list')
            .data([0]);

        _warningsList = _warningsList.enter()
            .append('ul')
            .attr('class', 'layer-list warnings-list issues-list')
            .merge(_warningsList);

        _warningsList
            .call(drawIssuesList, _warnings);
    }


    function drawIssuesList(selection, issues) {
        var items = selection.selectAll('li')
            .data(issues, function(d) { return d.id; });

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
            .append('div')
            .attr('class', 'issue-message');

        messagesEnter
            .call(tooltip()
                .html(true)
                .title(function(d) { return uiTooltipHtml(d.tooltip); })
                .placement('top')
            );

        messagesEnter
            .append('span')
            .attr('class', 'issue-icon')
            .call(svgIcon(''));

        messagesEnter
            .append('span')
            .attr('class', 'issue-text');

        messagesEnter
            .each(function(d) {
                if (!d.auto) return;

                d3_select(this)
                    .append('button')
                    .datum(d.auto)  // set button datum to the autofix
                    .attr('class', 'autofix action')
                    .on('click', function(d) {
                        utilHighlightEntities(d.entityIds, false, context);
                        d.onClick();
                        context.validator().validate();
                    })
                    .call(svgIcon('#iD-icon-wrench'));
            });


        // Update
        items = items
            .merge(itemsEnter)
            .order();

        items.select('.issue-icon svg use')     // propagate bound data
            .attr('href', function(d) {
                return '#iD-icon-' + (d.severity === 'warning' ? 'alert' : 'error');
            });

        items.select('.issue-text')     // propagate bound data
            .text(function(d) { return d.message; });
    }


    function updateOptionValue(d, val) {
        if (!val && d3_event && d3_event.target) {
            val = d3_event.target.value;
        }

        _options[d] = val;
        context.storage('validate-' + d, val);
        update();
    }


    function renderIssuesOptions(selection) {
        var container = selection.selectAll('.issues-options-container')
            .data([0]);

        container = container.enter()
            .append('div')
            .attr('class', 'issues-options-container')
            .merge(container);

        var data = [
            { key: 'what', values: ['edited', 'all'] },
            { key: 'where', values: ['visible', 'all'] }
        ];

        var options = container.selectAll('.issues-option')
            .data(data, function(d) { return d.key; });

        var optionsEnter = options.enter()
            .append('div')
            .attr('class', function(d) { return 'issues-option issues-option-' + d.key; });

        optionsEnter
            .append('div')
            .attr('class', 'issues-option-title')
            .text(function(d) { return t('issues.options.' + d.key + '.title'); });

        var valuesEnter = optionsEnter.selectAll('label')
            .data(function(d) {
                return d.values.map(function(val) { return { value: val, key: d.key }; });
            })
            .enter()
            .append('label');

        valuesEnter
            .append('input')
            .attr('type', 'radio')
            .attr('name', function(d) { return 'issues-option-' + d.key; })
            .attr('value', function(d) { return d.value; })
            .property('checked', function(d) { return _options[d.key] === d.value; })
            .on('change', function(d) { updateOptionValue(d.key, d.value); });

        valuesEnter
            .append('span')
            .text(function(d) { return t('issues.options.' + d.key + '.' + d.value); });
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


    function renderRulesList(selection) {
        var container = selection.selectAll('.issue-rules-list')
            .data([0]);

        _rulesList = container.enter()
            .append('ul')
            .attr('class', 'layer-list issue-rules-list')
            .merge(container);

        updateRulesList();
    }

    function updateRulesList() {
        var ruleKeys = context.validator().getRuleKeys();
        _rulesList
            .call(drawListItems, ruleKeys, 'checkbox', 'rule', toggleRule, isRuleEnabled);
    }

    function isRuleEnabled(d) {
        return context.validator().isRuleEnabled(d);
    }

    function toggleRule(d) {
        context.validator().toggleRule(d);
    }


    function update() {
        var issuesBySeverity = context.validator().getIssuesBySeverity(_options);

        // sort issues by distance away from the center of the map
        var center = context.map().center();
        var graph = context.graph();
        _errors = issuesBySeverity.error.map(withDistance).sort(byDistance);
        _warnings = issuesBySeverity.warning.map(withDistance).sort(byDistance);

        // cut off at 1000
        var errorCount = _errors.length > 1000 ? '1000+' : String(_errors.length);
        var warningCount = _warnings.length > 1000 ? '1000+' : String(_warnings.length);
        _errors = _errors.slice(0, 1000);
        _warnings = _warnings.slice(0, 1000);


        _toggleButton.selectAll('.icon-badge')
            .classed('error', (_errors.length > 0))
            .classed('warning', (_errors.length === 0 && _warnings.length > 0))
            .classed('hide', (_errors.length === 0 && _warnings.length === 0));

        _pane.select('.issues-errors')
            .classed('hide', _errors.length === 0);

        if (_errors.length > 0) {
            _pane.select('.hide-toggle-issues_errors .hide-toggle-text')
                .text(t('issues.errors.list_title', { count: errorCount }));
            if (!_pane.select('.disclosure-wrap-issues_errors').classed('hide')) {
                _errorsList
                    .call(drawIssuesList, _errors);
            }
        }

        _pane.select('.issues-warnings')
            .classed('hide', _warnings.length === 0);

        if (_warnings.length > 0) {
            _pane.select('.hide-toggle-issues_warnings .hide-toggle-text')
                .text(t('issues.warnings.list_title', { count: warningCount }));
            if (!_pane.select('.disclosure-wrap-issues_warnings').classed('hide')) {
                _warningsList
                    .call(drawIssuesList, _warnings);
            }
        }

        _pane.select('.issues-none')
            .classed('hide', _warnings.length > 0 || _errors.length > 0);

        if (!_pane.select('.disclosure-wrap-issues_rules').classed('hide')) {
            updateRulesList();
        }


        function byDistance(a, b) {
            return a.dist - b.dist;
        }

        function withDistance(issue) {
            var extent = issue.extent(graph);
            var dist = extent ? geoSphericalDistance(center, extent.center()) : 0;
            return Object.assign(issue, { dist: dist });
        }
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
            .call(tooltip()
                .title(function(d) {
                    if (d === 'disconnected_way') {
                        d += '.highway';
                    } else if (d === 'almost_junction') {
                        d += '.highway-highway';
                    } else if (d === 'missing_role') {
                        d += '.multipolygon';
                    }
                    return t('issues.' + d + '.tip');
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
            .text(function(d) { return t('issues.' + d + '.title'); });

        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active)
            .property('indeterminate', false);
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
            .attr('class', 'issues-options')
            .call(renderIssuesOptions);

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

        // rules
        content
            .append('div')
            .attr('class', 'issues-rules')
            .call(uiDisclosure(context, 'issues_rules', false)
                .title(t('issues.rules.title'))
                .content(renderRulesList)
            );

        // update();

        context.keybinding()
            .on(key, uiIssues.togglePane);
    };

    return uiIssues;
}
