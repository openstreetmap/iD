import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';

import { modeBrowse } from '../modes/browse';
import { svgPointTransform } from './helpers';
import { services } from '../services';

let _layerEnabled = false;
let _qaService;

export function svgKeepRight(projection, context, dispatch) {
  const throttledRedraw = _throttle(() => dispatch.call('change'), 1000);
  const minZoom = 12;

  let touchLayer = d3_select(null);
  let drawLayer = d3_select(null);
  let layerVisible = false;

  function markerPath(selection, klass) {
    selection
      .attr('class', klass)
      .attr('transform', 'translate(-4, -24)')
      .attr('d', 'M11.6,6.2H7.1l1.4-5.1C8.6,0.6,8.1,0,7.5,0H2.2C1.7,0,1.3,0.3,1.3,0.8L0,10.2c-0.1,0.6,0.4,1.1,0.9,1.1h4.6l-1.8,7.6C3.6,19.4,4.1,20,4.7,20c0.3,0,0.6-0.2,0.8-0.5l6.9-11.9C12.7,7,12.3,6.2,11.6,6.2z');
  }

  // Loosely-coupled keepRight service for fetching issues.
  function getService() {
    if (services.keepRight && !_qaService) {
      _qaService = services.keepRight;
      _qaService.on('loaded', throttledRedraw);
    } else if (!services.keepRight && _qaService) {
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
      drawLayer.selectAll('.qaItem.keepRight')
        .remove();
      touchLayer.selectAll('.qaItem.keepRight')
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
    touchLayer.selectAll('.qaItem.keepRight')
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
    const markers = drawLayer.selectAll('.qaItem.keepRight')
      .data(data, d => d.id);

    // exit
    markers.exit()
      .remove();

    // enter
    const markersEnter = markers.enter()
      .append('g')
        .attr('class', d => `qaItem ${d.service} itemId-${d.id} itemType-${d.parentIssueType}`);

    markersEnter
      .append('ellipse')
        .attr('cx', 0.5)
        .attr('cy', 1)
        .attr('rx', 6.5)
        .attr('ry', 3)
        .attr('class', 'stroke');

    markersEnter
      .append('path')
        .call(markerPath, 'shadow');

    markersEnter
      .append('use')
        .attr('class', 'qaItem-fill')
        .attr('width', '20px')
        .attr('height', '20px')
        .attr('x', '-8px')
        .attr('y', '-22px')
        .attr('xlink:href', '#iD-icon-bolt');

    // update
    markers
      .merge(markersEnter)
      .sort(sortY)
        .classed('selected', d => d.id === selectedID)
        .attr('transform', getTransform);


    // Draw targets..
    if (touchLayer.empty()) return;
    const fillClass = context.getDebug('target') ? 'pink ' : 'nocolor ';

    const targets = touchLayer.selectAll('.qaItem.keepRight')
      .data(data, d => d.id);

    // exit
    targets.exit()
      .remove();

    // enter/update
    targets.enter()
      .append('rect')
        .attr('width', '20px')
        .attr('height', '20px')
        .attr('x', '-8px')
        .attr('y', '-22px')
      .merge(targets)
      .sort(sortY)
        .attr('class', d => `qaItem ${d.service} target ${fillClass} itemId-${d.id}`)
        .attr('transform', getTransform);


    function sortY(a, b) {
      return (a.id === selectedID) ? 1
        : (b.id === selectedID) ? -1
        : (a.severity === 'error' && b.severity !== 'error') ? 1
        : (b.severity === 'error' && a.severity !== 'error') ? -1
        : b.loc[1] - a.loc[1];
    }
  }

  // Draw the keepRight layer and schedule loading issues and updating markers.
  function drawKeepRight(selection) {
    const service = getService();

    const surface = context.surface();
    if (surface && !surface.empty()) {
      touchLayer = surface.selectAll('.data-layer.touch .layer-touch.markers');
    }

    drawLayer = selection.selectAll('.layer-keepRight')
      .data(service ? [0] : []);

    drawLayer.exit()
      .remove();

    drawLayer = drawLayer.enter()
      .append('g')
        .attr('class', 'layer-keepRight')
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
  drawKeepRight.enabled = function(val) {
    if (!arguments.length) return _layerEnabled;

    _layerEnabled = val;
    if (_layerEnabled) {
      layerOn();
    } else {
      layerOff();
      if (context.selectedErrorID()) {
        context.enter(modeBrowse(context));
      }
    }

    dispatch.call('change');
    return this;
  };

  drawKeepRight.supported = () => !!getService();

  return drawKeepRight;
}
