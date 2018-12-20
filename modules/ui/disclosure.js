import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event } from 'd3-selection';

import { svgIcon } from '../svg';
import { utilRebind } from '../util/rebind';
import { uiToggle } from './toggle';
import { textDirection } from '../util/locale';


export function uiDisclosure(context, key, expandedDefault) {
    var dispatch = d3_dispatch('toggled');
    var _preference = (context.storage('disclosure.' + key + '.expanded'));
    var _expanded = (_preference === null ? !!expandedDefault : (_preference === 'true'));
    var _title;
    var _updatePreference = true;
    var _content = function () {};


    var disclosure = function(selection) {
        var hideToggle = selection.selectAll('.hide-toggle-' + key)
            .data([0]);

        // enter
        var hideToggleEnter = hideToggle.enter()
            .append('a')
            .attr('href', '#')
            .attr('class', 'hide-toggle hide-toggle-' + key)
            .call(svgIcon('', 'pre-text', 'hide-toggle-icon'));

        hideToggleEnter
            .append('span')
            .attr('class', 'hide-toggle-text');

        // update
        hideToggle = hideToggleEnter
            .merge(hideToggle);

        hideToggle
            .on('click', toggle)
            .classed('expanded', _expanded);

        hideToggle.selectAll('.hide-toggle-text')
            .text(_title);

        hideToggle.selectAll('.hide-toggle-icon')
            .attr('xlink:href', _expanded ? '#iD-icon-down'
                : (textDirection === 'rtl') ? '#iD-icon-backward' : '#iD-icon-forward'
            );


        var wrap = selection.selectAll('.disclosure-wrap')
            .data([0]);

        // enter/update
        wrap = wrap.enter()
            .append('div')
            .attr('class', 'disclosure-wrap disclosure-wrap-' + key)
            .merge(wrap)
            .classed('hide', !_expanded);

        if (_expanded) {
            wrap
                .call(_content);
        }


        function toggle() {
            d3_event.preventDefault();

            _expanded = !_expanded;

            if (_updatePreference) {
                context.storage('disclosure.' + key + '.expanded', _expanded);
            }

            hideToggle
                .classed('expanded', _expanded);

            hideToggle.selectAll('.hide-toggle-icon')
                .attr('xlink:href', _expanded ? '#iD-icon-down'
                    : (textDirection === 'rtl') ? '#iD-icon-backward' : '#iD-icon-forward'
                );

            if (_expanded) {
                wrap
                    .call(_content);
            }

            wrap
                .call(uiToggle(_expanded));

            dispatch.call('toggled', this, _expanded);
        }
    };


    disclosure.title = function(val) {
        if (!arguments.length) return _title;
        _title = val;
        return disclosure;
    };


    disclosure.expanded = function(val) {
        if (!arguments.length) return _expanded;
        _expanded = val;
        return disclosure;
    };


    disclosure.updatePreference = function(val) {
        if (!arguments.length) return _updatePreference;
        _updatePreference = val;
        return disclosure;
    };


    disclosure.content = function(val) {
        if (!arguments.length) return _content;
        _content = val;
        return disclosure;
    };


    return utilRebind(disclosure, dispatch, 'on');
}
