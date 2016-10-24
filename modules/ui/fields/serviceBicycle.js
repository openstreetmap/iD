import * as d3 from 'd3';
import { d3combobox } from '../../lib/d3.combobox.js';
import { utilRebind } from '../../util/rebind';
import { utilGetSetValue } from '../../util/get_set_value';


export function uiFieldServiceBicycle(field) {
    var dispatch = d3.dispatch('change'),
        items = d3.select(null);

    function service(selection) {

        function stripcolon(s) {
            return s.replace(/:/g, '');
        }

        wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'cf preset-input-wrap')
            .merge(wrap);


        var div = wrap.selectAll('ul')
            .data([0]);

        div = div.enter()
            .append('ul')
            .merge(div);

        items = div.selectAll('li')
            .data(field.keys);

        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'cf preset-service_bicycle-' + stripcolon(d); });

        enter
            .append('span')
            .attr('class', 'col6 label preset-label-service_bicycle')
            .attr('for', function(d) { return 'preset-input-service_bicycle-' + stripcolon(d); })
            .text(function(d) { return field.t('types.' + d); });

        enter
            .append('div')
            .attr('class', 'col6 preset-input-service_bicycle-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', function(d) { return 'preset-input-service_bicycle preset-input-' + stripcolon(d); })
            .each(function(d) {
                d3.select(this).call(d3combobox().data(service.options(d)));
            });

        // Update
        wrap.selectAll('.preset-input-service_bicycle')
            .on('change', change)
            .on('blur', change);
    }


    function change() {
        var retail = utilGetSetValue(d3.select('.preset-input-servicebicycleretail')),
            repair = utilGetSetValue(d3.select('.preset-input-servicebicyclerepair')),
            rental = utilGetSetValue(d3.select('.preset-input-servicebicyclerental')),
            tag = {};

        if (retail === 'none' || retail === '') { retail = undefined; }
        if (repair === 'none' || repair === '') { repair = undefined; }
        if (rental === 'none' || rental === '') { rental = undefined; }

        tag = {
          'service:bicycle:retail': retail,
          'service:bicycle:repair': repair,
          'service:bicycle:rental': rental
        };

        dispatch.call('change', this, tag);
    }


    service.options = function() {
        return d3.keys(field.strings.options).map(function(option) {
            return {
                title: field.t('options.' + option + '.description'),
                value: option
            };
        });
    };


    service.tags = function(tags) {
      utilGetSetValue(items.selectAll('.preset-input-service_bicycle'), function(d) {
          return tags[d] || '';
      })
          .attr('placeholder', field.placeholder());
    };


    service.focus = function() {
        items.selectAll('.preset-input-service_bicycle')
            .node().focus();
    };


    return utilRebind(service, dispatch, 'on');
}
