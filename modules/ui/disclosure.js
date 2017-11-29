import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event } from 'd3-selection';

import { svgIcon } from '../svg';
import { utilRebind } from '../util/rebind';
import { uiToggle } from './toggle';
import { textDirection } from '../util/locale';


export function uiDisclosure(context, key, expandedDefault) {
    var dispatch = d3_dispatch('toggled'),
        _preference = (context.storage('disclosure.' + key + '.expanded')),
        _expanded = (_preference === null ? !!expandedDefault : (_preference === 'true')),
        _title,
        _updatePreference = true,
        _content = function () {};


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
            .attr('xlink:href', _expanded ? '#icon-down'
                : (textDirection === 'rtl') ? '#icon-backward' : '#icon-forward'
            );


        var wrap = selection.selectAll('.disclosure-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'disclosure-wrap disclosure-wrap-' + key)
            .merge(wrap);

        wrap
            .classed('hide', !_expanded)
            .call(_content);


        function toggle() {
            d3_event.preventDefault();

            _expanded = !_expanded;

            if (_updatePreference) {
                context.storage('disclosure.' + key + '.expanded', _expanded);
            }

            hideToggle
                .classed('expanded', _expanded);

            hideToggle.selectAll('.hide-toggle-icon')
                .attr('xlink:href', _expanded ? '#icon-down'
                    : (textDirection === 'rtl') ? '#icon-backward' : '#icon-forward'
                );

            wrap
                .call(uiToggle(_expanded));

            dispatch.call('toggled', this, _expanded);
        }
    };


    disclosure.title = function(_) {
        if (!arguments.length) return _title;
        _title = _;
        return disclosure;
    };


    disclosure.expanded = function(_) {
        if (!arguments.length) return _expanded;
        _expanded = _;
        return disclosure;
    };


    disclosure.updatePreference = function(_) {
        if (!arguments.length) return _updatePreference;
        _updatePreference = _;
        return disclosure;
    };


    disclosure.content = function(_) {
        if (!arguments.length) return _content;
        _content = _;
        return disclosure;
    };


    return utilRebind(disclosure, dispatch, 'on');
}
