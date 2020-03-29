import _debounce from 'lodash-es/debounce';

import {
    event as d3_event,
    select as d3_select,
} from 'd3-selection';

import { t } from '../../util/locale';
import { svgIcon } from '../../svg/icon';
import { uiTooltip } from '../tooltip';
import { uiPresetBrowser } from '../preset_browser';
import { modeAddArea, modeAddLine, modeAddPoint } from '../../modes';

export function uiToolAddFeature(context) {

    var tool = {
        id: 'add_feature',
        label: t('toolbar.add_feature'),
        itemClass: 'disclosing',
        iconName: 'iD-features-grid',
        iconClass: 'icon-30'
    };

    var presetBrowser = uiPresetBrowser(context)
        .allowedGeometry(['point', 'vertex', 'line', 'area'])
        .on('choose.addFeature', browserDidSelectPreset)
        .on('hide.addFeature', browserDidClose)
        .scrollContainer(context.container().select('.top-toolbar'));

    var button = d3_select(null);

    var key = t('modes.add_feature.key');

    // We really want the key to the left of the number row to trigger the preset
    // browser, but this varies across keyboard layouts. Since web apps can't detect
    // layouts, and since the locale and keyboard may not match even if this shortcut
    // is translated, we hardcode the keys for a number of common layouts if
    // collisions with other shortcuts are unlikely.
    // - #7258, #5663, #6864
    var keys = [
        key,
        '`', // US English (and more--all these locale names are just examples)
        '\'',// Brazilian
        '„', // Georgian
        '²', // French
        '@', // Dutch
        '|', // Norwegian
        '\\',// Italian
        '§', // Swedish
        '#', // Finnish
        'º', // Spanish
        '^', // German
        '½', // Danish
        '÷', // Farsi
        'ˇ', // Estonian
        'ذ', // Arabic
        '¸', // Croatian
        '˛', // Polish
        'ё', // Belarusian
        'ä', // Uighur Latin
        'ә', // Bashkir
        'ċ', // Maltese
        'ч', // Bulgarian Phonetic
        'ञ'  // Nepali
    ];

    tool.render = function(selection) {

        var buttonEnter = selection
            .selectAll('.bar-button')
            .data([0])
            .enter()
            .append('button')
            .attr('class', 'bar-button')
            .attr('tabindex', -1)
            .on('mousedown', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            })
            .on('mouseup', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            })
            .on('click', function() {
                if (button.classed('disabled')) return;

                if (!presetBrowser.isShown()) {
                    button.classed('active', true);
                    presetBrowser.show();
                } else {
                    presetBrowser.hide();
                }
            })
            .call(uiTooltip()
                .placement('bottom')
                .title(t('modes.add_feature.description'))
                .keys([key])
                .scrollContainer(context.container().select('.top-toolbar'))
            )
            .call(svgIcon('#' + tool.iconName, tool.iconClass));

        buttonEnter
            .append('span')
            .call(svgIcon('#iD-icon-down', 'disclosure-icon'));

        button = selection.select('.bar-button');

        selection.call(presetBrowser);

        updateEnabledState();
    };

    tool.allowed = function() {
        var addableCount = context.presets().getAddable().length;
        return addableCount === 0 || addableCount > 10;
    };

    tool.install = function() {

        context.keybinding().on(keys, function() {
            if (button.classed('disabled')) return;

            button.classed('active', true);

            presetBrowser
                .openKey(d3_event.key)
                .show();
            d3_event.preventDefault();
            d3_event.stopPropagation();
        });

        var debouncedUpdate = _debounce(updateEnabledState, 500, { leading: true, trailing: true });

        context.map()
            .on('move.add-feature-tool', debouncedUpdate)
            .on('drawn.add-feature-tool', debouncedUpdate);
    };

    tool.uninstall = function() {
        presetBrowser.hide();

        context.keybinding().off(keys);

        context.features()
            .on('change.add-feature-tool', null);

        context.map()
            .on('move.add-feature-tool', null)
            .on('drawn.add-feature-tool', null);
    };

    function browserDidSelectPreset(preset, geometry) {

        var markerClass = 'add-preset add-' + geometry +
            ' add-preset-' + preset.name().replace(/\s+/g, '_') + '-' + geometry;

        var modeInfo = {
            button: markerClass,
            preset: preset,
            geometry: geometry,
            title: preset.name().split(' – ')[0]
        };

        var mode;
        switch (geometry) {
            case 'point':
            case 'vertex':
                mode = modeAddPoint(context, modeInfo);
                break;
            case 'line':
                mode = modeAddLine(context, modeInfo);
                break;
            case 'area':
                mode = modeAddArea(context, modeInfo);
                break;
            default:
                return;
        }

        context.presets().setMostRecent(preset);

        context.enter(mode);
    }

    function browserDidClose() {
        button.classed('active', false);
    }

    function updateEnabledState() {
        var isEnabled = context.editable();
        button.classed('disabled', !isEnabled);
        if (!isEnabled) {
            presetBrowser.hide();
        }
    }

    return tool;
}
