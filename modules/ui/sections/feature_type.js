import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
    event as d3_event
} from 'd3-selection';

import { utilArrayIdentical } from '../../util/array';
import { t } from '../../util/locale';
import { tooltip } from '../../util/tooltip';
import { utilRebind } from '../../util';
import { uiPresetIcon } from '../preset_icon';
import { uiSection } from '../section';
import { uiTagReference } from '../tag_reference';


export function uiSectionFeatureType(context) {

    var dispatch = d3_dispatch('choose');

    var _entityIDs = [];
    var _presets = [];

    var _tagReference;

    var section = uiSection('feature-type', context)
        .title(t('inspector.feature_type'))
        .disclosureContent(renderDisclosureContent);

    function renderDisclosureContent(selection) {

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
            .call(tooltip()
                .title(t('inspector.back_tooltip'))
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
            .selectAll('.tag-reference-body-wrap')
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

        selection.selectAll('.preset-reset')
            .on('click', function() {
                 dispatch.call('choose', this, _presets);
            })
            .on('mousedown', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            })
            .on('mouseup', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            });

        var geometries = entityGeometries();
        selection.select('.preset-list-item button')
            .call(uiPresetIcon(context)
                .geometry(_presets.length === 1 ? (geometries.length === 1 && geometries[0]) : null)
                .preset(_presets.length === 1 ? _presets[0] : context.presets().item('point'))
            );

        // NOTE: split on en-dash, not a hypen (to avoid conflict with hyphenated names)
        var names = _presets.length === 1 ? _presets[0].name().split(' – ') : [t('inspector.multiple_types')];

        var label = selection.select('.label-inner');
        var nameparts = label.selectAll('.namepart')
            .data(names, function(d) { return d; });

        nameparts.exit()
            .remove();

        nameparts
            .enter()
            .append('div')
            .attr('class', 'namepart')
            .text(function(d) { return d; });
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

            var geometries = entityGeometries();
            if (_presets.length === 1 && geometries.length) {
                _tagReference = uiTagReference(_presets[0].reference(geometries[0]), context)
                    .showing(false);
            }
        }

        return section;
    };

    function entityGeometries() {

        var counts = {};

        for (var i in _entityIDs) {
            var geometry = context.geometry(_entityIDs[i]);
            if (!counts[geometry]) counts[geometry] = 0;
            counts[geometry] += 1;
        }

        return Object.keys(counts).sort(function(geom1, geom2) {
            return counts[geom2] - counts[geom1];
        });
    }

    return utilRebind(section, dispatch, 'on');
}
