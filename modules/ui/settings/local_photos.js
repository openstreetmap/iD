import { dispatch as d3_dispatch } from 'd3-dispatch';
import { isArray, isNumber } from 'lodash-es';

import { t } from '../../core/localizer';
import { uiConfirm } from '../confirm';
import { utilRebind } from '../../util';
import { uiTooltip } from '../tooltip';
import { svgIcon } from '../../svg';


export function uiSettingsLocalPhotos(context) {
    var dispatch = d3_dispatch('change');
    var photoLayer = context.layers().layer('local-photos');
    var modal;

    function render(selection) {

        modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-local-photos', true);

        modal.select('.modal-section.header')
            .append('h3')
            .call(t.append('local_photos.header'));

        modal.select('.modal-section.message-text')
            .append('div')
            .classed('local-photos', true);

        var instructionsSection = modal.select('.modal-section.message-text .local-photos')
            .append('div')
            .classed('instructions', true);

        instructionsSection
            .append('p')
            .classed('instructions-local-photos', true)
            .call(t.append('local_photos.file.instructions'));

        instructionsSection
            .append('input')
            .classed('field-file', true)
            .attr('type', 'file')
            .attr('multiple', 'multiple')
            .attr('accept', '.jpg,.jpeg,.png,image/png,image/jpeg')
            .style('visibility', 'hidden')
            .attr('id', 'local-photo-files')
            .on('change', function(d3_event) {
                var files = d3_event.target.files;
                if (files && files.length) {
                    photoList
                        .select('ul')
                        .append('li')
                        .classed('placeholder', true)
                        .append('div');
                    dispatch.call('change', this, files);
                }
                d3_event.target.value = null;
            });
        instructionsSection
            .append('label')
            .attr('for', 'local-photo-files')
            .classed('button', true)
            .call(t.append('local_photos.file.label'));

        const photoList = modal.select('.modal-section.message-text .local-photos')
            .append('div')
            .append('div')
            .classed('list-local-photos', true);

        photoList
            .append('ul');

        updatePhotoList(photoList.select('ul'));

        context.layers().on('change', () => updatePhotoList(photoList.select('ul')));
    }

    function updatePhotoList(container) {
        function locationUnavailable(d) {
            return !(isArray(d.loc) && isNumber(d.loc[0]) && isNumber(d.loc[1]));
        }

        container.selectAll('li.placeholder').remove();

        let selection = container.selectAll('li')
            .data(photoLayer.getPhotos() ?? [], d => d.id);
        selection.exit()
            .remove();

        const selectionEnter = selection.enter()
            .append('li');

        selectionEnter
            .append('span')
            .classed('filename', true);
        selectionEnter
            .append('button')
            .classed('form-field-button zoom-to-data', true)
            .attr('title', t('local_photos.zoom_single'))
            .call(svgIcon('#iD-icon-framed-dot'));
        selectionEnter
            .append('button')
            .classed('form-field-button no-geolocation', true)
            .call(svgIcon('#iD-icon-alert'))
            .call(uiTooltip()
                .title(() => t.append('local_photos.no_geolocation.tooltip'))
                .placement('left')
            );
        selectionEnter
            .append('button')
            .classed('form-field-button remove', true)
            .attr('title', t('icons.remove'))
            .call(svgIcon('#iD-operation-delete'));

        selection = selection.merge(selectionEnter);

        selection
            .classed('invalid', locationUnavailable);
        selection.select('span.filename')
            .text(d => d.name)
            .attr('title', d => d.name);
        selection.select('span.filename')
            .on('click', (d3_event, d) => {
                photoLayer.openPhoto(d3_event, d, false);
            });
        selection.select('button.zoom-to-data')
            .on('click', (d3_event, d) => {
                photoLayer.openPhoto(d3_event, d, true);
            });
        selection.select('button.remove')
            .on('click', (d3_event, d) => {
                photoLayer.removePhoto(d.id);
                updatePhotoList(container);
            });
    }

    return utilRebind(render, dispatch, 'on');
}
