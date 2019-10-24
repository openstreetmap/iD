import _debounce from 'lodash-es/debounce';

import {
    event as d3_event,
    select as d3_select,
} from 'd3-selection';

import { t } from '../../util/locale';
import { svgIcon } from '../../svg/icon';
import { tooltip } from '../../util/tooltip';
import { uiTooltipHtml } from '../tooltipHtml';
import { uiPresetBrowser } from '../preset_browser';
import { modeAddArea, modeAddLine, modeAddPoint } from '../../modes';

export function uiToolAddFeature(context) {

    var tool = {
        id: 'add_feature',
        label: t('toolbar.add_feature'),
        itemClass: 'disclosing',
        iconName: 'iD-presets-grid',
        iconClass: 'icon-30'
    };

    var allowedGeometry = ['point', 'vertex', 'line', 'area'];
    var presetBrowser = uiPresetBrowser(context, allowedGeometry, browserDidSelectPreset, browserDidClose)
        .scrollContainer(d3_select('#bar'));

    var button = d3_select(null);

    var key = t('modes.add_feature.key');
    var keys = [key, '`', '²', '@']; // #5663, #6864 - common QWERTY, AZERTY

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
            .call(tooltip()
                .placement('bottom')
                .html(true)
                .title(function() {
                    return uiTooltipHtml(t('modes.add_feature.description'), key);
                })
                .scrollContainer(d3_select('#bar'))
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
            button.classed('active', true);

            presetBrowser.show();
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
