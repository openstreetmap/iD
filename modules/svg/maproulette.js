import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';

import { modeBrowse } from '../modes/browse';
import { svgPointTransform } from './helpers';
import { services } from '../services';

let _layerEnabled = false;
let _qaService;

export function svgMapRoulette(projection, context, dispatch) {
    const throttledRedraw = _throttle(() => {
        dispatch.call('change');
        updateMarkers();
    }, 300);
    const minZoom = 12;

    let touchLayer = d3_select(null);
    let drawLayer = d3_select(null);
    let layerVisible = false;

    // New marker: circular head with small tail
    function appendMarkerHead(selection) {
        // head circle
        selection
            .append('circle')
            .attr('cx', 0)
            .attr('cy', -22)
            .attr('r', 8)
            .attr('fill', '#47725f')
            .attr('stroke', '#111')
            .attr('stroke-width', 1.25);

        // inner logo (scaled to fit inside the 16px diameter circle)
        const scale = 0.35; // 40 * 0.35 = 14px
        const g = selection
            .append('g')
            .attr(
                'transform',
                `translate(${-20 * scale}, ${-22 - 20 * scale}) scale(${scale})`,
            )
            .attr('fill', '#ffffff')
            .attr('stroke', 'none');
        g.append('path').attr(
            'd',
            'm28.121 11.879-2.828 5.657-2.829-2.829zM11.879 28.121l2.828-5.657 2.829 2.829z',
        );
        g.append('path').attr(
            'd',
            'M20 26a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0-1.333a4.667 4.667 0 1 0 0-9.334 4.667 4.667 0 0 0 0 9.334Z',
        );
        g.append('path').attr(
            'd',
            'M19.875 0C8.916 0 0 8.916 0 19.875c0 10.96 8.916 19.876 19.875 19.876 10.96 0 19.876-8.916 19.876-19.876C39.75 8.916 30.835 0 19.875 0Zm0 38.426c-10.228 0-18.55-8.322-18.55-18.55 0-10.23 8.322-18.551 18.55-18.551 10.229 0 18.55 8.322 18.55 18.55 0 10.229-8.321 18.55-18.55 18.55Z',
        );
        g.append('path').attr(
            'd',
            'M36.438 20.538a.662.662 0 1 0 0-1.325h-2.004a14.593 14.593 0 0 0-.325-2.466l1.936-.519a.662.662 0 1 0-.342-1.28l-1.936.519a14.389 14.389 0 0 0-.957-2.296l1.74-1.004a.662.662 0 1 0-.663-1.147l-1.741 1.005c-.45-.7-.954-1.36-1.513-1.972l1.422-1.422a.663.663 0 0 0-.937-.937l-1.422 1.422a14.697 14.697 0 0 0-1.972-1.512l1.005-1.741a.663.663 0 1 0-1.147-.663l-1.005 1.74a14.45 14.45 0 0 0-2.295-.958L24.8 4.05a.662.662 0 1 0-1.28-.344L23 5.642a14.58 14.58 0 0 0-2.465-.324V3.313a.662.662 0 1 0-1.324 0l-.001 2.004c-.842.038-1.666.15-2.465.325l-.52-1.936a.662.662 0 1 0-1.278.342l.518 1.936a14.45 14.45 0 0 0-2.296.957L12.166 5.2a.662.662 0 1 0-1.147.662l1.005 1.742c-.7.45-1.36.954-1.972 1.513l-1.42-1.422a.664.664 0 0 0-.938.937l1.42 1.422a14.688 14.688 0 0 0-1.51 1.972L5.862 11.02a.662.662 0 1 0-.663 1.148l1.74 1.005a14.45 14.45 0 0 0-.957 2.296l-1.935-.52a.663.663 0 0 0-.344 1.28l1.938.52c-.175.8-.286 1.622-.324 2.465l-2.005-.001a.663.663 0 0 0-.001 1.325l2.006.001c.038.843.15 1.666.325 2.466l-1.937.517a.663.663 0 0 0 .341 1.28l1.938-.517c.254.797.576 1.564.957 2.295L5.2 27.582a.663.663 0 0 0 .66 1.15l1.744-1.006c.45.7.954 1.36 1.513 1.972l-1.423 1.42a.662.662 0 1 0 .936.938l1.424-1.42a14.687 14.687 0 0 0 1.971 1.51l-1.007 1.742a.662.662 0 0 0 1.147.663l1.006-1.74a14.45 14.45 0 0 0 2.296.956l-.52 1.934a.662.662 0 1 0 1.28.345l.52-1.937c.8.176 1.623.287 2.465.325l-.001 2.003a.662.662 0 1 0 1.325.001l.001-2.004a14.53 14.53 0 0 0 2.466-.325l.517 1.936a.662.662 0 1 0 1.28-.342l-.517-1.935a14.44 14.44 0 0 0 2.295-.957l1.003 1.74a.66.66 0 0 0 .904.243.662.662 0 0 0 .243-.905l-1.003-1.743c.699-.449 1.36-.953 1.971-1.512l1.42 1.422a.66.66 0 0 0 .937 0 .664.664 0 0 0 .001-.936l-1.421-1.423a14.64 14.64 0 0 0 1.513-1.971l1.739 1.005a.665.665 0 0 0 .905-.242.662.662 0 0 0-.242-.905l-1.738-1.005c.381-.732.703-1.499.957-2.296l1.933.52a.663.663 0 0 0 .344-1.28l-1.936-.52c.176-.8.287-1.623.325-2.465h2.004ZM19.875 33.126c-7.306 0-13.25-5.944-13.25-13.25 0-7.307 5.944-13.25 13.25-13.25 7.307 0 13.25 5.943 13.25 13.25 0 7.306-5.943 13.25-13.25 13.25Z',
        );
        // small tail pointing down to baseline (y=0)
        selection
            .append('path')
            .attr('d', 'M -3 -14 L 0 0 L 3 -14 Z')
            .attr('fill', '#47725f')
            .attr('stroke', '#111')
            .attr('stroke-width', 1.25)
            .attr('stroke-linejoin', 'round');
    }

    function getService() {
        if (services.maproulette && !_qaService) {
            _qaService = services.maproulette;
            _qaService.on('loaded', throttledRedraw);
        } else if (!services.maproulette && _qaService) {
            _qaService = null;
        }
        return _qaService;
    }

    function editOn() {
        if (!layerVisible) {
            layerVisible = true;
            drawLayer.style('display', 'block');
        }
    }

    function editOff() {
        if (layerVisible) {
            layerVisible = false;
            drawLayer.style('display', 'none');
            drawLayer.selectAll('.qaItem.maproulette').remove();
            touchLayer.selectAll('.qaItem.maproulette').remove();
        }
    }

    function layerOn() {
        editOn();
        drawLayer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end interrupt', () => dispatch.call('change'));
    }

    function layerOff() {
        throttledRedraw.cancel();
        drawLayer.interrupt();
        touchLayer.selectAll('.qaItem.maproulette').remove();
        drawLayer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end interrupt', () => {
                editOff();
                dispatch.call('change');
            });
    }

    function updateMarkers() {
        if (!layerVisible || !_layerEnabled) return;
        const service = getService();
        const selectedID = context.selectedErrorID();
        const data = service ? service.getItems(projection) : [];
        const getTransform = svgPointTransform(projection);

        const markers = drawLayer
            .selectAll('.qaItem.maproulette')
            .data(data, (d) => d.id);

        markers.exit().remove();

        const markersEnter = markers
            .enter()
            .append('g')
            .attr('class', (d) => `qaItem ${d.service} itemId-${d.id}`);

        // simple shadow ellipse
        markersEnter
            .append('ellipse')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('rx', 4.5)
            .attr('ry', 2)
            .attr('class', 'stroke');

        // circular head with tail
        appendMarkerHead(markersEnter);

        // Optional: glyph in white could be added here if needed

        markers
            .merge(markersEnter)
            .sort(sortY)
            .classed('selected', (d) => d.id === selectedID)
            .attr('transform', getTransform);

        if (touchLayer.empty()) return;
        const fillClass = context.getDebug('target') ? 'pink ' : 'nocolor ';

        const targets = touchLayer
            .selectAll('.qaItem.maproulette')
            .data(data, (d) => d.id);

        targets.exit().remove();

        targets
            .enter()
            .append('rect')
            .attr('width', '20px')
            .attr('height', '20px')
            .attr('x', '-8px')
            .attr('y', '-22px')
            .merge(targets)
            .sort(sortY)
            .attr(
                'class',
                (d) => `qaItem ${d.service} target ${fillClass} itemId-${d.id}`,
            )
            .attr('transform', getTransform);

        function sortY(a, b) {
            return a.id === selectedID
                ? 1
                : b.id === selectedID
                  ? -1
                  : b.loc[1] - a.loc[1];
        }
    }

    function drawMapRoulette(selection) {
        const service = getService();
        const surface = context.surface();
        if (surface && !surface.empty()) {
            touchLayer = surface.selectAll(
                '.data-layer.touch .layer-touch.markers',
            );
        }

        drawLayer = selection
            .selectAll('.layer-maproulette')
            .data(service ? [0] : []);

        drawLayer.exit().remove();

        drawLayer = drawLayer
            .enter()
            .append('g')
            .attr('class', 'layer-maproulette')
            .style('display', _layerEnabled ? 'block' : 'none')
            .merge(drawLayer);

        if (_layerEnabled) {
            if (service && ~~context.map().zoom() >= minZoom) {
                editOn();
                // Load at start and on every draw
                service.loadIssues(projection);
                updateMarkers();
            } else {
                editOff();
            }
        }
    }

    drawMapRoulette.enabled = function (val) {
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

    drawMapRoulette.supported = () => !!getService();

    return drawMapRoulette;
}
