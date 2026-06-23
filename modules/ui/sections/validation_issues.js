import { debounce, sortBy } from 'es-toolkit';
import {
    select as d3_select
} from 'd3-selection';

import { geoSphericalDistance } from '../../geo';
import { svgIcon } from '../../svg/icon';
import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { utilHighlightEntities } from '../../util';
import { uiSection } from '../section';
import { validationIssue } from '../../core/validation';


export function uiSectionValidationIssues(id, severity, context) {

    var _issues = [];

    var section = uiSection(id, context)
        .label(function() {
            if (!_issues) return '';
            var issueCountText = _issues.length > 1000 ? '1000+' : String(_issues.length);
            return t.append('inspector.title_count', { title: t.append('issues.' + severity + 's.list_title'), count: issueCountText });
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
        // sort by the same order the rules are listed in the section below:
        // first by the issue's rule type (alphabetically by localized title),
        // then issue's internal subtype, and only then by distance from map center
        // finally: cut off at a maximum 1000 entries
        const center = context.map().center();
        const graph = context.graph();
        const rules = sortBy(context.validator().getRuleKeys().filter(key => key !== 'maprules'), [
            rule => t(`issues.${rule}.title`)
        ]);
        const withDistance = _issues.map(issue => {
            const extent = issue.extent(graph);
            return {
                ...issue,
                dist: extent ? geoSphericalDistance(center, extent.center()) : 0
            };
        });
        const issues = sortBy(withDistance, [
            issue => rules.indexOf(issue.type),
            'subtype',
            'dist'
        ]).slice(0, 1000);

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
            .data(issues, function(d) { return d.key; });

        // Exit
        items.exit()
            .remove();

        // Enter
        var itemsEnter = items.enter()
            .append('li')
            .attr('class', function (d) { return 'issue severity-' + d.severity; });

        var labelsEnter = itemsEnter
            .append('button')
            .attr('class', 'issue-label')
            .on('click', function(d3_event, d) {
                context.validator().focusIssue(d);
            })
            .on('mouseover', function(d3_event, d) {
                utilHighlightEntities(d.entityIds, true, context);
            })
            .on('mouseout', function(d3_event, d) {
                utilHighlightEntities(d.entityIds, false, context);
            });

        var textEnter = labelsEnter
            .append('span')
            .attr('class', 'issue-text');

        textEnter
            .append('span')
            .attr('class', 'issue-icon')
            .each(function(d) {
                d3_select(this)
                    .call(svgIcon(validationIssue.ICONS[d.severity]));
            });

        textEnter
            .append('span')
            .attr('class', 'issue-message');

        // Update
        items = items
            .merge(itemsEnter)
            .order();

        items.selectAll('.issue-message')
            .text('')
            .each(function(d) {
                return d.message(context)(d3_select(this));
            });
    }

    context.validator().on('validated.uiSectionValidationIssues' + id, function() {
        window.requestIdleCallback(function() {
            reloadIssues();
            section.reRender();
        });
    });

    context.map().on('move.uiSectionValidationIssues' + id,
        debounce(function() {
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
