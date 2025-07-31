import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { presetManager } from '../../presets';
import { utilArrayIdentical } from '../../util/array';
import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { utilRebind } from '../../util';
import { uiPresetIcon } from '../preset_icon';
import { uiSection } from '../section';
import { uiTagReference } from '../tag_reference';
import { svgIcon } from '../../svg';
import { uiModal } from '../modal';
import { uiShortcutEditor } from '../shortcut_editor';

export function uiSectionFeatureType(context) {

    var dispatch = d3_dispatch('choose');

    var _entityIDs = [];
    var _presets = [];

    var _tagReference;

    var section = uiSection('feature-type', context)
        .label(() => t.append('inspector.feature_type'))
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
            .call(uiTooltip()
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
            .selectAll('.tag-reference-body-wrap')
            .data([0]);

        tagReferenceBodyWrap = tagReferenceBodyWrap
            .enter()
            .append('div')
            .attr('class', 'tag-reference-body-wrap')
            .merge(tagReferenceBodyWrap);

        // update header
        var accessoryButtons = selection.selectAll('.preset-list-button-wrap .accessory-buttons')
            .style('display', _presets.length === 1 ? null : 'none');

        // Add shortcut editor button (only for single preset)
        if (_presets.length === 1) {
            var shortcutButton = accessoryButtons.selectAll('.shortcut-edit-button')
                .data([0]);

            var shortcutButtonEnter = shortcutButton.enter()
                .append('button')
                .attr('class', 'shortcut-edit-button')
                .attr('title', t('preset_shortcut.edit_tooltip'))
                .call(svgIcon('#iD-icon-out-link'));

            shortcutButton = shortcutButtonEnter.merge(shortcutButton);

            shortcutButton.on('click', function(d3_event) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                // Show the shortcut editor modal
                showShortcutModal(_presets[0], context);
            });
        } else {
            // Remove shortcut button if multiple presets
            accessoryButtons.selectAll('.shortcut-edit-button').remove();
        }

        if (_tagReference) {
            accessoryButtons.call(_tagReference.button);

            tagReferenceBodyWrap
                .style('display', _presets.length === 1 ? null : 'none')
                .call(_tagReference.body);
        }



        selection.selectAll('.preset-reset')
            .on('click', function() {
                 dispatch.call('choose', this, _presets);
            })
            .on('pointerdown pointerup mousedown mouseup', function(d3_event) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            });

        var geometries = entityGeometries();
        selection.select('.preset-list-item button')
            .call(uiPresetIcon()
                .geometry(_presets.length === 1 ? (geometries.length === 1 && geometries[0]) : null)
                .preset(_presets.length === 1 ? _presets[0] : presetManager.item('point'))
            );

        var names = _presets.length === 1 ? [
            _presets[0].nameLabel(),
            _presets[0].subtitleLabel()
        ].filter(Boolean) : [ t.append('inspector.multiple_types') ];

        var label = selection.select('.label-inner');
        var nameparts = label.selectAll('.namepart')
            .data(names, d => d.stringId);

        nameparts.exit()
            .remove();

        nameparts
            .enter()
            .append('div')
            .attr('class', 'namepart')
            .text('')
            .each(function(d) { d(d3_select(this)); });

        // Shortcut editor is now triggered by the button in the header
        // Remove any existing shortcut editors
        selection.selectAll('.shortcut-editor').remove();
    }


    function showShortcutModal(preset, context) {
        const modalSelection = uiModal(context.container());

        const modal = modalSelection.select('.content');

        // Header section with title
        const headerSection = modal
            .append('div')
            .attr('class', 'modal-section');

        headerSection
            .append('h3')
            .text(t('preset_shortcut.modal_title'));

        // Content section with preset info and form
        const contentSection = modal
            .append('div')
            .attr('class', 'modal-section');

        // Show preset name and icon
        const presetRow = contentSection
            .append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('margin-bottom', '15px');

        presetRow
            .append('div')
            .style('margin-right', '10px')
            .call(uiPresetIcon()
                .geometry(preset.geometry[0])
                .preset(preset)
            );

        presetRow
            .append('div')
            .style('font-weight', 'bold')
            .call(function(selection) {
                const presetName = preset.nameLabel();
                presetName(selection);
            });

        // Use the reusable shortcut editor component
        contentSection.call(uiShortcutEditor(context)
            .preset(preset)
            .onSave(function() {
                modalSelection.close();
            })
            .onCancel(function() {
                modalSelection.close();
            })
            .onRemove(function() {
                modalSelection.close();
            })
        );


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
                _tagReference = uiTagReference(_presets[0].reference(), context)
                    .showing(false);
            }
        }

        return section;
    };

    function entityGeometries() {

        var counts = {};

        for (var i in _entityIDs) {
            var geometry = context.graph().geometry(_entityIDs[i]);
            if (!counts[geometry]) counts[geometry] = 0;
            counts[geometry] += 1;
        }

        return Object.keys(counts).sort(function(geom1, geom2) {
            return counts[geom2] - counts[geom1];
        });
    }

    return utilRebind(section, dispatch, 'on');
}
