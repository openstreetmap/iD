import {
    select as d3_select
} from 'd3-selection';

import { uiDisclosure } from './disclosure';

// A unit of controls or info to be used in a layout, such as within a pane.
// Can be labeled and collapsible.
export function uiSection(id, context) {

    var _disclosure;
    var _title;
    var _expandedByDefault = true;

    var _containerSelection = d3_select(null);

    var section = {
        id: id
    };

    section.title = function(val) {
        if (!arguments.length) return _title;
        _title = val;
        return section;
    };

    section.expandedByDefault = function(val) {
        if (!arguments.length) return _expandedByDefault;
        _expandedByDefault = val;
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
            .call(section.renderContent);
    };

    section.containerSelection = function() {
        return _containerSelection;
    };

    // may be called multiple times
    section.renderContent = function(containerSelection) {

        if (section.renderDisclosureContent) {
            if (!_disclosure) {
                _disclosure = uiDisclosure(context, id.replace(/-/g, '_'), _expandedByDefault)
                    .title(_title || '')
                    .content(section.renderDisclosureContent);
            }
            containerSelection
                .call(_disclosure);
        }
    };

    // override to enable disclosure
    section.renderDisclosureContent = undefined;

    section.rerenderContent = function() {
        _containerSelection
            .call(section.renderContent);
    };

    return section;
}
