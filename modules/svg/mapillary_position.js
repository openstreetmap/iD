import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './helpers';
import { services } from '../services';


export function svgMapillaryPosition(projection, context) {
    const throttledRedraw = _throttle(function () { update(); }, 1000);
    const minZoom = 12;
    const minViewfieldZoom = 18;
    let layer = d3_select(null);
    let _mapillary;
    let viewerCompassAngle;


    function init() {
        if (svgMapillaryPosition.initialized) return;  // run once
        svgMapillaryPosition.initialized = true;
    }


    function getService() {
        if (services.mapillary && !_mapillary) {
            _mapillary = services.mapillary;
            _mapillary.event.on('imageChanged', throttledRedraw);
            _mapillary.event.on('bearingChanged', function(e) {
                viewerCompassAngle = e.bearing;

                if (context.map().isTransformed()) return;

                layer.selectAll('.viewfield-group.currentView')
                    .filter(function(d) {
                        return d.is_pano;
                    })
                    .attr('transform', transform);
            });
        } else if (!services.mapillary && _mapillary) {
            _mapillary = null;
        }

        return _mapillary;
    }

    function editOn() {
        layer.style('display', 'block');
    }


    function editOff() {
        layer.selectAll('.viewfield-group').remove();
        layer.style('display', 'none');
    }


    function transform(d) {
        let t = svgPointTransform(projection)(d);
        if (d.is_pano && viewerCompassAngle !== null && isFinite(viewerCompassAngle)) {
            t += ' rotate(' + Math.floor(viewerCompassAngle) + ',0,0)';
        } else if (d.ca) {
            t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        }
        return t;
    }

    function update() {

        const z = ~~context.map().zoom();
        const showViewfields = (z >= minViewfieldZoom);

        const service = getService();
        const image = service && service.getActiveImage();

        const groups = layer.selectAll('.markers').selectAll('.viewfield-group')
            .data(image ? [image] : [], function(d) { return d.id; });

        // exit
        groups.exit()
            .remove();

        // enter
        const groupsEnter = groups.enter()
            .append('g')
            .attr('class', 'viewfield-group currentView highlighted');


        groupsEnter
            .append('g')
            .attr('class', 'viewfield-scale');

        // update
        const markers = groups
            .merge(groupsEnter)
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

        viewfields.enter()
            .insert('path', 'circle')
            .attr('class', 'viewfield')
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z');
    }


    function drawImages(selection) {
        const service = getService();

        layer = selection.selectAll('.layer-mapillary-position')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        const layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-mapillary-position');


        layerEnter
            .append('g')
            .attr('class', 'markers');

        layer = layerEnter
            .merge(layer);

        if (service && ~~context.map().zoom() >= minZoom) {
            editOn();
            update();
        } else {
            editOff();
        }
    }


    drawImages.enabled = function() {
        update();
        return this;
    };


    drawImages.supported = function() {
        return !!getService();
    };


    init();
    return drawImages;
}
