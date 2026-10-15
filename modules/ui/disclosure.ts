import { dispatch as d3_dispatch } from 'd3-dispatch';

import { prefs } from '../core/preferences';
import { svgIcon } from '../svg/icon';
import { utilFunctor } from '../util';
import { utilRebind } from '../util/rebind';
import { uiToggle } from './toggle';
import { t, localizer } from '../core/localizer';

export interface uiDisclosure extends d3.Selector {
    label: GetSetFunctor<this, string | d3.Selector>;
    expanded: GetSet<this, boolean>;
    updatePreference: GetSet<this, boolean>;
    content: GetSet<this, d3.SelectorExact<HTMLDivElement>>;
}

export function uiDisclosure(context: iD.Context, key: string, expandedDefault?: boolean) {
    const dispatch = d3_dispatch('toggled');
    let _expanded: boolean | undefined | null;
    let _label = utilFunctor<string | d3.Selector, []>('');
    let _updatePreference = true;
    let _content: d3.SelectorExact<HTMLDivElement> = function () {};


    const disclosure: uiDisclosure = function(selection) {

        if (_expanded === undefined || _expanded === null) {
            // loading _expanded here allows it to be reset by calling `disclosure.expanded(null)`

            const preference = prefs('disclosure.' + key + '.expanded');
            _expanded = preference === null ? !!expandedDefault : (preference === 'true');
        }

        let details = selection.selectAll<HTMLDetailsElement, 0>('.disclosure-wrap-' + key)
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

        const summary = details.selectAll<HTMLElement, unknown>('summary.hide-toggle');

        summary
            .on('click', toggle);

        updateSummary();

        const label = _label();
        const labelSelection = summary.selectAll<HTMLElement, unknown>('.hide-toggle-text');
        if (typeof label !== 'function') {
            labelSelection.text(label);
        } else {
            labelSelection.text('').call(label);
        }

        const contentWrap = details.selectAll<HTMLDivElement, unknown>('.disclosure-content');

        if (_expanded) {
            contentWrap
                .call(_content);
        }


        function updateSummary() {
            summary
                .classed('expanded', _expanded!)
                .attr('title', t(`icons.${_expanded ? 'collapse' : 'expand'}`));

            summary.selectAll('.hide-toggle-icon')
                .attr('xlink:href', _expanded ? '#iD-icon-down'
                    : (localizer.textDirection() === 'rtl') ? '#iD-icon-backward' : '#iD-icon-forward'
                );
        }


        function toggle(this: HTMLElement, d3_event: MouseEvent) {
            d3_event.preventDefault();

            _expanded = !_expanded;

            if (_updatePreference) {
                prefs('disclosure.' + key + '.expanded', _expanded);
            }

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
        _label = utilFunctor<string | d3.Selector, []>(val);
        return disclosure;
    } as uiDisclosure['label'];


    disclosure.expanded = function(val) {
        if (!arguments.length) return _expanded;
        _expanded = val;
        return disclosure;
    } as uiDisclosure['expanded'];


    disclosure.updatePreference = function(val) {
        if (!arguments.length) return _updatePreference;
        _updatePreference = val;
        return disclosure;
    } as uiDisclosure['updatePreference'];


    disclosure.content = function(val) {
        if (!arguments.length) return _content;
        _content = val;
        return disclosure;
    } as uiDisclosure['content'];


    return utilRebind(disclosure, dispatch, 'on');
}
