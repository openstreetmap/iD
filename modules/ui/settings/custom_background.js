import { dispatch as d3_dispatch } from 'd3-dispatch';
import { marked } from 'marked';

import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { uiConfirm } from '../confirm';
import { utilNoAuto, utilRebind } from '../../util';


export function uiSettingsCustomBackground() {
    var dispatch = d3_dispatch('change');

    function render(selection, customData) {
        var _currSettings = {
            template: customData ? customData.template : prefs('background-custom-template'),
            name: customData ? customData.name : '',
            id: customData ? customData.id : null
        };

        var example = 'https://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-background', true);

        modal.select('.modal-section.header')
            .append('h3')
            .call(t.append('settings.custom_background.header'));


        var textSection = modal.select('.modal-section.message-text');

        var instructions =
            `${t.html('settings.custom_background.instructions.info')}\n` +
            '\n' +
            `#### ${t.html('settings.custom_background.instructions.wms.tokens_label')}\n` +
            `* ${t.html('settings.custom_background.instructions.wms.tokens.proj')}\n` +
            `* ${t.html('settings.custom_background.instructions.wms.tokens.wkid')}\n` +
            `* ${t.html('settings.custom_background.instructions.wms.tokens.dimensions')}\n` +
            `* ${t.html('settings.custom_background.instructions.wms.tokens.bbox')}\n` +
            '\n' +
            `#### ${t.html('settings.custom_background.instructions.tms.tokens_label')}\n` +
            `* ${t.html('settings.custom_background.instructions.tms.tokens.xyz')}\n` +
            `* ${t.html('settings.custom_background.instructions.tms.tokens.flipped_y')}\n` +
            `* ${t.html('settings.custom_background.instructions.tms.tokens.switch')}\n` +
            `* ${t.html('settings.custom_background.instructions.tms.tokens.quadtile')}\n` +
            `* ${t.html('settings.custom_background.instructions.tms.tokens.scale_factor')}\n` +
            '\n' +
            `#### ${t.html('settings.custom_background.instructions.example')}\n` +
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
            .property('value', _currSettings.template)
            .on('input', function() {
                buttonSection.select('.ok-button').attr('disabled', isSaveDisabled);
            });

        textSection
            .append('input')
            .attr('class', 'field-name')
            .attr('type', 'text')
            .attr('placeholder', t('settings.custom_background.name.placeholder'))
            .call(utilNoAuto)
            .property('value', _currSettings.name || '');


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
            var value = textSection.select('.field-template').property('value');
            return (!value || value.trim() === '') ? 'disabled' : null;
        }


        // restore the original template
        function clickCancel() {
            this.blur();
            modal.close();
        }

        function clickSave() {
            _currSettings.template = textSection.select('.field-template').property('value');
            _currSettings.name = textSection.select('.field-name').property('value') || t('background.custom');
            if (!_currSettings.template || _currSettings.template.trim() === '') {
                return;
            }

            let customTemplates;
            try {
                customTemplates = JSON.parse(prefs('background-custom-templates') || '[]');
            } catch {
                customTemplates = [];
            }
            if (_currSettings.id) {
                customTemplates = customTemplates.map(function(entry) {
                    if (entry.id === _currSettings.id) {
                        return {
                            id: _currSettings.id,
                            name: _currSettings.name,
                            template: _currSettings.template
                        };
                    }
                    return entry;
                });
            } else {
                const maxId = customTemplates.reduce(function(max, e) {
                    if (!e.id || !e.id.startsWith('custom-')) return max;
                    const num = parseInt(e.id.replace('custom-', ''), 10);
                    return isNaN(num) ? max : Math.max(max, num);
                }, 0);
                const newId = 'custom-' + (maxId + 1);
                customTemplates.push({
                    id: newId,
                    name: _currSettings.name,
                    template: _currSettings.template
                });
            }
            prefs('background-custom-templates', JSON.stringify(customTemplates));
            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }
    }

    return utilRebind(render, dispatch, 'on');
}
