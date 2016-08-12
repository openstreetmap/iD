import { rebind } from '../../util/rebind';
import { getSetValue } from '../../util/get_set_value';
import * as d3 from 'd3';
import { t } from '../../util/locale';
import { nominatim as nominatimService } from '../../services/index';
import { phoneFormats } from '../../../data/index';

export {
  url as text,
  url as number,
  url as tel,
  url as email
};
export function url(field, context) {

    var dispatch = d3.dispatch('change'),
        input,
        entity;

    function i(selection) {
        var fieldId = 'preset-input-' + field.id;

        input = selection.selectAll('input')
            .data([0]);

        input.enter().append('input')
            .attr('type', field.type)
            .attr('id', fieldId)
            .attr('placeholder', field.placeholder() || t('inspector.unknown'));

        input
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());

        if (field.type === 'tel') {
            var center = entity.extent(context.graph()).center();
            nominatimService.init();
            nominatimService.countryCode(center, function (err, countryCode) {
                if (err || !phoneFormats[countryCode]) return;
                selection.selectAll('#' + fieldId)
                    .attr('placeholder', phoneFormats[countryCode]);
            });

        } else if (field.type === 'number') {
            input.attr('type', 'text');

            var spinControl = selection.selectAll('.spin-control')
                .data([0]);

            var enter = spinControl.enter().append('div')
                .attr('class', 'spin-control');

            enter.append('button')
                .datum(1)
                .attr('class', 'increment')
                .attr('tabindex', -1);

            enter.append('button')
                .datum(-1)
                .attr('class', 'decrement')
                .attr('tabindex', -1);

            spinControl.selectAll('button')
                .on('click', function(d) {
                    d3.event.preventDefault();
                    var num = parseInt(input.node().value || 0, 10);
                    if (!isNaN(num)) input.node().value = num + d;
                    change()();
                });
        }
    }

    function change(onInput) {
        return function() {
            var t = {};
            t[field.key] = getSetValue(input) || undefined;
            dispatch.call("change", this, t, onInput);
        };
    }

    i.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return i;
    };

    i.tags = function(tags) {
        getSetValue(input, tags[field.key] || '');
    };

    i.focus = function() {
        var node = input.node();
        if (node) node.focus();
    };

    return rebind(i, dispatch, 'on');
}
