import {
    select as d3_select
} from 'd3-selection';

import { prefs } from '../../core/preferences';
import { t, localizer } from '../../core/localizer';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';


export function uiSectionBackgroundDisplayOptions(context) {

    const section = uiSection('background-display-options', context)
        .label(() => t.append('background.display_options'))
        .disclosureContent(renderDisclosureContent);

    const _storedOpacity = prefs('background-opacity');
    const _minVal = 0;
    const _maxVal = 3;

    const _sliders = ['brightness', 'contrast', 'saturation', 'sharpness'];

    const _options = {
        brightness: (_storedOpacity !== null ? (+_storedOpacity) : 1),
        contrast: 1,
        saturation: 1,
        sharpness: 1
    };

    function clamp(x, min, max) {
        return Math.max(min, Math.min(x, max));
    }

    function updateValue(d, val) {
        val = clamp(val, _minVal, _maxVal);

        _options[d] = val;
        context.background()[d](val);

        if (d === 'brightness') {
            prefs('background-opacity', val);
        }

        section.reRender();
    }

    function renderDisclosureContent(selection) {
        let container = selection.selectAll('.display-options-container')
            .data([0]);

        const containerEnter = container.enter()
            .append('div')
            .attr('class', 'display-options-container controls-list');

        // add slider controls
        const slidersEnter = containerEnter.selectAll('.display-control')
            .data(_sliders)
            .enter()
            .append('label')
            .attr('class', function(d) { return 'display-control display-control-' + d; });

        slidersEnter
            .html(function(d) { return t.html('background.' + d); })
            .append('span')
            .attr('class', function(d) { return 'display-option-value display-option-value-' + d; });

        const sildersControlEnter = slidersEnter
            .append('div')
            .attr('class', 'control-wrap');

        sildersControlEnter
            .append('input')
            .attr('class', function(d) { return 'display-option-input display-option-input-' + d; })
            .attr('type', 'range')
            .attr('min', _minVal)
            .attr('max', _maxVal)
            .attr('step', '0.05')
            .on('input', function(d3_event, d) {
                let val = d3_select(this).property('value');
                if (!val && d3_event && d3_event.target) {
                    val = d3_event.target.value;
                }
                updateValue(d, val);
            });

        sildersControlEnter
            .append('button')
            .attr('title', function(d) { return `${t('background.reset')} ${t('background.' + d)}`; })
            .attr('class', function(d) { return 'display-option-reset display-option-reset-' + d; })
            .on('click', function(d3_event, d) {
                if (d3_event.button !== 0) return;
                updateValue(d, 1);
            })
            .call(svgIcon('#iD-icon-' + (localizer.textDirection() === 'rtl' ? 'redo' : 'undo')));

        // reset all button
        containerEnter
            .append('a')
            .attr('class', 'display-option-resetlink')
            .attr('role', 'button')
            .attr('href', '#')
            .call(t.append('background.reset_all'))
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                for (let i = 0; i < _sliders.length; i++) {
                    updateValue(_sliders[i], 1);
                }
            });

        // update
        container = containerEnter
            .merge(container);

        container.selectAll('.display-option-input')
            .property('value', function(d) { return _options[d]; });

        container.selectAll('.display-option-value')
            .text(function(d) { return Math.floor(_options[d] * 100) + '%'; });

        container.selectAll('.display-option-reset')
            .classed('disabled', function(d) { return _options[d] === 1; });

        // first time only, set brightness if needed
        if (containerEnter.size() && _options.brightness !== 1) {
            context.background().brightness(_options.brightness);
        }
    }

    return section;
}
