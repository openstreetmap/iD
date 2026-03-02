import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { prefs } from '../core/preferences';
import { svgIcon } from '../svg/icon';
import { utilFunctor } from '../util';
import { utilRebind } from '../util/rebind';
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

        let details = selection.selectAll('.disclosure-wrap-' + key)
            .data([0]);

        // enter
        const detailsEnter = details.enter()
            .append('details')
            .attr('class', 'disclosure-wrap disclosure-wrap-' + key);

        const summaryEnter = detailsEnter
            .append('summary')
            .attr('class', 'hide-toggle hide-toggle-' + key)
            .call(svgIcon('', 'pre-text', 'hide-toggle-icon'));

        summaryEnter
            .append('span')
            .attr('class', 'hide-toggle-text');

        detailsEnter
            .append('div')
            .attr('class', 'disclosure-content');

        // update
        details = detailsEnter
            .merge(details);

        details
            .property('open', _expanded);

        const summary = details.selectAll('summary.hide-toggle');

        summary
            .on('click', toggle);

        updateSummary();

        const label = _label();
        const labelSelection = summary.selectAll('.hide-toggle-text');
        if (typeof label !== 'function') {
            labelSelection.text(label);
        } else {
            labelSelection.text('').call(label);
        }

        const contentWrap = details.selectAll('.disclosure-content');

        if (_expanded) {
            contentWrap
                .call(_content);
        }


        function updateSummary() {
            summary
                .classed('expanded', _expanded)
                .attr('title', t(`icons.${_expanded ? 'collapse' : 'expand'}`));

            summary.selectAll('.hide-toggle-icon')
                .attr('xlink:href', _expanded ? '#iD-icon-down'
                    : (localizer.textDirection() === 'rtl') ? '#iD-icon-backward' : '#iD-icon-forward'
                );
        }


        function toggle(d3_event) {
            d3_event.preventDefault();

            _expanded = !_expanded;

            if (_updatePreference) {
                prefs('disclosure.' + key + '.expanded', _expanded);
            }

            updateSummary();

            if (_expanded) {
                details.property('open', true);
                contentWrap.call(_content);
                contentWrap
                    .style('opacity', 0)
                    .transition()
                    .style('opacity', 1)
                    .on('end', function() {
                        d3_select(this).style('opacity', null);
                    });
            } else {
                contentWrap
                    .style('opacity', 1)
                    .transition()
                    .style('opacity', 0)
                    .on('end', function() {
                        d3_select(this).style('opacity', null);
                        details.property('open', false);
                    });
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
