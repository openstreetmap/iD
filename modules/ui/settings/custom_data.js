import _cloneDeep from 'lodash-es/cloneDeep';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event } from 'd3-selection';

import { t } from '../../util/locale';
import { uiConfirm } from '../confirm';
import { utilNoAuto, utilRebind } from '../../util';


export function uiSettingsCustomData(context) {
    var dispatch = d3_dispatch('change');

    function render(selection) {
        var dataLayer = context.layers().layer('data');
        var _origSettings = {
            fileList: (dataLayer && dataLayer.fileList()) || null,
            template: context.storage('settings-custom-data-template')
        };
        var _currSettings = _cloneDeep(_origSettings);

        // var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-data', true);

        modal.select('.modal-section.header')
            .append('h3')
            .text(t('settings.custom_data.header'));


        var textSection = modal.select('.modal-section.message-text');

        textSection
            .append('pre')
            .attr('class', 'instructions-file')
            .text(t('settings.custom_data.file.instructions'));

        textSection
            .append('input')
            .attr('class', 'field-file')
            .attr('type', 'file')
            .property('files', _currSettings.fileList)  // works for all except IE11
            .on('change', function() {
                var files = d3_event.target.files;
                if (files && files.length) {
                    _currSettings.template = '';
                    textSection.select('.field-template').property('value', '');
                    _currSettings.fileList = files;
                } else {
                    _currSettings.fileList = null;
                }
            });

        textSection
            .append('h4')
            .text(t('settings.custom_data.or'));

        textSection
            .append('pre')
            .attr('class', 'instructions-template')
            .text(t('settings.custom_data.template.instructions'));

        textSection
            .append('textarea')
            .attr('class', 'field-template')
            .attr('placeholder', t('settings.custom_data.template.placeholder'))
            .call(utilNoAuto)
            .property('value', _currSettings.template);


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


        // restore the original template
        function clickCancel() {
            textSection.select('.field-template').property('value', _origSettings.template);
            context.storage('settings-custom-data-template', _origSettings.template);
            this.blur();
            modal.close();
        }

        // accept the current template
        function clickSave() {
            _currSettings.template = textSection.select('.field-template').property('value').trim();

            // one or the other but not both
            if (_currSettings.template) { _currSettings.fileList = null; }
            if (_currSettings.fileList) { _currSettings.template = ''; }

            context.storage('settings-custom-data-template', _currSettings.template);
            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }
    }

    return utilRebind(render, dispatch, 'on');
}
