import _debounce from 'lodash-es/debounce';
import {
    select as d3_select
} from 'd3-selection';

//import { actionNoop } from '../actions/noop';
import { geoSphericalDistance } from '../../geo';
import { svgIcon } from '../../svg/icon';
import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { utilHighlightEntities } from '../../util';
import { uiSection } from '../section';

export function uiSectionValidationIssues(id, severity, context) {

    var _issues = [];

    var section = uiSection(id, context)
        .title(function() {
            if (!_issues) return '';
            var issueCountText = _issues.length > 1000 ? '1000+' : String(_issues.length);
            return t('issues.' + severity + 's.list_title', { count: issueCountText });
        })
        .disclosureContent(renderDisclosureContent)
        .shouldDisplay(function() {
            return _issues && _issues.length;
        });

    function getOptions() {
        return {
            what: prefs('validate-what') || 'edited',
            where: prefs('validate-where') || 'all'
        };
    }

    // get and cache the issues to display, unordered
    function reloadIssues() {
        _issues = context.validator().getIssuesBySeverity(getOptions())[severity];
    }

    function renderDisclosureContent(selection) {

        var center = context.map().center();
        var graph = context.graph();

        // sort issues by distance away from the center of the map
        var issues = _issues.map(function withDistance(issue) {
                var extent = issue.extent(graph);
                var dist = extent ? geoSphericalDistance(center, extent.center()) : 0;
                return Object.assign(issue, { dist: dist });
            })
            .sort(function byDistance(a, b) {
                return a.dist - b.dist;
            });

        // cut off at 1000
        issues = issues.slice(0, 1000);

        //renderIgnoredIssuesReset(_warningsSelection);

        selection
            .call(drawIssuesList, issues);
    }

    function drawIssuesList(selection, issues) {
        var list = selection.selectAll('.issues-list')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'layer-list issues-list ' + severity + 's-list')
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

        if (severity === 'warning') {
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

    context.validator().on('validated.uiSectionValidationIssues' + id, function() {
        window.requestIdleCallback(function() {
            reloadIssues();
            section.reRender();
        });
    });

    context.map().on('move.uiSectionValidationIssues' + id,
        _debounce(function() {
            window.requestIdleCallback(function() {
                if (getOptions().where === 'visible') {
                    // must refetch issues if they are viewport-dependent
                    reloadIssues();
                }
                // always reload list to re-sort-by-distance
                section.reRender();
            });
        }, 1000)
    );

    return section;
}
