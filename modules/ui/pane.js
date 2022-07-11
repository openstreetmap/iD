import {
    select as d3_select
} from 'd3-selection';

import { svgIcon } from '../svg/icon';
import { t, localizer } from '../core/localizer';
import { uiTooltip } from './tooltip';


export function uiPane(id, context) {

    var _key;
    var _label = '';
    var _description = '';
    var _iconName = '';
    var _sections; // array of uiSection objects

    var _paneSelection = d3_select(null);

    var _paneTooltip;

    var pane = {
        id: id
    };

    pane.label = function(val) {
        if (!arguments.length) return _label;
        _label = val;
        return pane;
    };

    pane.key = function(val) {
        if (!arguments.length) return _key;
        _key = val;
        return pane;
    };

    pane.description = function(val) {
        if (!arguments.length) return _description;
        _description = val;
        return pane;
    };

    pane.iconName = function(val) {
        if (!arguments.length) return _iconName;
        _iconName = val;
        return pane;
    };

    pane.sections = function(val) {
        if (!arguments.length) return _sections;
        _sections = val;
        return pane;
    };

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
            _paneTooltip = uiTooltip()
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
