import { dispatch as d3_dispatch } from 'd3-dispatch';
import marked from 'marked';

import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { uiConfirm } from '../confirm';
import { utilNoAuto, utilRebind } from '../../util';


export function uiSettingsCustomBackground() {
    var dispatch = d3_dispatch('change');

    function render(selection) {
        // keep separate copies of original and current settings
        var _origSettings = {
            template: prefs('background-custom-template')
        };
        var _currSettings = {
            template: prefs('background-custom-template')
        };

        var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-background', true);

        modal.select('.modal-section.header')
            .append('h3')
            .text(t('settings.custom_background.header'));


        var textSection = modal.select('.modal-section.message-text');

        var instructions =
            `${t('settings.custom_background.instructions.info')}\n` +
            '\n' +
            `#### ${t('settings.custom_background.instructions.wms.tokens_label')}\n` +
            `* ${t('settings.custom_background.instructions.wms.tokens.proj')}\n` +
            `* ${t('settings.custom_background.instructions.wms.tokens.wkid')}\n` +
            `* ${t('settings.custom_background.instructions.wms.tokens.dimensions')}\n` +
            `* ${t('settings.custom_background.instructions.wms.tokens.bbox')}\n` +
            '\n' +
            `#### ${t('settings.custom_background.instructions.tms.tokens_label')}\n` +
            `* ${t('settings.custom_background.instructions.tms.tokens.xyz')}\n` +
            `* ${t('settings.custom_background.instructions.tms.tokens.flipped_y')}\n` +
            `* ${t('settings.custom_background.instructions.tms.tokens.switch')}\n` +
            `* ${t('settings.custom_background.instructions.tms.tokens.quadtile')}\n` +
            `* ${t('settings.custom_background.instructions.tms.tokens.scale_factor')}\n` +
            '\n' +
            `#### ${t('settings.custom_background.instructions.example')}\n` +
            `\`${example}\``;

        textSection
            .append('div')
            .attr('class', 'instructions-template')
            .html(marked(instructions));

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
            prefs('background-custom-template', _origSettings.template);
            this.blur();
            modal.close();
        }

        // accept the current template
        function clickSave() {
            _currSettings.template = textSection.select('.field-template').property('value');
            prefs('background-custom-template', _currSettings.template);
            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }
    }

    return utilRebind(render, dispatch, 'on');
}
