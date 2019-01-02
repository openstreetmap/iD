import { tooltip } from '../../util/tooltip';
import _cloneDeep from 'lodash-es/cloneDeep';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
  select as d3_select
} from 'd3-selection';

import { t } from '../../util/locale';
import { uiConfirm } from '../confirm';
import { utilRebind } from '../../util';
import { uiTooltipHtml } from '../tooltipHtml';


export function uiSettingsOsmData(context) {
    var dispatch = d3_dispatch('change');

    // var layers = context.layers(); // TODO: enable autohidden text
    var features = context.features().keys();
    var _featureList = d3_select(null);

    var _origSettings = context.features();
    var _currSettings = _cloneDeep(_origSettings);
    _currSettings._toggled = [];


    function showsFeature(d) {
        return context.features().enabled(d);
    }


    function autoHiddenFeature(d) {
        return context.features().autoHidden(d);
    }


    function clickFeature(d) {
        _currSettings._toggled.push(d);
    }

    // function showsLayer(which) {
    //     var layer = layers.layer(which);
    //     if (layer) {
    //         return layer.enabled();
    //     }
    //     return false;
    // }

    function render(selection) {

        // var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-data', true);

        modal.select('.modal-section.header')
            .append('h3')
            .text(t('settings.osm_data.header'));


        var textSection = modal.select('.modal-section.message-text');

        textSection
            .append('pre')
            .attr('class', 'osm_data-summary')
            .text(t('settings.osm_data.summary'));

        textSection
          .append('div')
          .attr('class', 'osm-filters-container');




        var filtersContainer = textSection.selectAll('.osm-filters-container');

        filtersContainer
            .append('h3')
            .text(t('settings.osm_data.filters.title'));

        filtersContainer
            .append('h4')
            .text(t('settings.osm_data.filters.features.title'))
            .call(renderFeatureList);

        textSection
            .merge(filtersContainer);


        // insert a cancel button
        var buttonSection = modal.select('.modal-section.buttons');

        buttonSection
            .insert('button', '.ok-button')
            .attr('class', 'button cancel-button secondary-action')
            .text(t('confirm.cancel'));


        buttonSection.select('.cancel-button')
            .on('click.cancel', clickCancel);

        buttonSection.select('.ok-button')
            .attr('disabled', isSaveDisabled)
            .on('click.save', clickSave);


        function isSaveDisabled() {
            return null;
        }


        // cancel settings changes
        function clickCancel() {
            this.blur();
            modal.close();
        }

        // accept settings changes
        function clickSave() {
            _currSettings._toggled.map(function(d) {
                context.features().toggle(d);
            });
            _currSettings._toggled = [];

            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }


        function renderFeatureList(selection) {
            var container = selection.selectAll('.layer-feature-list')
            .data([0]);

            _featureList = container.enter()
                .append('ul')
                .attr('class', 'layer-list layer-feature-list')
                .merge(container);

            _featureList
                .call(drawListItems, features, 'checkbox', 'feature', clickFeature, showsFeature);

        }
    }

    function drawListItems(selection, data, type, name, change, active) {
        var items = selection.selectAll('li')
            .data(data);

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', 'layer')
            .call(tooltip()
                .html(true)
                .title(function(d) {
                    var tip = t(name + '.' + d + '.tooltip'),
                        key = (d === 'wireframe' ? t('area_fill.wireframe.key') : null);

                    if (name === 'feature' && autoHiddenFeature(d)) {
                        // var msg = showsLayer('osm') ? t('map_data.autohidden') : t('map_data.osmhidden');
                        // tip += '<div>' + msg + '</div>';
                    }
                    return uiTooltipHtml(tip, key);
                })
                .placement('top')
            );

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);

        label
            .append('span')
            .text(function(d) { return t(name + '.' + d + '.description'); });

        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active)
            .property('indeterminate', function(d) {
                return (name === 'feature' && autoHiddenFeature(d));
            });
    }

    return utilRebind(render, dispatch, 'on');
}