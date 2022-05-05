import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPath, svgPointTransform } from './helpers';
import { services } from '../services';


export function svgVegbilder(projection, context, dispatch) {
  const throttledRedraw = _throttle(() => dispatch.call('change'), 1000);
  const minZoom = 14;
  const minMarkerZoom = 16;
  const minViewfieldZoom = 18;
  let layer = d3_select(null);
  let _viewerYaw = 0;
  let _selectedSequence = null;
  let _vegbilder;

  /**
   * init().
   */
  function init() {
    if (svgVegbilder.initialized) return;  // run once
    svgVegbilder.enabled = false;
    svgVegbilder.initialized = true;
  }

  /**
   * getService().
   */
  function getService() {
    if (services.vegbilder && !_vegbilder) {
      _vegbilder = services.vegbilder;
      _vegbilder.event
        .on('viewerChanged.svgVegbilder', viewerChanged)
        .on('loadedImages.svgVegbilder', throttledRedraw);
    } else if (!services.vegbilder && _vegbilder) {
      _vegbilder = null;
    }

    return _vegbilder;
  }

  /**
   * showLayer().
   */
  function showLayer() {
    let service = getService();
    if (!service) return;

    editOn();

    layer
      .style('opacity', 0)
      .transition()
      .duration(250)
      .style('opacity', 1)
      .on('end', () =>  dispatch.call('change'));
  }

  /**
   * hideLayer().
   */
  function hideLayer() {
    throttledRedraw.cancel();

    layer
      .transition()
      .duration(250)
      .style('opacity', 0)
      .on('end', editOff);
  }

  /**
   * editOn().
   */
  function editOn() {
    layer.style('display', 'block');
  }

  /**
   * editOff().
   */
  function editOff() {
    layer.selectAll('.viewfield-group').remove();
    layer.style('display', 'none');
  }

  /**
   * click() Handles 'bubble' point click event.
   */
  function click(d3_event, d) {
    const service = getService();
    if (!service) return;

    // try to preserve the viewer rotation when staying on the same sequence
    _selectedSequence = d.sequence_reference;

    service
      .ensureViewerLoaded(context)
      .then(() => {
        service
          .selectImage(context, d.key)
          .showViewer(context);
      });

    context.map().centerEase(d.loc);
  }

  /**
   * mouseover().
   */
  function mouseover(d3_event, d) {
    const service = getService();
    if (service) service.setStyles(context, d);
  }

  /**
   * mouseout().
   */
  function mouseout() {
    const service = getService();
    if (service) service.setStyles(context, null);
  }

  /**
   * transform().
   */
  function transform(d) {
    let t = svgPointTransform(projection)(d);
    const rot = d.ca + _viewerYaw;
    if (rot) {
      t += ' rotate(' + Math.floor(rot) + ',0,0)';
    }
    return t;
  }


  function viewerChanged() {
    const service = getService();
    if (!service) return;

    const viewer = service.viewer();
    if (!viewer) return;

    // update viewfield rotation
    _viewerYaw = viewer.getYaw();

    // avoid updating if the map is currently transformed
    // e.g. during drags or easing.
    if (context.map().isTransformed()) return;

    layer.selectAll('.viewfield-group.currentView')
      .attr('transform', transform);
  }

  function filterSequences(sequences) {

  }

  /**
   * update().
   */
  function update() {
    const viewer = context.container().select('.photoviewer');
    const selected = viewer.empty() ? undefined : viewer.datum();
    const z = ~~context.map().zoom();
    const showMarkers = (z >= minMarkerZoom);
    const showViewfields = (z >= minViewfieldZoom);
    const service = getService();

    let sequences = [];
    let images = [];

    sequences = (service ? service.sequences(projection) : []);
    images = (service && showMarkers ? service.images(projection) : []);

    let traces = layer.selectAll('.sequences').selectAll('.sequence')
      .data(sequences, d => d.properties.key);

    // exit
    traces.exit()
      .remove();

    // enter/update
    traces = traces.enter()
      .append('path')
      .attr('class', 'sequence')
      .merge(traces)
      .attr('d', svgPath(projection).geojson);


    const groups = layer.selectAll('.markers').selectAll('.viewfield-group')
      .data(images, (d) => d.key);

    // exit
    groups.exit()
      .remove();

    // enter
    const groupsEnter = groups.enter()
      .append('g')
      .attr('class', 'viewfield-group')
      .on('mouseenter', mouseover)
      .on('mouseleave', mouseout)
      .on('click', click);

    groupsEnter
      .append('g')
      .attr('class', 'viewfield-scale');

    // update
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
      .attr('dx', '0')
      .attr('dy', '0')
      .attr('r', '6');

    const viewfields = markers.selectAll('.viewfield')
      .data(showViewfields ? [0] : []);

    viewfields.exit()
      .remove();

    // viewfields may or may not be drawn...
    // but if they are, draw below the circles
    viewfields.enter()
      .insert('path', 'circle')
      .attr('class', 'viewfield')
      .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
      .attr('d', viewfieldPath);

    function viewfieldPath() {
      const d = this.parentNode.__data__;
      if (d.is_pano) {
        return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
      } else {
        return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
      }
    }
  }

  /**
   * drawImages()
   * drawImages is the method that is returned (and that runs) every time 'svgStreetside()' is called.
   * 'svgStreetside()' is called from index.js
   */
  function drawImages(selection) {
    const enabled = svgVegbilder.enabled;
    const service = getService();

    layer = selection.selectAll('.layer-vegbilder')
      .data(service ? [0] : []);

    layer.exit()
      .remove();

      const layerEnter = layer.enter()
      .append('g')
      .attr('class', 'layer-vegbilder')
      .style('display', enabled ? 'block' : 'none');

    layerEnter
      .append('g')
      .attr('class', 'sequences');

    layerEnter
      .append('g')
      .attr('class', 'markers');

    layer = layerEnter
      .merge(layer);

    if (enabled) {
      if (service && ~~context.map().zoom() >= minZoom) {
        editOn();
        update();
        service.loadImages(projection);
      } else {
        editOff();
      }
    }
  }


  /**
   * drawImages.enabled().
   */
  drawImages.enabled = function (_) {
    if (!arguments.length) return svgVegbilder.enabled;
    svgVegbilder.enabled = _;
    if (svgVegbilder.enabled) {
      showLayer();
      context.photos().on('change.vegbilder', update);
    } else {
      hideLayer();
      context.photos().on('change.vegbilder', null);
    }
    dispatch.call('change');
    return this;
  };

  /**
   * drawImages.supported().
   */
  drawImages.supported = function () {
    return !!getService();
  };

  init();

  return drawImages;
}
