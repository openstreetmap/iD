import { dispatch as d3_dispatch } from 'd3-dispatch';
import { marked } from 'marked';

import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { uiConfirm } from '../confirm';
import { utilNoAuto, utilRebind } from '../../util';


export function uiCustomFeatures() {
    var dispatch = d3_dispatch('change');

    function render(selection) {
        // keep separate copies of original and current settings
        var _origSettings = {
            template: prefs('map-features-custom')
        };
        var _currSettings = {
            template: prefs('map-features-custom')
        };

        var modal = uiConfirm(selection).okButton();

        modal
            .classed('custom_features-modal settings-custom_features', true);

        modal.select('.modal-section.header')
            .append('h3')
            .call(t.append('settings.custom_features.header'));


        var textSection = modal.select('.modal-section.message-text');

        var instructions =
            `${t.html('settings.custom_features.instructions.info')}\n` +
            '<code>building=yes</code>.\n' +
            '\n' +
            `${t.html('settings.custom_features.instructions.additional_info')}`;

        textSection
            .append('div')
            .attr('class', 'instructions-template')
            .html(marked(instructions));

        textSection
            .append('input')
            .attr('type', 'text')
            .attr('class', 'field-template')
            .attr('placeholder', t('settings.custom_features.template.placeholder'))
            .call(utilNoAuto)
            .property('value', _currSettings.template);

        // insert a cancel button
        var buttonSection = modal.select('.modal-section.buttons');

        buttonSection
            .insert('button', '.ok-button')
            .attr('class', 'button cancel-button secondary-action')
            .call(t.append('confirm.cancel'));


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
            prefs('map-features-custom', _origSettings.template);
            this.blur();
            modal.close();
        }

        // accept the current template
        function clickSave() {
            _currSettings.template = textSection.select('.field-template').property('value');
            prefs('map-features-custom', _currSettings.template);
            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }
    }

    return utilRebind(render, dispatch, 'on');
}
