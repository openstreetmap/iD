import { select as d3_select } from 'd3-selection';
import { dispatch as d3_dispatch, type Dispatch } from 'd3-dispatch';
import { utilRebind } from '../util';
import type { coreContext } from '../core';


const pannellumViewerCSS = 'pannellum/pannellum.css';
const pannellumViewerJS = 'pannellum/pannellum.js';

export interface PhotoFramePhoto {
    image_path: string;
    preview_path?: Pannellum.ConfigOptions['preview'];
    ca?: Pannellum.ConfigOptions['northOffset'];
}

export interface PhotoFrame {
    event: Pick<Dispatch<object, { viewerChanged: [] }>, 'on'>;

    loadPannellum?(context: coreContext): Promise<[void, void]>;
    showPhotoFrame(selection: d3.Selection): PhotoFrame;
    hidePhotoFrame(selection: d3.Selection): PhotoFrame;
    selectPhoto(photo: PhotoFramePhoto, keepOrientation?: boolean): PhotoFrame;
    getYaw: Pannellum.Viewer['getYaw'];
    getPitch?: Pannellum.Viewer['getPitch'];
    getHfov?: Pannellum.Viewer['getHfov'];
}

export async function pannellumPhotoFrame(context: coreContext, selection: d3.Selection<HTMLDivElement>) {
    const dispatch = d3_dispatch('viewerChanged');

    const module: PhotoFrame = function() {};
    module.event = utilRebind(module, dispatch, 'on');
    module.loadPannellum = function(context) {
        const head = d3_select('head');

        return Promise.all([
            new Promise<void>((resolve, reject) => {
                // load pannellum viewer css
                head
                    .selectAll('#ideditor-pannellum-viewercss')
                    .data([0])
                    .enter()
                    .append('link')
                    .attr('id', 'ideditor-pannellum-viewercss')
                    .attr('rel', 'stylesheet')
                    .attr('crossorigin', 'anonymous')
                    .attr('href', context.asset(pannellumViewerCSS))
                    .on('load.pannellum', resolve)
                    .on('error.pannellum', reject);
            }),
            new Promise<void>((resolve, reject) => {
                // load pannellum viewer js
                head
                    .selectAll('#ideditor-pannellum-viewerjs')
                    .data([0])
                    .enter()
                    .append('script')
                    .attr('id', 'ideditor-pannellum-viewerjs')
                    .attr('crossorigin', 'anonymous')
                    .attr('src', context.asset(pannellumViewerJS))
                    .on('load.pannellum', resolve)
                    .on('error.pannellum', reject);
            })
        ]);
    };

    let _currScenes: string[] = [];
    let _pannellumViewer;
    let _activeSceneKey: string;

    selection
        .append('div')
        .attr('class', 'photo-frame pannellum-frame')
        .attr('id', 'ideditor-pannellum-viewer')
        .classed('hide', true)
        .on('mousedown', function(e) { e.stopPropagation(); });

    if (!window.pannellum) {
        await module.loadPannellum(context);
    }

    const options = {
        'default': { firstScene: '' },
        scenes: {},
        minHfov: 20,
        disableKeyboardCtrl: true,
        sceneFadeDuration: 0
    };

    _pannellumViewer = window.pannellum.viewer('ideditor-pannellum-viewer', options);

    _pannellumViewer
        .on('mousedown', () => d3_select(window)
            .on('pointermove.pannellum mousemove.pannellum', () => dispatch.call('viewerChanged')))
        .on('mouseup', () => d3_select(window)
            .on('pointermove.pannellum mousemove.pannellum', null))
        .on('animatefinished', () => dispatch.call('viewerChanged'));

    context.ui().photoviewer.on('resize.pannellum', () => {
        _pannellumViewer.resize();
    });

    /**
     * Shows the photo frame if hidden
     */
    module.showPhotoFrame = function(context) {
        const isHidden = context.selectAll('.photo-frame.pannellum-frame.hide').size();

        if (isHidden) {
            context
                .selectAll('.photo-frame:not(.pannellum-frame)')
                .classed('hide', true);

            context
                .selectAll('.photo-frame.pannellum-frame')
                .classed('hide', false);
        }

        return module;
    };

    /**
     * Hides the photo frame if shown
     */
    module.hidePhotoFrame = function(viewerContext) {
        viewerContext
            .select('photo-frame.pannellum-frame')
            .classed('hide', false);

        return module;
    };

    /**
     * Renders an image inside the frame
     * @param data the image data, it should contain an image_path attribute, a link to the actual image.
     * @param keepOrientation if true, HFOV, pitch and yaw will be kept between images
     */
    module.selectPhoto = function(data, keepOrientation) {
        const key = data.image_path;
        _activeSceneKey = key;
        if (!_currScenes.includes(key)) {
            let newSceneOptions: Pannellum.ConfigOptions = {
                showFullscreenCtrl: false,
                autoLoad: false,
                compass: false,
                yaw: 0,
                type: 'equirectangular',
                preview: data.preview_path,
                panorama: data.image_path,
                northOffset: data.ca
            };

            _currScenes.push(key);
            _pannellumViewer.addScene(key, newSceneOptions);
        }

        let yaw = 0;
        let pitch = 0;
        let hfov = 0;

        if (keepOrientation) {
            yaw = module.getYaw();
            pitch = module.getPitch!();
            hfov = module.getHfov!();
        }
        if (_pannellumViewer.isLoaded() !== false) {
            _pannellumViewer.loadScene(key, pitch, yaw, hfov);
            dispatch.call('viewerChanged');
        } else {
            // pannellum is currently loading another scene: wait for it to finish
            // loading the previous panorama first
            const retry = setInterval(() => {
                if (_pannellumViewer.isLoaded() === false) {
                    // still not done: wait a bit longer
                    return;
                }
                if (_activeSceneKey === key) {
                    // only load scene if no other photo has been selected in the meantime
                    _pannellumViewer.loadScene(key, pitch, yaw, hfov);
                    dispatch.call('viewerChanged');
                }
                clearInterval(retry);
            }, 100);
        }

        if (_currScenes.length > 3) {
            const old_key = _currScenes.shift()!;
            _pannellumViewer.removeScene(old_key);
        }

        _pannellumViewer.resize();

        return module;
    };

    module.getYaw = function() {
        return _pannellumViewer.getYaw();
    };

    module.getPitch = function() {
        return _pannellumViewer.getPitch();
    };

    module.getHfov = function() {
        return _pannellumViewer.getHfov();
    };

    return module;
};
