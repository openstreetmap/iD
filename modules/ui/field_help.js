import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg';


export function uiFieldHelp(fieldName) {
    var fieldHelp = {};
    var _body = d3_select(null);
    var _showing;


    function show() {
        _body
            .classed('hide', false)
            .transition()
            .duration(200)
            .style('height', '100%');

        _showing = true;
    }


    function hide() {
        _body
            .transition()
            .duration(200)
            .style('height', '0px')
            .on('end', function () {
                _body.classed('hide', true);
            });

        _showing = false;
    }


    fieldHelp.button = function(selection) {
        var button = selection.selectAll('.field-help-button')
            .data([0]);

        // enter/update
        button.enter()
            .append('button')
            .attr('class', 'field-help-button')
            .attr('tabindex', -1)
            .call(svgIcon('#icon-help'))
            .merge(button)
            .on('click', function () {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                if (_showing) {
                    hide();
                } else {
                    show();
                }
            });
    };


    fieldHelp.body = function(selection) {
        // this control expects the field to have a preset-input-wrap div
        var wrap = selection.selectAll('.preset-input-wrap');
        if (wrap.empty()) return;

        _body = wrap.selectAll('.field-help-body')
            .data([0]);

        var enter = _body.enter()
            .append('div')
            .attr('class', 'field-help-body cf hide')
            .style('height', '0px');

//debug
for (var i = 0; i < 15; i++) {
        enter
            .append('p')
            .attr('class', 'field-help-description')
            .text('lorem ipsum');
}

        _body = _body
            .merge(enter);

        if (_showing === false) {
            hide();
        }
    };


    fieldHelp.showing = function(_) {
        if (!arguments.length) return _showing;
        _showing = _;
        return fieldHelp;
    };


    return fieldHelp;
}
