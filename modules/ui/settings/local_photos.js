import { dispatch as d3_dispatch } from 'd3-dispatch';

import { t } from '../../core/localizer';
import { uiConfirm } from '../confirm';
import { utilRebind } from '../../util';


export function uiSettingsLocalPhotos(context) {
    var dispatch = d3_dispatch('change');

    function render(selection) {
        var dataLayer = context.layers().layer('local-photos');

        var _currSettings = {
            fileList: (dataLayer && dataLayer.fileList()) || null
        };

        // var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-data', true);

        modal.select('.modal-section.header')
            .append('h3')
            .call(t.append('local_photos.header'));


        var textSection = modal.select('.modal-section.message-text');

        textSection
            .append('pre')
            .attr('class', 'instructions-local-photos')
            .call(t.append('local_photos.file.instructions'));

        textSection
            .append('input')
            .attr('class', 'field-file')
            .attr('type', 'file')
            .attr('multiple', 'multiple')
            // .attr('accept', '.gpx,.kml,.geojson,.json,application/gpx+xml,application/vnd.google-earth.kml+xml,application/geo+json,application/json')
            .property('files', _currSettings.fileList)
            .on('change', function(d3_event) {
                var files = d3_event.target.files;
                if (files && files.length) {
                    _currSettings.fileList = files;
                } else {
                    _currSettings.fileList = null;
                }
            });


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


        function clickCancel() {
            this.blur();
            modal.close();
        }

        function clickSave() {
            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }
    }

    return utilRebind(render, dispatch, 'on');
}
