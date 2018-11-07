import _cloneDeep from 'lodash-es/cloneDeep';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import { t } from '../../util/locale';
import { uiConfirm } from '../confirm';
import { utilNoAuto, utilRebind } from '../../util';


export function uiSettingsCustomBackground(context) {
    var dispatch = d3_dispatch('change');

    function render(selection) {
        var _origSettings = {
            template: context.storage('background-custom-template')
        };
        var _currSettings = _cloneDeep(_origSettings);
        var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-background', true);

        modal.select('.modal-section.header')
            .append('h3')
            .text(t('settings.custom_background.header'));


        var textSection = modal.select('.modal-section.message-text');

        textSection
            .append('pre')
            .attr('class', 'instructions-template')
            .text(t('settings.custom_background.instructions', { example: example }));

        textSection
            .append('textarea')
            .attr('class', 'field-template')
            .attr('placeholder', t('settings.custom_background.template.placeholder'))
            .call(utilNoAuto)
            .property('value', _currSettings.template);


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


        // restore the original template
        function clickCancel() {
            textSection.select('.field-template').property('value', _origSettings.template);
            context.storage('background-custom-template', _origSettings.template);
            this.blur();
            modal.close();
        }

        // accept the current template
        function clickSave() {
            _currSettings.template = textSection.select('.field-template').property('value');
            context.storage('background-custom-template', _currSettings.template);
            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }
    }

    return utilRebind(render, dispatch, 'on');
}
