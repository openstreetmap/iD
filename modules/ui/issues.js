import _debounce from 'lodash-es/debounce';

import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';

//import { actionNoop } from '../actions/noop';
import { geoSphericalDistance } from '../geo';
import { svgIcon } from '../svg/icon';
import { uiDisclosure } from './disclosure';
import { uiTooltipHtml } from './tooltipHtml';
import { utilGetSetValue, utilHighlightEntities, utilNoAuto } from '../util';


export function uiIssues(context) {
    var key = t('issues.key');

    var MINSQUARE = 0;
    var MAXSQUARE = 20;
    var DEFAULTSQUARE = 5;  // see also unsquare_way.js

    var _errorsSelection = d3_select(null);
    var _warningsSelection = d3_select(null);
    var _rulesList = d3_select(null);
    var _pane = d3_select(null);
    var _toggleButton = d3_select(null);

    var _errors = [];
    var _warnings = [];
    var _options = {
        what: context.storage('validate-what') || 'edited',    // 'all', 'edited'
        where: context.storage('validate-where') || 'all'  // 'all', 'visible'
    };

    // listeners
    context.validator().on('validated.uiIssues',
        function() { window.requestIdleCallback(update); }
    );
    context.map().on('move.uiIssues',
        _debounce(function() { window.requestIdleCallback(update); }, 1000)
    );


    function addNotificationBadge(selection) {
        var d = 10;
        selection.selectAll('svg.notification-badge')
            .data([0])
            .enter()
            .append('svg')
            .attr('viewbox', '0 0 ' + d + ' ' + d)
            .attr('class', 'notification-badge hide')
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
                context.validator().focusIssue(d);
            })
            .on('mouseover', function(d) {
                utilHighlightEntities(d.entityIds, true, context);
            })
            .on('mouseout', function(d) {
                utilHighlightEntities(d.entityIds, false, context);
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
            .attr('class', 'issue-message');

        /*
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
                        d3_event.preventDefault();
                        d3_event.stopPropagation();

                        var issuesEntityIDs = d.issue.entityIds;
                        utilHighlightEntities(issuesEntityIDs.concat(d.entityIds), false, context);

                        context.perform.apply(context, d.autoArgs);
                        context.validator().validate();
                    })
                    .call(svgIcon('#iD-icon-wrench'));
            });
        */

        // Update
        items = items
            .merge(itemsEnter)
            .order();

        items.selectAll('.issue-message')
            .text(function(d) {
                return d.message(context);
            });

        /*
        // autofix
        var canAutoFix = issues.filter(function(issue) { return issue.autoFix; });

        var autoFixAll = selection.selectAll('.autofix-all')
            .data(canAutoFix.length ? [0] : []);

        // exit
        autoFixAll.exit()
            .remove();

        // enter
        var autoFixAllEnter = autoFixAll.enter()
            .insert('div', '.issues-list')
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

        if (which === 'warnings') {
            renderIgnoredIssuesReset(selection);
        }

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
        */
    }


    function updateOptionValue(d, val) {
        if (!val && d3_event && d3_event.target) {
            val = d3_event.target.value;
        }

        _options[d] = val;
        context.storage('validate-' + d, val);
        context.validator().validate();
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

        var box = selection.append('div')
            .attr('class', 'box');

        box
            .append('div')
            .call(svgIcon('#iD-icon-apply', 'pre-text'));

        var noIssuesMessage = box
            .append('span');

        noIssuesMessage
            .append('strong')
            .attr('class', 'message');

        noIssuesMessage
            .append('br');

        noIssuesMessage
            .append('span')
            .attr('class', 'details');
    }

    function renderIgnoredIssuesReset(selection) {

        var ignoredIssues = context.validator()
            .getIssues({ what: 'all', where: 'all', includeDisabledRules: true, includeIgnored: 'only' });

        var resetIgnored = selection.selectAll('.reset-ignored')
            .data(ignoredIssues.length ? [0] : []);

        // exit
        resetIgnored.exit()
            .remove();

        // enter
        var resetIgnoredEnter = resetIgnored.enter()
            .append('div')
            .attr('class', 'reset-ignored section-footer');

        resetIgnoredEnter
            .append('a')
            .attr('href', '#');

        // update
        resetIgnored = resetIgnored
            .merge(resetIgnoredEnter);

        resetIgnored.select('a')
            .text(t('issues.reset_ignored', { count: ignoredIssues.length.toString() }));

        resetIgnored.on('click', function() {
            context.validator().resetIgnoredIssues();
        });
    }


    function renderRulesList(selection) {
        var container = selection.selectAll('.issues-rulelist-container')
            .data([0]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'issues-rulelist-container');

        containerEnter
            .append('ul')
            .attr('class', 'layer-list issue-rules-list');

        var ruleLinks = containerEnter
            .append('div')
            .attr('class', 'issue-rules-links section-footer');

        ruleLinks
            .append('a')
            .attr('class', 'issue-rules-link')
            .attr('href', '#')
            .text(t('issues.enable_all'))
            .on('click', function() {
                context.validator().disableRules([]);
            });

        ruleLinks
            .append('a')
            .attr('class', 'issue-rules-link')
            .attr('href', '#')
            .text(t('issues.disable_all'))
            .on('click', function() {
                var keys = context.validator().getRuleKeys();
                context.validator().disableRules(keys);
            });


        // Update
        container = container
            .merge(containerEnter);

        _rulesList = container.selectAll('.issue-rules-list');

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

    function setNoIssuesText() {

        function checkForHiddenIssues(cases) {
            for (var type in cases) {
                var opts = cases[type];
                var hiddenIssues = context.validator().getIssues(opts);
                if (hiddenIssues.length) {
                    _pane.select('.issues-none .details')
                        .text(t(
                            'issues.no_issues.hidden_issues.' + type,
                            { count: hiddenIssues.length.toString() }
                        ));
                    return;
                }
            }
            _pane.select('.issues-none .details')
                .text(t('issues.no_issues.hidden_issues.none'));
        }

        var messageType;

        if (_options.what === 'edited' && _options.where === 'visible') {

            messageType = 'edits_in_view';

            checkForHiddenIssues({
                elsewhere: { what: 'edited', where: 'all' },
                everything_else: { what: 'all', where: 'visible' },
                disabled_rules: { what: 'edited', where: 'visible', includeDisabledRules: 'only' },
                everything_else_elsewhere: { what: 'all', where: 'all' },
                disabled_rules_elsewhere: { what: 'edited', where: 'all', includeDisabledRules: 'only' },
                ignored_issues: { what: 'edited', where: 'visible', includeIgnored: 'only' },
                ignored_issues_elsewhere: { what: 'edited', where: 'all', includeIgnored: 'only' }
            });

        } else if (_options.what === 'edited' && _options.where === 'all') {

            messageType = 'edits';

            checkForHiddenIssues({
                everything_else: { what: 'all', where: 'all' },
                disabled_rules: { what: 'edited', where: 'all', includeDisabledRules: 'only' },
                ignored_issues: { what: 'edited', where: 'all', includeIgnored: 'only' }
            });

        } else if (_options.what === 'all' && _options.where === 'visible') {

            messageType = 'everything_in_view';

            checkForHiddenIssues({
                elsewhere: { what: 'all', where: 'all' },
                disabled_rules: { what: 'all', where: 'visible', includeDisabledRules: 'only' },
                disabled_rules_elsewhere: { what: 'all', where: 'all', includeDisabledRules: 'only' },
                ignored_issues: { what: 'all', where: 'visible', includeIgnored: 'only' },
                ignored_issues_elsewhere: { what: 'all', where: 'all', includeIgnored: 'only' }
            });
        } else if (_options.what === 'all' && _options.where === 'all') {

            messageType = 'everything';

            checkForHiddenIssues({
                disabled_rules: { what: 'all', where: 'all', includeDisabledRules: 'only' },
                ignored_issues: { what: 'all', where: 'all', includeIgnored: 'only' }
            });
        }

        if (_options.what === 'edited' && context.history().difference().summary().length === 0) {
            messageType = 'no_edits';
        }

        _pane.select('.issues-none .message')
            .text(t('issues.no_issues.message.' + messageType));

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
                renderIgnoredIssuesReset(_warningsSelection);
            }
        }

        var hasIssues = _warnings.length > 0 || _errors.length > 0;

        var issuesNone = _pane.select('.issues-none');
        issuesNone.classed('hide', hasIssues);
        if (!hasIssues) {
            renderIgnoredIssuesReset(issuesNone);
            setNoIssuesText();
        }

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

        if (name === 'rule') {
            enter
                .call(tooltip()
                    .title(function(d) { return t('issues.' + d + '.tip'); })
                    .placement('top')
                );
        }

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);

        label
            .append('span')
            .html(function(d) {
                var params = {};
                if (d === 'unsquare_way') {
                    params.val = '<span class="square-degrees"></span>';
                }
                return t('issues.' + d + '.title', params);
            });

        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active)
            .property('indeterminate', false);


        // user-configurable square threshold
        var degStr = context.storage('validate-square-degrees');
        if (degStr === null) {
            degStr = '' + DEFAULTSQUARE;
        }

        var span = items.selectAll('.square-degrees');
        var input = span.selectAll('.square-degrees-input')
            .data([0]);

        // enter / update
        input.enter()
            .append('input')
            .attr('type', 'number')
            .attr('min', '' + MINSQUARE)
            .attr('max', '' + MAXSQUARE)
            .attr('step', '0.5')
            .attr('class', 'square-degrees-input')
            .call(utilNoAuto)
            .on('click', function () {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                this.select();
            })
            .on('keyup', function () {
                if (d3_event.keyCode === 13) { // enter
                    this.blur();
                    this.select();
                }
            })
            .on('blur', changeSquare)
            .merge(input)
            .property('value', degStr);
    }


    function changeSquare() {
        var input = d3_select(this);
        var degStr = utilGetSetValue(input).trim();
        var degNum = parseFloat(degStr, 10);

        if (!isFinite(degNum)) {
            degNum = DEFAULTSQUARE;
        } else if (degNum > MAXSQUARE) {
            degNum = MAXSQUARE;
        } else if (degNum < MINSQUARE) {
            degNum = MINSQUARE;
        }

        degNum = Math.round(degNum * 10 ) / 10;   // round to 1 decimal
        degStr = '' + degNum;

        input
            .property('value', degStr);

        context.storage('validate-square-degrees', degStr);
        context.validator().reloadUnsquareIssues();
    }


    function hidePane() {
        context.ui().togglePanes();
    }



    var paneTooltip = tooltip()
        .placement((textDirection === 'rtl') ? 'right' : 'left')
        .html(true)
        .title(uiTooltipHtml(t('issues.title'), key));



    uiIssues.togglePane = function() {
        if (d3_event) d3_event.preventDefault();
        paneTooltip.hide();
        context.ui().togglePanes(!_pane.classed('shown') ? _pane : undefined);
    };


    uiIssues.renderToggleButton = function(selection) {
        _toggleButton = selection
            .append('button')
            .on('click', uiIssues.togglePane)
            .call(svgIcon('#iD-icon-alert', 'light'))
            .call(addNotificationBadge)
            .call(paneTooltip);
    };


    uiIssues.renderPane = function(selection) {
        _pane = selection
            .append('div')
            .attr('class', 'fillL map-pane issues-pane hide')
            .attr('pane', 'map-issues');

        var heading = _pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('issues.title'));

        heading
            .append('button')
            .on('click', hidePane)
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
