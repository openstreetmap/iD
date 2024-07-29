import { dispatch as d3_dispatch } from 'd3-dispatch';
import { zoom as d3_zoom, zoomIdentity as d3_zoomIdentity } from 'd3-zoom';
import { utilSetTransform, utilRebind } from '../util';

const dispatch = d3_dispatch('viewerChanged');

let _photo;
let _wrapper;
let imgZoom;
let _widthOverflow;

function zoomPan (d3_event) {
  let t = d3_event.transform;
  _photo.call(utilSetTransform, t.x, t.y, t.k);
}

function zoomBeahvior () {
  const {width: wrapperWidth, height: wrapperHeight} = _wrapper.node().getBoundingClientRect();
  const {naturalHeight, naturalWidth} = _photo.node();
  const intrinsicRatio = naturalWidth / naturalHeight;
  _widthOverflow = wrapperHeight * intrinsicRatio - wrapperWidth;
  return d3_zoom()
        .extent([[0, 0], [wrapperWidth, wrapperHeight]])
        .translateExtent([[0, 0], [wrapperWidth + _widthOverflow, wrapperHeight]])
        .scaleExtent([1, 15])
        .on('zoom', zoomPan);
}

function loadImage (selection, path) {
  return new Promise((resolve) => {
    selection.attr('src', path);
    selection.on('load', () => {
      resolve(selection);
    });
  });
}


export default {

  init: async function(context, selection) {
    this.event = utilRebind(this, dispatch, 'on');

    _wrapper = selection
      .append('div')
      .attr('class', 'photo-frame plane-frame')
      .classed('hide', true);

    _photo = _wrapper
      .append('img')
      .attr('class', 'plane-photo');

    context.ui().photoviewer.on('resize.plane', () => {
      imgZoom = zoomBeahvior();
      _wrapper.call(imgZoom);
    });

    await Promise.resolve();

    return this;
  },

  showPhotoFrame: function (context) {
    const isHidden = context.selectAll('.photo-frame.plane-frame.hide').size();

    if (isHidden) {
      context
        .selectAll('.photo-frame:not(.plane-frame)')
        .classed('hide', true);

      context
        .selectAll('.photo-frame.plane-frame')
        .classed('hide', false);
    }

    return this;
  },


  hidePhotoFrame: function (context) {
    context
      .select('photo-frame.plane-frame')
      .classed('hide', false);

    return this;
  },

  selectPhoto: function (data) {
    dispatch.call('viewerChanged');

    loadImage(_photo, '');
    loadImage(_photo, data.image_path)
      .then(() => {
        imgZoom = zoomBeahvior();
        _wrapper.call(imgZoom);
        _wrapper.call(imgZoom.transform, d3_zoomIdentity.translate(-_widthOverflow / 2, 0));
      });
    return this;
  },

  getYaw: function() {
    return 0;
  }

};
