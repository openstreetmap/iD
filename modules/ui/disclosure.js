import { dispatch as d3_dispatch } from 'd3-dispatch';

import { prefs } from '../core/preferences';
import { svgIcon } from '../svg/icon';
import { utilFunctor } from '../util';
import { utilRebind } from '../util/rebind';
import { uiToggle } from './toggle';
import { t, localizer } from '../core/localizer';


export function uiDisclosure(context, key, expandedDefault) {
    var dispatch = d3_dispatch('toggled');
    var _expanded;
    var _label = utilFunctor('');
    var _updatePreference = true;
    var _content = function () {};


    var disclosure = function(selection) {

        if (_expanded === undefined || _expanded === null) {
            // loading _expanded here allows it to be reset by calling `disclosure.expanded(null)`

            var preference = prefs('disclosure.' + key + '.expanded');
            _expanded = preference === null ? !!expandedDefault : (preference === 'true');
        }

        var hideToggle = selection.selectAll('.hide-toggle-' + key)
            .data([0]);

        // enter
        var hideToggleEnter = hideToggle.enter()
            .append('h3')
            .append('a')
            .attr('role', 'button')
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
            .attr('title', t(`icons.${_expanded ? 'collapse' : 'expand'}`))
            .attr('aria-expanded', _expanded)
            .classed('expanded', _expanded);

        const label = _label();
        const labelSelection = hideToggle.selectAll('.hide-toggle-text');
        if (typeof label !== 'function') {
            labelSelection.text(_label());
        } else {
            labelSelection.text('').call(label);
        }

        hideToggle.selectAll('.hide-toggle-icon')
            .attr('xlink:href', _expanded ? '#iD-icon-down'
                : (localizer.textDirection() === 'rtl') ? '#iD-icon-backward' : '#iD-icon-forward'
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


        function toggle(d3_event) {
            d3_event.preventDefault();

            _expanded = !_expanded;

            if (_updatePreference) {
                prefs('disclosure.' + key + '.expanded', _expanded);
            }

            hideToggle
                .classed('expanded', _expanded)
                .attr('aria-expanded', _expanded)
                .attr('title', t(`icons.${_expanded ? 'collapse' : 'expand'}`));

            hideToggle.selectAll('.hide-toggle-icon')
                .attr('xlink:href', _expanded ? '#iD-icon-down'
                    : (localizer.textDirection() === 'rtl') ? '#iD-icon-backward' : '#iD-icon-forward'
                );

            wrap
                .call(uiToggle(_expanded));

            if (_expanded) {
                wrap
                    .call(_content);
            }

            dispatch.call('toggled', this, _expanded);
        }
    };


    disclosure.label = function(val) {
        if (!arguments.length) return _label;
        _label = utilFunctor(val);
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
