import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
    event as d3_event
} from 'd3-selection';

import { actionChangePreset } from '../../actions/change_preset';
import { presetManager } from '../../presets';
import { utilArrayIdentical } from '../../util/array';
import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { utilRebind } from '../../util';
import { uiPresetBrowser } from '../preset_browser';
import { uiPresetIcon } from '../preset_icon';
import { uiSection } from '../section';
import { uiTagReference } from '../tag_reference';


export function uiSectionFeatureType(context) {

    var dispatch = d3_dispatch('choose');

    var _entityIDs = [];
    var _presets = [];
    var _newFeature = false;

    var _tagReference;

    var section = uiSection('feature-type', context)
        .title(t('inspector.feature_type'))
        .disclosureContent(renderDisclosureContent);

    var _presetBrowser = uiPresetBrowser(context)
        .displayStyle('flush')
        .on('choose.sectionFeatureType', function(preset) {
            _presetBrowser.hide();

            dispatch.call('choose', this, [preset]);

            if (!context.inIntro()) {
                presetManager.setMostRecent(preset);
            }
            context.perform(
                function(graph) {
                    for (var i in _entityIDs) {
                        var entityID = _entityIDs[i];
                        var oldPreset = presetManager.match(graph.entity(entityID), graph);
                        graph = actionChangePreset(entityID, oldPreset, preset)(graph);
                    }
                    return graph;
                },
                t('operations.change_tags.annotation')
            );

            context.validator().validate();  // rerun validation
        });

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
            .call(uiTooltip()
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
            .on('mousedown', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            })
            .on('mouseup', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            })
            .on('click', function() {
                if (!_presetBrowser.isShown()) {
                    _presetBrowser.show();
                } else {
                    _presetBrowser.hide();
                }
            })
            .call(_presetBrowser);

        var geometries = entityGeometries();
        selection.select('.preset-list-item button')
            .call(uiPresetIcon()
                .geometry(_presets.length === 1 ? (geometries.length === 1 && geometries[0]) : null)
                .preset(_presets.length === 1 ? _presets[0] : presetManager.item('point'))
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


        if (shouldOpenPresetBrowserByDefault()) {
            _presetBrowser.show();
        }
    }

    section.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        return section;
    };

    section.presets = function(val) {
        if (!arguments.length) return _presets;

        // don't reload the same preset
        if (!val || !_presets || !utilArrayIdentical(val, _presets)) {
            _presets = val;

            var geometries = entityGeometries();
            if (_presets.length === 1 && geometries.length) {
                _tagReference = uiTagReference(_presets[0].reference(geometries[0]), context)
                    .showing(false);
            }
            _presetBrowser
                .allowedGeometry(geometries);
        }

        return section;
    };

    section.newFeature = function(val) {
        if (!arguments.length) return _newFeature;
        _newFeature = val;
        return section;
    };

    function entityGeometries() {

        var counts = {};

        for (var i in _entityIDs) {
            var entity = context.graph().entity(_entityIDs[i]);
            var geometry = entity.geometry(context.graph());
            // Treat entities on addr:interpolation lines as points, not vertices (#3241)
            if (geometry === 'vertex' && entity.isOnAddressLine(context.graph())) {
                geometry = 'point';
            }
            if (!counts[geometry]) counts[geometry] = 0;
            counts[geometry] += 1;
        }

        return Object.keys(counts).sort(function(geom1, geom2) {
            return counts[geom2] - counts[geom1];
        });
    }

    function shouldOpenPresetBrowserByDefault() {

        // don't open if a non-geometry preset is specified (including addresses)
        if (_presets && _presets.filter(function(preset) {
            return !preset.isFallback();
        }).length) return false;

        var entities = _entityIDs.map(function(entityID) {
            return context.hasEntity(entityID);
        }).filter(Boolean);

        // ignore if entities aren't valid
        if (!entities.length) return false;

        // don't open if there are already non-geometry tags
        if (entities.some(function(entity) {
            return entity.hasNonGeometryTags();
        })) return false;

        // open if feature is new and untagged
        if (_newFeature) return true;

        return false;

        /*
        // don't open for non-vertices for any other reason
        if (entities.some(function(entity) {
            return entity.geometry(context.graph()) !== 'vertex';
        })) return false;

        // don't open if there are vertex issues, we need to show the issues list
        if (context.validator().getSharedEntityIssues(_entityIDs, { includeDisabledRules: true }).length) return false;

        // don't open for junction vertices, we need to show the turn retriction editor
        if (entities.length === 1 && entities[0].isHighwayIntersection(context.graph())) return false;

        // open for uninteresting vertices
        return true;
        */
    }

    return utilRebind(section, dispatch, 'on');
}
