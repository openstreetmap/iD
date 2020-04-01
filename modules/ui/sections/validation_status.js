import _debounce from 'lodash-es/debounce';

import { svgIcon } from '../../svg/icon';
import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { uiSection } from '../section';

export function uiSectionValidationStatus(context) {

    var section = uiSection('issues-status', context)
        .content(renderContent)
        .shouldDisplay(function() {
            var issues = context.validator().getIssues(getOptions());
            return issues.length === 0;
        });

    function getOptions() {
        return {
            what: prefs('validate-what') || 'edited',
            where: prefs('validate-where') || 'all'
        };
    }

    function renderContent(selection) {

        var box = selection.selectAll('.box')
            .data([0]);

        var boxEnter = box.enter()
            .append('div')
            .attr('class', 'box');

        boxEnter
            .append('div')
            .call(svgIcon('#iD-icon-apply', 'pre-text'));

        var noIssuesMessage = boxEnter
            .append('span');

        noIssuesMessage
            .append('strong')
            .attr('class', 'message');

        noIssuesMessage
            .append('br');

        noIssuesMessage
            .append('span')
            .attr('class', 'details');

        renderIgnoredIssuesReset(selection);
        setNoIssuesText(selection);
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

    function setNoIssuesText(selection) {

        var opts = getOptions();

        function checkForHiddenIssues(cases) {
            for (var type in cases) {
                var hiddenOpts = cases[type];
                var hiddenIssues = context.validator().getIssues(hiddenOpts);
                if (hiddenIssues.length) {
                    selection.select('.box .details')
                        .text(t(
                            'issues.no_issues.hidden_issues.' + type,
                            { count: hiddenIssues.length.toString() }
                        ));
                    return;
                }
            }
            selection.select('.box .details')
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

        selection.select('.box .message')
            .text(t('issues.no_issues.message.' + messageType));

    }

    context.validator().on('validated.uiSectionValidationStatus', function() {
        window.requestIdleCallback(section.reRender);
    });

    context.map().on('move.uiSectionValidationStatus',
        _debounce(function() {
            window.requestIdleCallback(section.reRender);
        }, 1000)
    );

    return section;
}
