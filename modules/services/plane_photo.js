import { dispatch as d3_dispatch } from 'd3-dispatch';
import { zoom as d3_zoom, zoomIdentity as d3_zoomIdentity } from 'd3-zoom';
import { utilSetTransform, utilRebind } from '../util';

const dispatch = d3_dispatch('viewerChanged');

let _photo;
let _imageWrapper;
let _planeWrapper;
let _imgZoom = d3_zoom()
  .extent([[0, 0], [320, 240]])
  .translateExtent([[0, 0], [320, 240]])
  .scaleExtent([1, 15]);

function zoomPan (d3_event) {
  let t = d3_event.transform;
  _imageWrapper.call(utilSetTransform, t.x, t.y, t.k);
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

    _planeWrapper = selection;
    _planeWrapper.call(_imgZoom.on('zoom', zoomPan));

    _imageWrapper = _planeWrapper
      .append('div')
      .attr('class', 'photo-frame plane-frame')
      .classed('hide', true);

    _photo = _imageWrapper
      .append('img')
      .attr('class', 'plane-photo');

      context.ui().photoviewer.on('resize.plane', function(dimensions) {
        _imgZoom
            .extent([[0, 0], dimensions])
            .translateExtent([[0, 0], dimensions]);
      });

    await Promise.resolve();

    return this;
  },

  /**
   * Shows the photo frame if hidden
   * @param {*} context the HTML wrap of the frame
   */
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

  /**
   * Hides the photo frame if shown
   * @param {*} context the HTML wrap of the frame
   */
  hidePhotoFrame: function (context) {
    context
      .select('photo-frame.plane-frame')
      .classed('hide', false);

    return this;
  },

  /**
   * Renders an image inside the frame
   * @param {*} data the image data, it should contain an image_path attribute, a link to the actual image.
   */
  selectPhoto: function (data) {
    dispatch.call('viewerChanged');

    loadImage(_photo, '');
    loadImage(_photo, data.image_path)
      .then(() => {
        _planeWrapper.call(_imgZoom.transform, d3_zoomIdentity);
      });
    return this;
  },

  getYaw: function() {
    return 0;
  }

};
