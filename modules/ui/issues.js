import _debounce from 'lodash-es/debounce';

import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';

import { actionNoop } from '../actions';
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
    var _errorsSelection = d3_select(null);
    var _warningsSelection = d3_select(null);
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


    function addNotificationBadge(selection) {
        var d = 10;
        selection.selectAll('svg.notification-badge')
            .data([0])
            .enter()
            .append('svg')
            .attr('viewbox', '0 0 ' + d + ' ' + d)
            .attr('class', 'notification-badge')
            .append('circle')
            .attr('cx', d / 2)
            .attr('cy', d / 2)
            .attr('r', (d / 2) - 1)
            .attr('fill', 'currentColor');
    }


    function renderErrorsList(selection) {
        _errorsSelection = selection
            .call(drawIssuesList, 'errors', _errors);
    }


    function renderWarningsList(selection) {
        _warningsSelection = selection
            .call(drawIssuesList, 'warnings', _warnings);
    }


    function drawIssuesList(selection, which, issues) {
        var list = selection.selectAll('.issues-list')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'layer-list issues-list ' + which + '-list')
            .merge(list);


        var items = list.selectAll('li')
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
                    var setZoom = Math.max(context.map().zoom(), 19);
                    context.map().centerZoomEase(extent.center(), setZoom);

                    // select the first entity
                    if (d.entities && d.entities.length) {
                        window.setTimeout(function() {
                            var ids = d.entities.map(function(e) { return e.id; });
                            context.enter(modeSelect(context, [ids[0]]));
                            utilHighlightEntities(ids, true, context);
                        }, 250);  // after ease
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


        var labelsEnter = itemsEnter
            .append('div')
            .attr('class', 'issue-label');

        var textEnter = labelsEnter
            .append('span')
            .attr('class', 'issue-text');

        textEnter
            .append('span')
            .attr('class', 'issue-icon')
            .each(function(d) {
                var iconName = '#iD-icon-' + (d.severity === 'warning' ? 'alert' : 'error');
                d3_select(this)
                    .call(svgIcon(iconName));
            });

        textEnter
            .append('span')
            .attr('class', 'issue-message')
            .text(function(d) { return d.message; });


        labelsEnter
            .append('span')
            .attr('class', 'issue-autofix')
            .each(function(d) {
                if (!d.autoFix) return;

                d3_select(this)
                    .append('button')
                    .attr('title', t('issues.fix_one.title'))
                    .datum(d.autoFix)  // set button datum to the autofix
                    .attr('class', 'autofix action')
                    .on('click', function(d) {
                        utilHighlightEntities(d.entityIds, false, context);
                        context.perform.apply(context, d.autoArgs);
                        context.validator().validate();
                    })
                    .call(svgIcon('#iD-icon-wrench'));
            });


        // Update
        items = items
            .merge(itemsEnter)
            .order();


        // autofix
        var canAutoFix = issues.filter(function(issue) { return issue.autoFix; });

        var autoFixAll = selection.selectAll('.autofix-all')
            .data(canAutoFix.length ? [0] : []);

        // exit
        autoFixAll.exit()
            .remove();

        // enter
        var autoFixAllEnter = autoFixAll.enter()
            .append('div')
            .attr('class', 'autofix-all');

        var linkEnter = autoFixAllEnter
            .append('a')
            .attr('class', 'autofix-all-link')
            .attr('href', '#');

        linkEnter
            .append('span')
            .attr('class', 'autofix-all-link-text')
            .text(t('issues.fix_all.title'));

        linkEnter
            .append('span')
            .attr('class', 'autofix-all-link-icon')
            .call(svgIcon('#iD-icon-wrench'));

        // update
        autoFixAll = autoFixAll
            .merge(autoFixAllEnter);

        autoFixAll.selectAll('.autofix-all-link')
            .on('click', function() {
                context.pauseChangeDispatch();
                context.perform(actionNoop());
                canAutoFix.forEach(function(issue) {
                    var args = issue.autoFix.autoArgs.slice();  // copy
                    if (typeof args[args.length - 1] !== 'function') {
                        args.pop();
                    }
                    args.push(t('issues.fix_all.annotation'));
                    context.replace.apply(context, args);
                });
                context.resumeChangeDispatch();
                context.validator().validate();
            });
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


        _toggleButton.selectAll('.notification-badge')
            .classed('error', (_errors.length > 0))
            .classed('warning', (_errors.length === 0 && _warnings.length > 0))
            .classed('hide', (_errors.length === 0 && _warnings.length === 0));


        _pane.selectAll('.issues-errors')
            .classed('hide', _errors.length === 0);

        if (_errors.length > 0) {
            _pane.selectAll('.hide-toggle-issues_errors .hide-toggle-text')
                .text(t('issues.errors.list_title', { count: errorCount }));
            if (!_pane.select('.disclosure-wrap-issues_errors').classed('hide')) {
                _errorsSelection
                    .call(drawIssuesList, 'errors', _errors);
            }
        }

        _pane.selectAll('.issues-warnings')
            .classed('hide', _warnings.length === 0);

        if (_warnings.length > 0) {
            _pane.selectAll('.hide-toggle-issues_warnings .hide-toggle-text')
                .text(t('issues.warnings.list_title', { count: warningCount }));
            if (!_pane.select('.disclosure-wrap-issues_warnings').classed('hide')) {
                _warningsSelection
                    .call(drawIssuesList, 'warnings', _warnings);
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
            .append('li');

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
            .call(addNotificationBadge)
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
