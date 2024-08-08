import { select as d3_select } from 'd3-selection';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { utilRebind } from '../util';


const pannellumViewerCSS = 'pannellum/pannellum.css';
const pannellumViewerJS = 'pannellum/pannellum.js';
const dispatch = d3_dispatch('viewerChanged');

let _currScenes = [];
let _pannellumViewer;

export default {

  init: async function(context, selection) {

    selection
      .append('div')
      .attr('class', 'photo-frame pannellum-frame')
      .attr('id', 'ideditor-pannellum-viewer')
      .classed('hide', true)
      .on('keydown', function(e) { e.stopPropagation(); });

    if (!window.pannellum) {
      await this.loadPannellum(context);
    }

    const options = {
      'default': { firstScene: '' },
      scenes: {},
      minHfov: 20
    };

    _pannellumViewer = window.pannellum.viewer('ideditor-pannellum-viewer', options);

    _pannellumViewer
      .on('mousedown', () => {
        d3_select(window)
          .on('pointermove.pannellum mousemove.pannellum', () => {
            dispatch.call('viewerChanged');
          });
      })
      .on('mouseup', () => {
        d3_select(window)
          .on('pointermove.pannellum mousemove.pannellum', null);
      })
      .on('animatefinished', () => {
        dispatch.call('viewerChanged');
      });

    context.ui().photoviewer.on('resize.pannellum', () => {
        _pannellumViewer.resize();
    });

    this.event = utilRebind(this, dispatch, 'on');

    return this;
    },

  loadPannellum: function(context) {
    const head = d3_select('head');

    return Promise.all([
      new Promise((resolve, reject) => {
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
      new Promise((resolve, reject) => {
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
  },

  showPhotoFrame: function (context) {
    const isHidden = context.selectAll('.photo-frame.pannellum-frame.hide').size();

    if (isHidden) {
      context
        .selectAll('.photo-frame:not(.pannellum-frame)')
        .classed('hide', true);

      context
        .selectAll('.photo-frame.pannellum-frame')
        .classed('hide', false);
    }

    return this;
    },

  hidePhotoFrame: function (viewerContext) {
    viewerContext
      .select('photo-frame.pannellum-frame')
      .classed('hide', false);

    return this;
    },

  selectPhoto: function (data, keepOrientation) {
    const {key} = data;
    if ( !(key in _currScenes) ) {
      let newSceneOptions = {
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

    if (keepOrientation) {
      yaw = this.getYaw();
      pitch = _pannellumViewer.getPitch();
    }
    _pannellumViewer.loadScene(key, pitch, yaw);
    dispatch.call('viewerChanged');

    if (_currScenes.length > 3) {
      const old_key = _currScenes.shift();
      _pannellumViewer.removeScene(old_key);
    }

    _pannellumViewer.resize();

    return this;
  },

  getYaw: function() {
    return _pannellumViewer.getYaw();
  }

};
