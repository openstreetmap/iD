import { dispatch as d3_dispatch } from 'd3-dispatch';
import { marked } from 'marked';

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
            `\`${example}\`\n` +
            `#### ${t.html('settings.custom_background.instructions.multiple.multiple_label')}\n` +
            `* ${t.html('settings.custom_background.instructions.multiple.steps.step1')}\n` +
            `* ${t.html('settings.custom_background.instructions.multiple.steps.step2')}\n` +
            `* ${t.html('settings.custom_background.instructions.multiple.steps.step3')}\n` +
            `#### ${t.html('settings.custom_background.instructions.example')}\n` +
            `${t.html('settings.custom_background.instructions.multiple.steps.example_step1')}\n` +
            `${t.html('settings.custom_background.instructions.multiple.steps.example_step2')}\n` +
            `${t.html('settings.custom_background.instructions.multiple.steps.example_step3')}\n` +            
            `* ${t.html('settings.custom_background.instructions.multiple.steps.example_step4')}`;           

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
            prefs('background-custom-template', _origSettings.template);
            this.blur();
            modal.close();
        }

        //function to parse the text box and select the correct template
        function parseCustomTemplate() {
            var tempString = textSection.select('.field-template').property('value');
            var urls = tempString.split('\n'); // Split the input into an array of URLs
            var selectedUrl;
        
            for (let i = 0; i < urls.length; i++) {
                var currentUrl = urls[i].trim();

                // Skip if url starts with #
                if (currentUrl.startsWith('#')) {
                    continue;
                }        
                // If no URL is selected yet, or if the current URL has a higher priority (lower index), update the selected URL
                if (!selectedUrl || currentUrl.endsWith(selectedUrl.substring(selectedUrl.lastIndexOf('/') + 1))) {
                    selectedUrl = currentUrl;
                }
            }

            return selectedUrl;
        }
        

        // accept the current template
        function clickSave() {
            var originalTemplate = textSection.select('.field-template').property('value');            
            _currSettings.template = parseCustomTemplate();
            prefs('background-custom-template', originalTemplate);
            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }
    }

    return utilRebind(render, dispatch, 'on');
}
