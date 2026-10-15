import {
    select as d3_select
} from 'd3-selection';

import { uiDisclosure } from './disclosure';
import { utilFunctor } from '../util';

export interface uiSection {
    id: string;
    classes: GetSetFunctor<this, string>;
    label: GetSetFunctor<this, string | d3.Selector>;
    expandedByDefault: GetSetFunctor<this, boolean>;
    shouldDisplay: GetSet<this, boolean | (() => boolean)>;
    content: GetSet<this, d3.Selector>;
    disclosureContent: GetSet<this, d3.SelectorExact<HTMLDivElement>>;
    disclosureExpanded: GetSet<this, boolean>;
    render(selection: d3.Selection<HTMLDivElement>): void;
    reRender(): void;
    selection(): d3.Selection<HTMLDivElement>;
    disclosure(): uiDisclosure;
}

// A unit of controls or info to be used in a layout, such as within a pane.
// Can be labeled and collapsible.
export function uiSection(id: string, context: iD.Context) {

    var _classes = utilFunctor('');
    var _shouldDisplay: () => boolean;
    var _content: d3.Selector;

    var _disclosure: uiDisclosure;
    var _label: () => string | d3.Selector;
    var _expandedByDefault = utilFunctor(true);
    var _disclosureContent: d3.SelectorExact<HTMLDivElement>;
    var _disclosureExpanded: boolean | undefined;

    var _containerSelection = d3_select<HTMLDivElement, 0>(null!);

    const section: uiSection = function() {};
    section.id = id;

    section.classes = function(val) {
        if (!arguments.length) return _classes;
        _classes = utilFunctor(val);
        return section;
    } as uiSection['classes'];

    section.label = function(val) {
        if (!arguments.length) return _label;
        _label = utilFunctor<string | d3.Selector, []>(val);
        return section;
    } as uiSection['label'];

    section.expandedByDefault = function(val) {
        if (!arguments.length) return _expandedByDefault;
        _expandedByDefault = utilFunctor(val);
        return section;
    } as uiSection['expandedByDefault'];

    section.shouldDisplay = function(val) {
        if (!arguments.length) return _shouldDisplay;
        _shouldDisplay = utilFunctor(val);
        return section;
    } as uiSection['shouldDisplay'];

    section.content = function(val) {
        if (!arguments.length) return _content;
        _content = val;
        return section;
    } as uiSection['content'];

    section.disclosureContent = function(val) {
        if (!arguments.length) return _disclosureContent;
        _disclosureContent = val;
        return section;
    } as uiSection['disclosureContent'];

    section.disclosureExpanded = function(val) {
        if (!arguments.length) return _disclosureExpanded;
        _disclosureExpanded = val;
        return section;
    } as uiSection['disclosureExpanded'];

    // may be called multiple times
    section.render = function(selection) {

        _containerSelection = selection
            .selectAll<HTMLDivElement, 0>('.section-' + id)
            .data([0]);

        var sectionEnter = _containerSelection
            .enter()
            .append('div')
            .attr('class', 'section section-' + id + ' ' + (_classes && _classes() || ''));

        _containerSelection = sectionEnter
            .merge(_containerSelection);

        _containerSelection
            .call(renderContent);
    };

    section.reRender = function() {
        _containerSelection
            .call(renderContent);
    };

    section.selection = function() {
        return _containerSelection;
    };

    section.disclosure = function() {
        return _disclosure;
    };

    // may be called multiple times
    function renderContent(selection: d3.Selection<HTMLDivElement>) {
        if (_shouldDisplay) {
            var shouldDisplay = _shouldDisplay();
            selection.classed('hide', !shouldDisplay);
            if (!shouldDisplay) {
                selection.html('');
                return;
            }
        }

        if (_disclosureContent) {
            if (!_disclosure) {
                _disclosure = uiDisclosure(context, id.replace(/-/g, '_'), _expandedByDefault())
                    .label(_label || '')
                    /*.on('toggled', function(expanded) {
                        if (expanded) { selection.node().parentNode.scrollTop += 200; }
                    })*/
                    .content(_disclosureContent);
            }
            if (_disclosureExpanded !== undefined) {
                _disclosure.expanded(_disclosureExpanded);
                _disclosureExpanded = undefined;
            }
            selection
                .call(_disclosure);

            return;
        }

        if (_content) {
            selection
                .call(_content);
        }
    }

    return section;
}
