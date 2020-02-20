import {
    select as d3_select
} from 'd3-selection';

import { uiDisclosure } from './disclosure';
import { utilFunctor } from '../util';

// A unit of controls or info to be used in a layout, such as within a pane.
// Can be labeled and collapsible.
export function uiSection(id, context) {

    var _disclosure;
    var _title;
    var _expandedByDefault = utilFunctor(true);
    var _shouldDisplay;

    var _containerSelection = d3_select(null);

    var section = {
        id: id
    };

    section.title = function(val) {
        if (!arguments.length) return _title;
        _title = utilFunctor(val);
        return section;
    };

    section.expandedByDefault = function(val) {
        if (!arguments.length) return _expandedByDefault;
        _expandedByDefault = utilFunctor(val);
        return section;
    };

    section.shouldDisplay = function(val) {
        if (!arguments.length) return _shouldDisplay;
        _shouldDisplay = utilFunctor(val);
        return section;
    };

    // may be called multiple times
    section.render = function(selection) {

        _containerSelection = selection
            .selectAll('.section-' + id)
            .data([0]);

        var sectionEnter = _containerSelection
            .enter()
            .append('div')
            .attr('class', 'section section-' + id);

        _containerSelection = sectionEnter
            .merge(_containerSelection);

        _containerSelection
            .call(renderContent);
    };

    section.containerSelection = function() {
        return _containerSelection;
    };

    function renderContent(selection) {
        if (_shouldDisplay) {
            var shouldDisplay = _shouldDisplay();
            selection.classed('hide', !shouldDisplay);
            if (!shouldDisplay) {
                selection.html('');
                return;
            }
        }
        section.renderContent(selection);
    }

    // may be called multiple times
    section.renderContent = function(containerSelection) {

        if (section.renderDisclosureContent) {
            if (!_disclosure) {
                _disclosure = uiDisclosure(context, id.replace(/-/g, '_'), _expandedByDefault())
                    .title(_title || '')
                    .content(section.renderDisclosureContent);
            }
            containerSelection
                .call(_disclosure);
        }
    };

    section.rerenderContent = function() {
        _containerSelection
            .call(renderContent);
    };

    // override to enable disclosure
    section.renderDisclosureContent = undefined;

    return section;
}
