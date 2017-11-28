import { dispatch as d3_dispatch } from 'd3-dispatch';

import { utilRebind } from '../util/rebind';
import { uiToggle } from './toggle';


export function uiDisclosure(context, key, expandedDefault) {
    var dispatch = d3_dispatch('toggled'),
        _preference = (context.storage('disclosure.' + key + '.expanded')),
        _expanded = (_preference === null ? !!expandedDefault : (_preference === 'true')),
        _title,
        _updatePreference = true,
        _content = function () {};


    var disclosure = function(selection) {
        var hideToggle = selection.selectAll('.hide-toggle')
            .data([0]);

        hideToggle = hideToggle.enter()
            .append('a')
            .attr('href', '#')
            .attr('class', 'hide-toggle hide-toggle-' + key)
            .merge(hideToggle);

        hideToggle
            .text(_title)
            .on('click', toggle)
            .classed('expanded', _expanded);


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
            _expanded = !_expanded;
            if (_updatePreference) {
                context.storage('disclosure.' + key + '.expanded', _expanded);
            }
            hideToggle.classed('expanded', _expanded);
            wrap.call(uiToggle(_expanded));
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
