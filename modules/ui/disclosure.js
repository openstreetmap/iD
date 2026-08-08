import { dispatch as d3_dispatch } from 'd3-dispatch';

import { prefs } from '../core/preferences';
import { svgIcon } from '../svg/icon';
import { utilFunctor } from '../util';
import { utilRebind } from '../util/rebind';
import { uiToggle } from './toggle';
import { t, localizer } from '../core/localizer';


export function uiDisclosure(context, key, expandedDefault) {
    const dispatch = d3_dispatch('toggled');
    let _expanded;
    let _label = utilFunctor('');
    let _updatePreference = true;
    let _content = function () {};
    let _headerOptions = null;


    const disclosure = function(selection) {

        if (_expanded === undefined || _expanded === null) {
            // loading _expanded here allows it to be reset by calling `disclosure.expanded(null)`

            const preference = prefs('disclosure.' + key + '.expanded');
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
            .attr('class', 'hide-toggle hide-toggle-' + key);

        const labelEnter = summaryEnter
            .append('span')
            .attr('class', 'hide-toggle-label')
            .call(svgIcon('', 'pre-text', 'hide-toggle-icon'));

        labelEnter
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

        if (_headerOptions) {
            const options = summary.selectAll('.disclosure-header-options')
                .data([0]);
            options.enter()
                .append('div')
                .attr('class', 'disclosure-header-options')
                // don't toggle the disclosure when interacting with header controls
                .on('click', d3_event => d3_event.stopPropagation());
            summary.selectAll('.disclosure-header-options')
                .call(_headerOptions);
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

            // keep the open attribute in sync (we preventDefault the native toggle)
            // so :open / :not(:open) CSS for header options works
            details.property('open', _expanded);

            updateSummary();

            contentWrap.call(uiToggle(_expanded));

            if (_expanded) {
                contentWrap.call(_content);
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


    // Optional controls rendered inside the summary (e.g. view toggle, add button).
    // Hidden via CSS when the disclosure is closed (`details:not(:open)`).
    disclosure.headerOptions = function(val) {
        if (!arguments.length) return _headerOptions;
        _headerOptions = val;
        return disclosure;
    };


    return utilRebind(disclosure, dispatch, 'on');
}
