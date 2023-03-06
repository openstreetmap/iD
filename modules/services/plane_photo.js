import { dispatch as d3_dispatch } from 'd3-dispatch';
import { zoom as d3_zoom, zoomIdentity as d3_zoomIdentity } from 'd3-zoom';
import { utilSetTransform, utilRebind } from '../util';

const dispatch = d3_dispatch('viewerChanged');

let _photo;
let imgZoom;

export default {

  init: async function(context, selection) {
    this.event = utilRebind(this, dispatch, 'on');

    imgZoom = d3_zoom()
                .extent([[0, 0], [320, 240]])
                .translateExtent([[0, 0], [320, 240]])
                .scaleExtent([1, 15])
                .on('zoom', this.zoomPan);

    const wrapper = selection
      .append('div')
      .attr('class', 'photo-frame plane-frame')
      .classed('hide', true);

    _photo = wrapper
      .append('img')
      .attr('class', 'plane-photo');

    context.ui().photoviewer.on('resize.plane', () => {
      const {width: wrapperWidth} = wrapper.node().getBoundingClientRect();
      const {width, height} = _photo.node().getBoundingClientRect();
      const widthOverflow = width - wrapperWidth;
      imgZoom = d3_zoom()
        .extent([[widthOverflow / 2, 0], [wrapperWidth + widthOverflow / 2, height]])
        .translateExtent([[0, 0], [width, height]])
        .scaleExtent([1, 15])
        .on('zoom', this.zoomPan);
      wrapper.call(imgZoom);
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

  selectPhoto: function (data, keepOrientation) {
    _photo.attr('src', data.image_path);
    if (!keepOrientation) {
      _photo.call(imgZoom.transform, d3_zoomIdentity);
    }
    return this;
  },

  zoomPan: function (d3_event) {
    let t = d3_event.transform;
    _photo.call(utilSetTransform, t.x, t.y, t.k);
  },

  getYaw: function() {
    return 0;
  }

};
