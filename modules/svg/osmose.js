import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';

import { modeBrowse } from '../modes/browse';
import { svgPointTransform } from './helpers';
import { services } from '../services';

let _layerEnabled = false;
let _qaService;

export function svgOsmose(projection, context, dispatch) {
  const throttledRedraw = _throttle(() => dispatch.call('change'), 1000);
  const minZoom = 12;

  let touchLayer = d3_select(null);
  let drawLayer = d3_select(null);
  let layerVisible = false;

  function markerPath(selection, klass) {
    selection
      .attr('class', klass)
      .attr('transform', 'translate(-10, -28)')
      .attr('points', '16,3 4,3 1,6 1,17 4,20 7,20 10,27 13,20 16,20 19,17.033 19,6');
  }

  // Loosely-coupled osmose service for fetching issues
  function getService() {
    if (services.osmose && !_qaService) {
      _qaService = services.osmose;
      _qaService.on('loaded', throttledRedraw);
    } else if (!services.osmose && _qaService) {
      _qaService = null;
    }

    return _qaService;
  }

  // Show the markers
  function editOn() {
    if (!layerVisible) {
      layerVisible = true;
      drawLayer
        .style('display', 'block');
    }
  }

  // Immediately remove the markers and their touch targets
  function editOff() {
    if (layerVisible) {
      layerVisible = false;
      drawLayer
        .style('display', 'none');
      drawLayer.selectAll('.qaItem.osmose')
        .remove();
      touchLayer.selectAll('.qaItem.osmose')
        .remove();
    }
  }

  // Enable the layer.  This shows the markers and transitions them to visible.
  function layerOn() {
    editOn();

    drawLayer
      .style('opacity', 0)
      .transition()
      .duration(250)
      .style('opacity', 1)
      .on('end interrupt', () => dispatch.call('change'));
  }

  // Disable the layer.  This transitions the layer invisible and then hides the markers.
  function layerOff() {
    throttledRedraw.cancel();
    drawLayer.interrupt();
    touchLayer.selectAll('.qaItem.osmose')
      .remove();

    drawLayer
      .transition()
      .duration(250)
      .style('opacity', 0)
      .on('end interrupt', () => {
        editOff();
        dispatch.call('change');
      });
  }

  // Update the issue markers
  function updateMarkers() {
    if (!layerVisible || !_layerEnabled) return;

    const service = getService();
    const selectedID = context.selectedErrorID();
    const data = (service ? service.getItems(projection) : []);
    const getTransform = svgPointTransform(projection);

    // Draw markers..
    const markers = drawLayer.selectAll('.qaItem.osmose')
      .data(data, d => d.id);

    // exit
    markers.exit()
      .remove();

    // enter
    const markersEnter = markers.enter()
      .append('g')
        .attr('class', d => `qaItem ${d.service} itemId-${d.id} itemType-${d.itemType}`);

    markersEnter
      .append('polygon')
        .call(markerPath, 'shadow');

    markersEnter
      .append('ellipse')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('rx', 4.5)
        .attr('ry', 2)
        .attr('class', 'stroke');

    markersEnter
      .append('polygon')
        .attr('fill', d => service.getColor(d.item))
        .call(markerPath, 'qaItem-fill');

    markersEnter
      .append('use')
        .attr('class', 'icon-annotation')
        .attr('transform', 'translate(-6, -22)')
        .attr('width', '12px')
        .attr('height', '12px')
        .attr('xlink:href', d => d.icon ? '#' + d.icon : '');

    // update
    markers
      .merge(markersEnter)
      .sort(sortY)
        .classed('selected', d => d.id === selectedID)
        .attr('transform', getTransform);

    // Draw targets..
    if (touchLayer.empty()) return;
    const fillClass = context.getDebug('target') ? 'pink' : 'nocolor';

    const targets = touchLayer.selectAll('.qaItem.osmose')
      .data(data, d => d.id);

    // exit
    targets.exit()
      .remove();

    // enter/update
    targets.enter()
      .append('rect')
        .attr('width', '20px')
        .attr('height', '30px')
        .attr('x', '-10px')
        .attr('y', '-28px')
      .merge(targets)
      .sort(sortY)
        .attr('class', d => `qaItem ${d.service} target ${fillClass} itemId-${d.id}`)
        .attr('transform', getTransform);

    function sortY(a, b) {
      return (a.id === selectedID) ? 1
        : (b.id === selectedID) ? -1
        : b.loc[1] - a.loc[1];
    }
  }

  // Draw the Osmose layer and schedule loading issues and updating markers.
  function drawOsmose(selection) {
    const service = getService();

    const surface = context.surface();
    if (surface && !surface.empty()) {
      touchLayer = surface.selectAll('.data-layer.touch .layer-touch.markers');
    }

    drawLayer = selection.selectAll('.layer-osmose')
      .data(service ? [0] : []);

    drawLayer.exit()
      .remove();

    drawLayer = drawLayer.enter()
      .append('g')
        .attr('class', 'layer-osmose')
        .style('display', _layerEnabled ? 'block' : 'none')
      .merge(drawLayer);

    if (_layerEnabled) {
      if (service && ~~context.map().zoom() >= minZoom) {
        editOn();
        service.loadIssues(projection);
        updateMarkers();
      } else {
        editOff();
      }
    }
  }

  // Toggles the layer on and off
  drawOsmose.enabled = function(val) {
    if (!arguments.length) return _layerEnabled;

    _layerEnabled = val;
    if (_layerEnabled) {
      // Strings supplied by Osmose fetched before showing layer for first time
      // NOTE: Currently no way to change locale in iD at runtime, would need to re-call this method if that's ever implemented
      // Also, If layer is toggled quickly multiple requests are sent
      getService().loadStrings()
        .then(layerOn)
        .catch(err => {
          console.log(err); // eslint-disable-line no-console
        });
    } else {
      layerOff();
      if (context.selectedErrorID()) {
        context.enter(modeBrowse(context));
      }
    }

    dispatch.call('change');
    return this;
  };

  drawOsmose.supported = () => !!getService();

  return drawOsmose;
}
