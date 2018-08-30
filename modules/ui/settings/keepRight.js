import _cloneDeep from 'lodash-es/cloneDeep';

import {
    select as d3_select
} from 'd3-selection';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { errorTypes } from '../../util/keepRight';
import { utilDrawListItems } from '../../util/draw_list_items';

import { t } from '../../util/locale';
import { uiConfirm } from '../confirm';
import { utilRebind } from '../../util';


export function uiSettingsKeepRight(context, update) {
    var dispatch = d3_dispatch('change');
    var errors = Object.keys(errorTypes.errors); // TODO: add warnings

    function clickError(d) {
        context.errors().toggle(d);
        update();
    }

    function showsError(d) {
        return context.errors().enabled(d);
    }

    function render(selection) {
        var keepRightLayer = context.layers().layer('keepRight');
        var _origSettings = {
            activeSubLayerList: (keepRightLayer && keepRightLayer.activeSubLayerList()) || null,
            url: context.storage('settings-custom-data-url') // TODO: TAH - remove
        };
        var _currSettings = _cloneDeep(_origSettings);

        // var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-keepRight', true);

        modal.select('.modal-section.header')
            .append('h3')
            .text(t('settings.keepRight.header'));


        var textSection = modal.select('.modal-section.message-text');

        textSection
            .append('pre')
            .attr('class', 'instructions-keepRight')
            .text(t('settings.keepRight.instructions'));

        textSection
            .append('div')
            .attr('class', 'keepRight-errors')
            .append('ul')
            .attr('class', 'layer-list layer-keepRight')
            .call(utilDrawListItems, context, errors, 'checkbox', 'QA.keepRight.errorTypes.errors', clickError, showsError);


        // textSection
        //     .append('input')
        //     .attr('class', 'field-file')
        //     .attr('type', 'file')
        //     .property('files', _currSettings.activeSubLayerList)  // works for all except IE11
        //     .on('change', function() {
        //         var files = d3_event.target.files;
        //         if (files && files.length) {
        //             _currSettings.url = '';
        //             textSection.select('.field-url').property('value', '');
        //             _currSettings.activeSubLayerList = files;
        //         } else {
        //             _currSettings.activeSubLayerList = null;
        //         }
        //     });

        // textSection
        //     .append('h4')
        //     .text(t('settings.custom_data.or'));

        // textSection
        //     .append('pre')
        //     .attr('class', 'instructions-url')
        //     .text(t('settings.custom_data.url.instructions'));

        // textSection
        //     .append('textarea')
        //     .attr('class', 'field-url')
        //     .attr('placeholder', t('settings.custom_data.url.placeholder'))
        //     .call(utilNoAuto)
        //     .property('value', _currSettings.url);


        // insert a cancel button, and adjust the button widths
        var buttonSection = modal.select('.modal-section.buttons');

        buttonSection
            .insert('button', '.ok-button')
            .attr('class', 'button col3 cancel-button secondary-action')
            .text(t('confirm.cancel'));


        buttonSection.select('.cancel-button')
            .on('click.cancel', clickCancel);

        buttonSection.select('.ok-button')
            .classed('col3', true)
            .classed('col4', false)
            .attr('disabled', isSaveDisabled)
            .on('click.save', clickSave);


        function isSaveDisabled() {
            return null;
        }


        // restore the original url
        function clickCancel() {
            textSection.select('.field-url').property('value', _origSettings.url);
            context.storage('settings-custom-data-url', _origSettings.url);
            this.blur();
            modal.close();
        }

        // accept the current url
        function clickSave() {
            _currSettings.url = textSection.select('.field-url').property('value').trim();

            // one or the other but not both
            if (_currSettings.url) { _currSettings.activeSubLayerList = null; }
            if (_currSettings.activeSubLayerList) { _currSettings.url = ''; }

            context.storage('settings-custom-data-url', _currSettings.url);
            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }
    }

    return utilRebind(render, dispatch, 'on');
}









// function showsQA(d) {

//         var QAKeys = [d];
//         var QALayers = layers.all().filter(function(obj) { return QAKeys.indexOf(obj.id) !== -1; });
//         var data = QALayers.filter(function(obj) { return obj.layer.supported(); });

//         function layerSupported(d) {
//             return d.layer && d.layer.supported();
//         }
//         function layerEnabled(d) {
//             return layerSupported(d) && d.layer.enabled();
//         }

//         return layerEnabled(data[0]);

//     }

    // function clickError(d) {

    // }


    // function showsError(d) {

    // }



// _QAList
//     .call(utilDrawListItems, QAs, 'checkbox', 'QA', function(d) { toggleLayer(d); }, showsQA, editCustom);

// _KeepRightList
//     .call(utilDrawListItems, errors, 'checkbox', 'QA.keepRight.errorTypes.errors', clickError, showsError);
// d3_select('.disclosure-wrap-QA')
//     .call(drawQAButtons);