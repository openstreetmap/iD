import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './helpers';
import { services } from '../services';


export function svgKyFromAbove(projection, context, dispatch) {
  const throttledRedraw = _throttle(() => dispatch.call('change'), 1000);
  const minZoom = 14;
  const minMarkerZoom = 16;
  const minViewfieldZoom = 18;
  let layer = d3_select(null);
  let _kyfromabove;

  function init() {
    if (svgKyFromAbove.initialized) return;
    svgKyFromAbove.enabled = false;
    svgKyFromAbove.initialized = true;
  }

  function getService() {
    if (services.kyfromabove && !_kyfromabove) {
      _kyfromabove = services.kyfromabove;
      _kyfromabove.event
        .on('loadedImages.svgKyFromAbove', throttledRedraw);
    } else if (!services.kyfromabove && _kyfromabove) {
      _kyfromabove = null;
    }
    return _kyfromabove;
  }

  function showLayer() {
    const service = getService();
    if (!service) return;
    editOn();
    layer
      .style('opacity', 0)
      .transition()
      .duration(250)
      .style('opacity', 1)
      .on('end', () => dispatch.call('change'));
  }

  function hideLayer() {
    throttledRedraw.cancel();
    layer
      .transition()
      .duration(250)
      .style('opacity', 0)
      .on('end', editOff);
  }

  function editOn() {
    layer.style('display', 'block');
  }

  function editOff() {
    layer.selectAll('.viewfield-group').remove();
    layer.style('display', 'none');
  }

  function click(d3_event, d) {
    const service = getService();
    if (!service) return;

    if (service.ensureViewerLoaded) {
        service.ensureViewerLoaded(context)
          .then(() => {
            service.selectImage(context, d.key).showViewer(context);
          });
    } else {
        // Fallback or debug
    }

    context.map().centerEase(d.loc);
  }

  function mouseover(d3_event, d) {
    const service = getService();
    if (service && service.setStyles) service.setStyles(context, d);
  }

  function mouseout() {
    const service = getService();
    if (service && service.setStyles) service.setStyles(context, null);
  }

  function transform(d) {
    let t = svgPointTransform(projection)(d);
    if (d.ca) {
      t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
    }
    return t;
  }

  function update() {
    const viewer = context.container().select('.photoviewer');
    const selected = viewer.empty() ? undefined : viewer.datum();
    const z = ~~context.map().zoom();
    const showMarkers = (z >= minMarkerZoom);
    const showViewfields = (z >= minViewfieldZoom);
    const service = getService();
    let images = [];

    if (service) {
      service.loadImages(projection);
      images = showMarkers ? service.images(projection) : [];
    }

    const groups = layer.selectAll('.markers').selectAll('.viewfield-group')
      .data(images, (d) => d.key);

    groups.exit().remove();

    const groupsEnter = groups.enter()
      .append('g')
      .attr('class', 'viewfield-group')
      .on('mouseenter', mouseover)
      .on('mouseleave', mouseout)
      .on('click', click);

    groupsEnter
      .append('g')
      .attr('class', 'viewfield-scale');

    const markers = groups
      .merge(groupsEnter)
      .sort((a, b) => {
        return (a === selected) ? 1
          : (b === selected) ? -1
            : b.loc[1] - a.loc[1];
      })
      .attr('transform', transform)
      .select('.viewfield-scale');

    markers.selectAll('circle')
      .data([0])
      .enter()
      .append('circle')
      .attr('r', '6');

    const viewfields = markers.selectAll('.viewfield')
      .data(showViewfields ? [0] : []);

    viewfields.exit().remove();

    viewfields.enter()
      .insert('path', 'circle')
      .attr('class', 'viewfield')
      .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
      .attr('d', 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z');
  }

  function drawImages(selection) {
    const enabled = svgKyFromAbove.enabled;
    const service = getService();

    layer = selection.selectAll('.layer-kyfromabove')
      .data(service ? [0] : []);

    layer.exit().remove();

    const layerEnter = layer.enter()
      .append('g')
      .attr('class', 'layer-kyfromabove')
      .style('display', enabled ? 'block' : 'none');

    layerEnter
      .append('g')
      .attr('class', 'markers');

    layer = layerEnter.merge(layer);

    if (enabled) {
      if (service && ~~context.map().zoom() >= minZoom) {
        editOn();
        update();
      } else {
        editOff();
      }
    }
  }

  drawImages.enabled = function (_) {
    if (!arguments.length) return svgKyFromAbove.enabled;
    svgKyFromAbove.enabled = _;
    if (svgKyFromAbove.enabled) {
      showLayer();
    } else {
      hideLayer();
    }
    dispatch.call('change');
    return this;
  };

  drawImages.supported = function () {
    return !!getService();
  };

  drawImages.rendered = function(zoom) {
    return zoom >= minZoom;
  };

  init();

  return drawImages;
}
