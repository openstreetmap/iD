import { dispatch as d3_dispatch } from 'd3-dispatch';

import { t } from '../../util/locale';
import { uiConfirm } from '../confirm';
import { utilNoAuto, utilRebind } from '../../util';


export function uiSettingsCustomTasking(context) {
    var dispatch = d3_dispatch('change');

    // keep separate copies of original and current settings
    var _origSettings = {};
    var _currSettings = {};

    function render(selection) {

        var placeholder = 'https://{m}/project/{p}/task/{t}';
        var example = 'https://tasks.hotosm.org/api/v1/project/1/task/10?as_file=false';

        // var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-tasking', true);

        modal.select('.modal-section.header')
            .append('h3')
            .text(t('tasking.manager.managers.custom.settings.header'));


        var textSection = modal.select('.modal-section.message-text');

        textSection
            .append('pre')
            .attr('class', 'instructions-url')
            .text(t('tasking.manager.managers.custom.settings.instructions', { placeholder: placeholder, example: example }));

        textSection
            .append('textarea')
            .attr('class', 'field-url')
            .attr('placeholder', t('tasking.manager.managers.custom.settings.url.placeholder'))
            .call(utilNoAuto)
            .property('value', _currSettings.url);


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


        // restore the original url
        function clickCancel() {
            textSection.select('.field-url').property('value', _origSettings.url);
            // context.tasking().customSettings(_origSettings);

            this.blur();
            modal.close();
        }

        // accept the current url
        function clickSave() {
            _currSettings.url = textSection.select('.field-url').property('value').trim();
            _origSettings = _currSettings;

            this.blur();
            modal.close();

            dispatch.call('change', this, _currSettings);
        }
    }

    return utilRebind(render, dispatch, 'on');
}
