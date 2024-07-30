
import { fileFetcher } from '../core/file_fetcher';
import { svgPath } from './helpers';


export function svgDebug(projection, context) {

  function drawDebug(selection) {
    const showTile = context.getDebug('tile');
    const showCollision = context.getDebug('collision');
    const showImagery = context.getDebug('imagery');
    const showTouchTargets = context.getDebug('target');
    const showDownloaded = context.getDebug('downloaded');

    let debugData = [];
    if (showTile) {
      debugData.push({ class: 'red', label: 'tile' });
    }
    if (showCollision) {
      debugData.push({ class: 'yellow', label: 'collision' });
    }
    if (showImagery) {
      debugData.push({ class: 'orange', label: 'imagery' });
    }
    if (showTouchTargets) {
      debugData.push({ class: 'pink', label: 'touchTargets' });
    }
    if (showDownloaded) {
      debugData.push({ class: 'purple', label: 'downloaded' });
    }


    let legend = context.container().select('.main-content')
      .selectAll('.debug-legend')
      .data(debugData.length ? [0] : []);

    legend.exit()
      .remove();

    legend = legend.enter()
      .append('div')
      .attr('class', 'fillD debug-legend')
      .merge(legend);


    let legendItems = legend.selectAll('.debug-legend-item')
      .data(debugData, d => d.label);

    legendItems.exit()
      .remove();

    legendItems.enter()
      .append('span')
      .attr('class', d => `debug-legend-item ${d.class}`)
      .text(d => d.label);


    let layer = selection.selectAll('.layer-debug')
      .data(showImagery || showDownloaded ? [0] : []);

    layer.exit()
      .remove();

    layer = layer.enter()
      .append('g')
      .attr('class', 'layer-debug')
      .merge(layer);


    // imagery
    const extent = context.map().extent();
    fileFetcher.get('imagery')
      .then(d => {
        const hits = (showImagery && d.query.bbox(extent.rectangle(), true)) || [];
        const features = hits.map(d => d.features[d.id]);

        let imagery = layer.selectAll('path.debug-imagery')
          .data(features);

        imagery.exit()
          .remove();

        imagery.enter()
          .append('path')
          .attr('class', 'debug-imagery debug orange');
      })
      .catch(() => { /* ignore */ });

    // downloaded
    const osm = context.connection();
    let dataDownloaded = [];
    if (osm && showDownloaded) {
      const rtree = osm.caches('get').tile.rtree;
      dataDownloaded = rtree.all().map(bbox => {
        return {
          type: 'Feature',
          properties: { id: bbox.id },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [ bbox.minX, bbox.minY ],
              [ bbox.minX, bbox.maxY ],
              [ bbox.maxX, bbox.maxY ],
              [ bbox.maxX, bbox.minY ],
              [ bbox.minX, bbox.minY ]
            ]]
          }
        };
      });
    }

    let downloaded = layer
      .selectAll('path.debug-downloaded')
      .data(showDownloaded ? dataDownloaded : []);

    downloaded.exit()
      .remove();

    downloaded.enter()
      .append('path')
      .attr('class', 'debug-downloaded debug purple');

    // update
    layer.selectAll('path')
      .attr('d', svgPath(projection).geojson);
  }


  // This looks strange because `enabled` methods on other layers are
  // chainable getter/setters, and this one is just a getter.
  drawDebug.enabled = function() {
    if (!arguments.length) {
      return context.getDebug('tile') ||
        context.getDebug('collision') ||
        context.getDebug('imagery') ||
        context.getDebug('target') ||
        context.getDebug('downloaded');
    } else {
        return this;
    }
  };


  return drawDebug;
}
