import {
    select as d3_select
} from 'd3-selection';

import { svgIcon } from '../svg/icon';
import { t, localizer } from '../core/localizer';
import { uiTooltip } from './tooltip';
import type { uiSection } from './section';

export interface uiPane {
    id: string;
    label: GetSet<this, d3.SelectorExact<HTMLHeadingElement>>;
    key: GetSet<this, string>;
    description: GetSet<this, string>;
    iconName: GetSet<this, string>;
    sections: GetSet<this, uiSection[]>;
    selection(): d3.Selection<HTMLDivElement>;
    togglePane(d3_event: KeyboardEvent): void;
    renderToggleButton(selection: d3.Selection): void;
    renderContent(selection: d3.Selection<HTMLDivElement>): void;
    renderPane(selection: d3.Selection): void;
}

export function uiPane(id: string, context: iD.Context) {

    var _key: string;
    var _label = '' as unknown as d3.SelectorExact<HTMLHeadingElement>;
    var _description = '';
    var _iconName = '';
    var _sections: uiSection[]; // array of uiSection objects

    var _paneSelection = d3_select<HTMLDivElement, unknown>(null!);

    var _paneTooltip: uiTooltip<HTMLButtonElement>;

    const pane: uiPane = function() {};
    pane.id = id;

    pane.label = function(val) {
        if (!arguments.length) return _label;
        _label = val;
        return pane;
    } as uiPane['label'];

    pane.key = function(val) {
        if (!arguments.length) return _key;
        _key = val;
        return pane;
    } as uiPane['key'];

    pane.description = function(val) {
        if (!arguments.length) return _description;
        _description = val;
        return pane;
    } as uiPane['description'];

    pane.iconName = function(val) {
        if (!arguments.length) return _iconName;
        _iconName = val;
        return pane;
    } as uiPane['iconName'];

    pane.sections = function(val) {
        if (!arguments.length) return _sections;
        _sections = val;
        return pane;
    } as uiPane['sections'];

    pane.selection = function() {
        return _paneSelection;
    };

    function hidePane() {
        context.ui().togglePanes();
    }

    pane.togglePane = function(d3_event) {
        if (d3_event) d3_event.preventDefault();
        _paneTooltip.hide();
        context.ui().togglePanes(!_paneSelection.classed('shown') ? _paneSelection : undefined);
    };

    pane.renderToggleButton = function(selection) {

        if (!_paneTooltip) {
            _paneTooltip = uiTooltip<HTMLButtonElement>()
                .scrollContainer(context.container().select('.over-map'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
                .title(() => _description)
                .keys([_key]);
        }

        selection
            .append('button')
            .on('click', pane.togglePane)
            .call(svgIcon('#' + _iconName, 'light'))
            .call(_paneTooltip);
    };

    pane.renderContent = function(selection) {
        // override to fully customize content

        if (_sections) {
            _sections.forEach(function(section) {
                selection.call(section.render);
            });
        }
    };

    pane.renderPane = function(selection) {

        _paneSelection = selection
            .append('div')
            .attr('class', 'fillL map-pane hide ' + id + '-pane')
            .attr('pane', id);

        var heading = _paneSelection
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text('')
            .call(_label);

        heading
            .append('button')
            .attr('title', t('icons.close'))
            .on('click', hidePane)
            .call(svgIcon('#iD-icon-close'));


        _paneSelection
            .append('div')
            .attr('class', 'pane-content')
            .call(pane.renderContent);

        if (_key) {
            context.keybinding()
                .on(_key, pane.togglePane);
        }
    };

    return pane;
}
