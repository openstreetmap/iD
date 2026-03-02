import { dispatch as d3_dispatch } from 'd3-dispatch';

import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { uiConfirm } from '../confirm';
import { utilNoAuto, utilRebind } from '../../util';


export function uiSettingsCustomData(context) {
    var dispatch = d3_dispatch('change');

    function render(selection) {
        var dataLayer = context.layers().layer('data');

        // keep separate copies of original and current settings
        var _origSettings = {
            fileList: (dataLayer && dataLayer.fileList()) || null,
            url: prefs('settings-custom-data-url')
        };
        var _currSettings = {
            fileList: (dataLayer && dataLayer.fileList()) || null,
            // url: prefs('settings-custom-data-url')
        };

        // var example = 'https://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-data', true);

        modal.select('.modal-section.header')
            .append('h3')
            .call(t.append('settings.custom_data.header'));


        var textSection = modal.select('.modal-section.message-text');

        textSection
            .append('pre')
            .attr('class', 'instructions-file')
            .call(t.append('settings.custom_data.file.instructions'));

        textSection
            .append('input')
            .attr('class', 'field-file')
            .attr('type', 'file')
            .attr('accept', '.gpx,.kml,.geojson,.json,application/gpx+xml,application/vnd.google-earth.kml+xml,application/geo+json,application/json')
            .property('files', _currSettings.fileList)
            .on('change', function(d3_event) {
                var files = d3_event.target.files;
                if (files && files.length) {
                    _currSettings.url = '';
                    textSection.select('.field-url').property('value', '');
                    _currSettings.fileList = files;
                } else {
                    _currSettings.fileList = null;
                }
            });

        textSection
            .append('h4')
            .call(t.append('settings.custom_data.or'));

        textSection
            .append('pre')
            .attr('class', 'instructions-url')
            .call(t.append('settings.custom_data.url.instructions'));

        textSection
            .append('textarea')
            .attr('class', 'field-url')
            .attr('placeholder', t('settings.custom_data.url.placeholder'))
            .call(utilNoAuto)
            .property('value', _currSettings.url);


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


        // restore the original url
        function clickCancel() {
            textSection.select('.field-url').property('value', _origSettings.url);
            prefs('settings-custom-data-url', _origSettings.url);
            this.blur();
            modal.close();
        }

        // accept the current url
        function clickSave() {
            _currSettings.url = textSection.select('.field-url').property('value').trim();

            // one or the other but not both
            if (_currSettings.url) { _currSettings.fileList = null; }
            if (_currSettings.fileList) { _currSettings.url = ''; }

            prefs('settings-custom-data-url', _currSettings.url);
            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }
    }

    return utilRebind(render, dispatch, 'on');
}
