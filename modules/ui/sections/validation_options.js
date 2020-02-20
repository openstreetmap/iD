import {
    event as d3_event
} from 'd3-selection';

import { t } from '../../util/locale';
import { uiSection } from '../section';

export function uiSectionValidationOptions(context) {

    var section = uiSection('issues-options', context)
        .content(renderContent);

    function renderContent(selection) {

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

    function getOptions() {
        return {
            what: context.storage('validate-what') || 'edited',  // 'all', 'edited'
            where: context.storage('validate-where') || 'all'    // 'all', 'visible'
        };
    }

    function updateOptionValue(d, val) {
        if (!val && d3_event && d3_event.target) {
            val = d3_event.target.value;
        }

        context.storage('validate-' + d, val);
        context.validator().validate();
    }

    return section;
}
