import {
    select as d3_select
} from 'd3-selection';
import { clamp } from 'es-toolkit/compat';

import { prefs } from '../../core/preferences';
import { t, localizer } from '../../core/localizer';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';


export function uiSectionBackgroundDisplayOptions(context) {

    var section = uiSection('background-display-options', context)
        .label(() => t.append('background.display_options'))
        .disclosureContent(renderDisclosureContent);

    var _storedOpacity = prefs('background-opacity');
    var _sliders = ['brightness', 'contrast', 'saturation', 'sharpness', 'invert'];

    var _options = {
        brightness: {
            def: 1,
            val: _storedOpacity !== null ? +_storedOpacity : 1,
            min: 0,
            max: 3
        },
        contrast: { def: 1, val: 1, min: 0, max: 3 },
        saturation: { def: 1, val: 1, min: 0, max: 3 },
        sharpness: { def: 1, val: 1, min: 0, max: 3 },
        invert: { def: 0, val: 0, min: 0, max: 1 }
    };

    function updateValue(d, val) {
        val = clamp(val, _options[d].min, _options[d].max);

        _options[d].val = val;
        context.background()[d](val);

        if (d === 'brightness') {
            prefs('background-opacity', val);
        }

        section.reRender();
    }

    function renderDisclosureContent(selection) {
        var container = selection.selectAll('.display-options-container')
            .data([0]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'display-options-container controls-list');

        // add slider controls
        var slidersEnter = containerEnter.selectAll('.display-control')
            .data(_sliders)
            .enter()
            .append('label')
            .attr('class', function(d) { return 'display-control display-control-' + d; });

        slidersEnter
            .each(function(d) {
                d3_select(this).call(t.append('background.' + d));
            })
            .append('span')
            .attr('class', function(d) { return 'display-option-value display-option-value-' + d; });

        var sildersControlEnter = slidersEnter
            .append('div')
            .attr('class', 'control-wrap');

        sildersControlEnter
            .append('input')
            .attr('class', function(d) { return 'display-option-input display-option-input-' + d; })
            .attr('type', 'range')
            .attr('min', function(d) { return _options[d].min; })
            .attr('max', function(d) { return _options[d].max; })
            .attr('step', '0.01')
            .on('input', function(d3_event, d) {
                var val = d3_select(this).property('value');
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
                updateValue(d, _options[d].def);
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
                for (var i = 0; i < _sliders.length; i++) {
                    var slider = _sliders[i];
                    updateValue(slider, _options[slider].def);
                }
            });

        // update
        container = containerEnter
            .merge(container);

        container.selectAll('.display-option-input')
            .property('value', function(d) { return _options[d].val; });

        container.selectAll('.display-option-value')
            .text(function(d) { return Math.floor(_options[d].val * 100) + '%'; });

        container.selectAll('.display-option-reset')
            .classed('disabled', function(d) { return _options[d].val === _options[d].def; });

        // first time only, set brightness if needed
        if (containerEnter.size() && _options.brightness.val !== 1) {
            context.background().brightness(_options.brightness.val);
        }
    }

    return section;
}
