import { select as d3_select } from 'd3-selection';
import { zoom as d3_zoom, zoomTransform as d3_zoomTransform } from 'd3-zoom';

import { photoZoom } from '../../../modules/services/photo_zoom';
import { pannellumPhotoFrame } from '../../../modules/services/pannellum_photo';
import { planePhotoFrame } from '../../../modules/services/plane_photo';


describe('photoZoom', function() {
    let controls, target, zoom;

    beforeEach(function() {
        const container = d3_select('body')
            .append('div')
            .attr('class', 'photo-zoom-test');

        controls = container.append('div');
        target = container.append('div');
        zoom = d3_zoom()
            .extent([[0, 0], [100, 100]])
            .scaleExtent([1, 4]);

        target.call(zoom);
        controls.call(photoZoom(zoom, target));
    });

    afterEach(function() {
        d3_select('.photo-zoom-test')
            .remove();
    });

    it('renders accessible zoom buttons', function() {
        const zoomIn = controls.select('button.photo-zoom-in');
        const zoomOut = controls.select('button.photo-zoom-out');

        expect(zoomIn.text()).toEqual('+');
        expect(zoomIn.attr('aria-label')).toEqual('Zoom In');
        expect(zoomOut.text()).toEqual('−');
        expect(zoomOut.attr('aria-label')).toEqual('Zoom Out');
    });

    it('zooms the target and disables buttons at the scale extent', function() {
        const zoomIn = controls.select('button.photo-zoom-in');
        const zoomOut = controls.select('button.photo-zoom-out');

        expect(zoomOut.property('disabled')).toBeTruthy();

        zoomIn.dispatch('click');
        expect(d3_zoomTransform(target.node()).k).toEqual(2);
        expect(zoomOut.property('disabled')).toBeFalsy();

        zoomIn.dispatch('click');
        expect(d3_zoomTransform(target.node()).k).toEqual(4);
        expect(zoomIn.property('disabled')).toBeTruthy();

        zoomOut.dispatch('click');
        expect(d3_zoomTransform(target.node()).k).toEqual(2);
        expect(zoomIn.property('disabled')).toBeFalsy();
    });

    it('adds controls to plane photo frames and shows them with the frame', async function() {
        const frameContainer = d3_select('.photo-zoom-test')
            .append('div');
        frameContainer
            .append('div')
            .attr('class', 'photo-controls-wrap')
            .append('div')
            .attr('class', 'photo-controls');

        const photoviewer = {
            on: () => photoviewer,
            viewerSize: () => [100, 100]
        };
        const context = {
            ui: () => ({ photoviewer })
        };
        const frame = await planePhotoFrame(context, frameContainer);
        const photo = frameContainer.select('img.plane-photo');

        Object.defineProperties(photo.node(), {
            naturalWidth: { value: 200 },
            naturalHeight: { value: 100 }
        });
        frame.selectPhoto({ image_path: 'photo.jpg' });
        photo.dispatch('load');
        await Promise.resolve();

        const buttons = frameContainer.selectAll('button.photo-zoom');
        expect(buttons.size()).toEqual(2);
        expect(buttons.classed('hide')).toBeTruthy();

        frame.showPhotoFrame(frameContainer);
        expect(buttons.classed('hide')).toBeFalsy();
    });

    it('hides plane zoom controls when a panorama frame is shown', async function() {
        const originalPannellum = window.pannellum;
        const viewer = {
            on: () => viewer,
            resize: () => {}
        };
        Reflect.set(window, 'pannellum', {
            viewer: () => viewer
        });

        try {
            const frameContainer = d3_select('.photo-zoom-test')
                .append('div');
            const button = frameContainer
                .append('button')
                .attr('class', 'photo-zoom');
            const photoviewer = {
                on: () => photoviewer
            };
            const context = {
                ui: () => ({ photoviewer })
            };
            const frame = await pannellumPhotoFrame(context, frameContainer);

            frame.showPhotoFrame(frameContainer);
            expect(button.classed('hide')).toBeTruthy();
        } finally {
            if (originalPannellum) {
                Reflect.set(window, 'pannellum', originalPannellum);
            } else {
                Reflect.deleteProperty(window, 'pannellum');
            }
        }
    });
});
