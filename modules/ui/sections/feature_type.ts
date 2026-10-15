import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { presetManager, type presetPreset } from '../../presets';
import { utilArrayIdentical } from '../../util/array';
import { t, type LocalizedTextRenderer } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { utilRebind } from '../../util';
import { uiPresetIcon } from '../preset_icon';
import { uiSection } from '../section';
import { uiTagReference } from '../tag_reference';
import type { coreContext } from '../../core';
import type { EntityId } from '../../osm';
import type { Geometry } from '@openstreetmap/id-tagging-schema';


export function uiSectionFeatureType(context: coreContext) {

    var dispatch = d3_dispatch('choose');

    var _entityIDs: EntityId[] = [];
    var _presets: presetPreset[] = [];

    var _tagReference: any;

    var section = uiSection('feature-type', context)
        .label(() => t.append('inspector.feature_type'))
        .disclosureContent(renderDisclosureContent);

    function renderDisclosureContent(selection: d3.Selection<HTMLDivElement>) {

        selection.classed('preset-list-item', true);
        selection.classed('mixed-types', _presets.length > 1);

        var presetButtonWrap = selection
            .selectAll('.preset-list-button-wrap')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'preset-list-button-wrap');

        var presetButton = presetButtonWrap
            .append('button')
            .attr('class', 'preset-list-button preset-reset')
            .call(uiTooltip<HTMLButtonElement>()
                .title(() => t.append('inspector.back_tooltip'))
                .placement('bottom')
            );

        presetButton.append('div')
            .attr('class', 'preset-icon-container');

        presetButton
            .append('div')
            .attr('class', 'label')
            .append('div')
            .attr('class', 'label-inner');

        presetButtonWrap.append('div')
            .attr('class', 'accessory-buttons');

        var tagReferenceBodyWrap = selection
            .selectAll<HTMLDivElement, 0>('.tag-reference-body-wrap')
            .data([0]);

        tagReferenceBodyWrap = tagReferenceBodyWrap
            .enter()
            .append('div')
            .attr('class', 'tag-reference-body-wrap')
            .merge(tagReferenceBodyWrap);

        // update header
        if (_tagReference) {
            selection.selectAll('.preset-list-button-wrap .accessory-buttons')
                .style('display', _presets.length === 1 ? null : 'none')
                .call(_tagReference.button);

            tagReferenceBodyWrap
                .style('display', _presets.length === 1 ? null : 'none')
                .call(_tagReference.body);
        }

        selection.selectAll<HTMLElement, unknown>('.preset-reset')
            .on('click', function() {
                 dispatch.call('choose', this, _presets);
            })
            .on('pointerdown pointerup mousedown mouseup', function(d3_event) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            });

        var geometries = entityGeometries();
        selection.select<HTMLButtonElement>('.preset-list-item button')
            .call(uiPresetIcon()
                .geometry(_presets.length === 1 ? (geometries.length === 1 && geometries[0]) : undefined)
                .preset(_presets.length === 1 ? _presets[0] : presetManager.item('point')!)
            );

        var names = _presets.length === 1 ? [
            _presets[0].nameLabel(),
            _presets[0].subtitleLabel()
        ].filter(Boolean) : [ t.append('inspector.multiple_types') ];

        var label = selection.select('.label-inner');
        var nameparts = label.selectAll<HTMLElement, LocalizedTextRenderer>('.namepart')
            .data(names, d => d.stringId);

        nameparts.exit()
            .remove();

        nameparts
            .enter()
            .append('div')
            .attr('class', 'namepart')
            .text('')
            .each(function(d) { d(d3_select(this)); });
    }

    section.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        return section;
    };

    section.presets = function(val) {
        if (!arguments.length) return _presets;

        // don't reload the same preset
        if (!utilArrayIdentical(val, _presets)) {
            _presets = val;

            if (_presets.length === 1) {
                _tagReference = uiTagReference(_presets[0].reference())
                    .showing(false);
            }
        }

        return section;
    };

    function entityGeometries() {

        var counts = {} as Record<Geometry, number>;

        for (var i in _entityIDs) {
            const geometry = context.graph().geometry(_entityIDs[i]);
            if (!counts[geometry]) counts[geometry] = 0;
            counts[geometry] += 1;
        }

        return Object.keys(counts).sort(function(geom1, geom2) {
            return counts[geom2] - counts[geom1];
        });
    }

    return utilRebind(section, dispatch, 'on');
}
