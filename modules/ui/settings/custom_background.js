import { dispatch as d3_dispatch } from 'd3-dispatch';

import { t } from '../../util/locale';
import { uiConfirm } from '../confirm';
import { utilNoAuto, utilRebind } from '../../util';


export function uiSettingsCustomBackground(context) {
    var dispatch = d3_dispatch('change');


    function render(selection) {
        var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-custom-background', true);

        modal.select('.modal-section.header')
            .append('h3')
            .text(t('settings.custom_background.header'));


        var textSection = modal.select('.modal-section.message-text');

        textSection
            .append('pre')
            .attr('class', 'instructions')
            .text(t('settings.custom_background.instructions', { example: example }));

        textSection
            .append('textarea')
            .call(utilNoAuto);


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


        function clickCancel() {
            this.blur();
            modal.close();
        }


        function clickSave() {
            this.blur();
            modal.close();
            dispatch.call('change');
        }
    }

    return utilRebind(render, dispatch, 'on');
}
