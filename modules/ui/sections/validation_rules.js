import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { utilGetSetValue, utilNoAuto } from '../../util';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';

export function uiSectionValidationRules(context) {

    var MINSQUARE = 0;
    var MAXSQUARE = 20;
    var DEFAULTSQUARE = 5;  // see also unsquare_way.js

    var section = uiSection('issues-rules', context)
        .disclosureContent(renderDisclosureContent)
        .title(t('issues.rules.title'));

    var _ruleKeys = context.validator().getRuleKeys()
        .filter(function(key) { return key !== 'maprules'; })
        .sort(function(key1, key2) {
            // alphabetize by localized title
            return t('issues.' + key1 + '.title') < t('issues.' + key2 + '.title') ? -1 : 1;
        });

    function renderDisclosureContent(selection) {
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
                context.validator().disableRules(_ruleKeys);
            });


        // Update
        container = container
            .merge(containerEnter);

        container.selectAll('.issue-rules-list')
            .call(drawListItems, _ruleKeys, 'checkbox', 'rule', toggleRule, isRuleEnabled);
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
                .call(uiTooltip()
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
        var degStr = prefs('validate-square-degrees');
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

        prefs('validate-square-degrees', degStr);
        context.validator().reloadUnsquareIssues();
    }

    function isRuleEnabled(d) {
        return context.validator().isRuleEnabled(d);
    }

    function toggleRule(d) {
        context.validator().toggleRule(d);
    }

    context.validator().on('validated.uiSectionValidationRules', function() {
        window.requestIdleCallback(section.reRender);
    });

    return section;
}
