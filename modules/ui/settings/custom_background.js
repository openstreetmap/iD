import { dispatch as d3_dispatch } from 'd3-dispatch';
import { xml as d3_xml } from 'd3-fetch';

import { t } from '../../util/locale';
import { uiConfirm } from '../confirm';
import { utilNoAuto, utilRebind } from '../../util';

function wmsTemplateFromCapabilities(capabilitiesURL, capabilities) {
    var formats = [];
    capabilities.querySelectorAll('Format').forEach(function (format) {
        formats.push(format.textContent);
    });
    var preferredFormats = [
        'image/jpeg',
        'image/png',
        'image/svg',
        'image/gif',
        'image/bmp',
        'image/tiff'
    ];
    var formatIndex = preferredFormats.findIndex(function (preferredFormat) {
        return formats.indexOf(preferredFormat) !== -1;
    });
    var format = preferredFormats[formatIndex === -1 ? formatIndex : 0];

    var layer = capabilities.querySelector('Layer > Name').textContent;

    capabilitiesURL.search = '';
    capabilitiesURL.searchParams.set('FORMAT', format);
    capabilitiesURL.searchParams.set('VERSION', '1.1.1');
    capabilitiesURL.searchParams.set('SERVICE', 'WMS');
    capabilitiesURL.searchParams.set('REQUEST', 'GetMap');
    capabilitiesURL.searchParams.set('LAYERS', layer);
    capabilitiesURL.searchParams.set('SRS', 'EPSG:3857');
    return capabilitiesURL.toString() + '&WIDTH={width}&HEIGHT={height}&BBOX={bbox}';
}

export function uiSettingsCustomBackground(context) {
    var dispatch = d3_dispatch('change');

    function render(selection) {
        // keep separate copies of original and current settings
        var _origSettings = {
            template: context.storage('background-custom-template')
        };
        var _currSettings = {
            template: context.storage('background-custom-template')
        };

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


        textSection
            .insert('button', '.ok-button')
            .attr('class', 'button secondary-action')
            .text(t('settings.custom_background.generate_from_wms'))
            .on('click', clickWMS);


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


        function clickWMS() {
            var capabilitiesURLString = prompt(t('settings.custom_background.wms.instructions'));
            try {
                var capabilitiesURL = new URL(capabilitiesURLString);
                d3_xml(capabilitiesURLString)
                    .then(function (capabilities) {
                        var wmsTemplate = wmsTemplateFromCapabilities(capabilitiesURL, capabilities);
                        textSection.select('.field-template').property('value', wmsTemplate);
                    }).catch(function (err) {
                        alert(err);
                    });
            } catch (err) {
                alert(err);
            }
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
