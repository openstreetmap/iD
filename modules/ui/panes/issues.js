import _debounce from 'lodash-es/debounce';
import { event as d3_event } from 'd3-selection';

import { t } from '../../util/locale';
import { svgIcon } from '../../svg/icon';
import { uiPane } from '../pane';
import { uiSectionValidationIssues } from '../sections/validation_issues';
import { uiSectionValidationRules } from '../sections/validation_rules';


export function uiPaneIssues(context) {

    var _validationRules = uiSectionValidationRules(context);
    var _validationErrors = uiSectionValidationIssues('issues-errors', 'error', context);
    var _validationWarnings = uiSectionValidationIssues('issues-warnings', 'warning', context);

    function getOptions() {
        return {
            what: context.storage('validate-what') || 'edited',    // 'all', 'edited'
            where: context.storage('validate-where') || 'all'  // 'all', 'visible'
        };
    }

    // listen for updates that affect the "no issues" box
    context.validator().on('validated.uiPaneIssues',
        function() { window.requestIdleCallback(update); }
    );
    context.map().on('move.uiPaneIssues',
        _debounce(function() { window.requestIdleCallback(update); }, 1000)
    );


    function updateOptionValue(d, val) {
        if (!val && d3_event && d3_event.target) {
            val = d3_event.target.value;
        }

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
            .property('checked', function(d) { return getOptions()[d.key] === d.value; })
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

    function setNoIssuesText() {

        var opts = getOptions();

        function checkForHiddenIssues(cases) {
            for (var type in cases) {
                var hiddenOpts = cases[type];
                var hiddenIssues = context.validator().getIssues(hiddenOpts);
                if (hiddenIssues.length) {
                    issuesPane.selection().select('.issues-none .details')
                        .text(t(
                            'issues.no_issues.hidden_issues.' + type,
                            { count: hiddenIssues.length.toString() }
                        ));
                    return;
                }
            }
            issuesPane.selection().select('.issues-none .details')
                .text(t('issues.no_issues.hidden_issues.none'));
        }

        var messageType;

        if (opts.what === 'edited' && opts.where === 'visible') {

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

        } else if (opts.what === 'edited' && opts.where === 'all') {

            messageType = 'edits';

            checkForHiddenIssues({
                everything_else: { what: 'all', where: 'all' },
                disabled_rules: { what: 'edited', where: 'all', includeDisabledRules: 'only' },
                ignored_issues: { what: 'edited', where: 'all', includeIgnored: 'only' }
            });

        } else if (opts.what === 'all' && opts.where === 'visible') {

            messageType = 'everything_in_view';

            checkForHiddenIssues({
                elsewhere: { what: 'all', where: 'all' },
                disabled_rules: { what: 'all', where: 'visible', includeDisabledRules: 'only' },
                disabled_rules_elsewhere: { what: 'all', where: 'all', includeDisabledRules: 'only' },
                ignored_issues: { what: 'all', where: 'visible', includeIgnored: 'only' },
                ignored_issues_elsewhere: { what: 'all', where: 'all', includeIgnored: 'only' }
            });
        } else if (opts.what === 'all' && opts.where === 'all') {

            messageType = 'everything';

            checkForHiddenIssues({
                disabled_rules: { what: 'all', where: 'all', includeDisabledRules: 'only' },
                ignored_issues: { what: 'all', where: 'all', includeIgnored: 'only' }
            });
        }

        if (opts.what === 'edited' && context.history().difference().summary().length === 0) {
            messageType = 'no_edits';
        }

        issuesPane.selection().select('.issues-none .message')
            .text(t('issues.no_issues.message.' + messageType));

    }


    function update() {
        var issues = context.validator().getIssues(getOptions());

        var hasIssues = issues.length > 0;

        var issuesNone = issuesPane.selection().select('.issues-none');
        issuesNone.classed('hide', hasIssues);
        if (!hasIssues) {
            renderIgnoredIssuesReset(issuesNone);
            setNoIssuesText();
        }

        issuesPane.selection().select('.issues-errors')
            .call(_validationErrors.render);

        issuesPane.selection().select('.issues-warnings')
            .call(_validationWarnings.render);

        issuesPane.selection().select('.issues-rules')
            .call(_validationRules.render);
    }


    var issuesPane = uiPane('issues', context)
        .key(t('issues.key'))
        .title(t('issues.title'))
        .description(t('issues.title'))
        .iconName('iD-icon-alert');


    issuesPane.renderContent = function(content) {

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
            .attr('class', 'issues-errors');

        // warnings
        content
            .append('div')
            .attr('class', 'issues-warnings');

        // rules list
        content
            .append('div')
            .attr('class', 'issues-rules');

        update();
    };

    return issuesPane;
}
