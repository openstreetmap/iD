import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { svgPointTransform } from './helpers';
import { services } from '../services';


export function svgMapillaryPosition(projection, context) {
    var throttledRedraw = _throttle(function () { update(); }, 1000);
    var minZoom = 12;
    var minViewfieldZoom = 18;
    var layer = d3_select(null);
    var _mapillary;
    var viewerCompassAngle;


    function init() {
        if (svgMapillaryPosition.initialized) return;  // run once
        svgMapillaryPosition.initialized = true;
    }


    function getService() {
        if (services.mapillary && !_mapillary) {
            _mapillary = services.mapillary;
            _mapillary.event.on('nodeChanged', throttledRedraw);
            _mapillary.event.on('bearingChanged', function(e) {
                viewerCompassAngle = e;

                if (context.map().isTransformed()) return;

                layer.selectAll('.viewfield-group.currentView')
                    .filter(function(d) {
                        return d.pano;
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
        var t = svgPointTransform(projection)(d);
        if (d.pano && viewerCompassAngle !== null && isFinite(viewerCompassAngle)) {
            t += ' rotate(' + Math.floor(viewerCompassAngle) + ',0,0)';
        } else if (d.ca) {
            t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        }
        return t;
    }

    function update() {

        var z = ~~context.map().zoom();
        var showViewfields = (z >= minViewfieldZoom);

        var service = getService();
        var node = service && service.getActiveImage();

        var groups = layer.selectAll('.markers').selectAll('.viewfield-group')
            .data(node ? [node] : [], function(d) { return d.key; });

        // exit
        groups.exit()
            .remove();

        // enter
        var groupsEnter = groups.enter()
            .append('g')
            .attr('class', 'viewfield-group currentView highlighted');


        groupsEnter
            .append('g')
            .attr('class', 'viewfield-scale');

        // update
        var markers = groups
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

        var viewfields = markers.selectAll('.viewfield')
            .data(showViewfields ? [0] : []);

        viewfields.exit()
            .remove();

        viewfields.enter()
            .insert('path', 'circle')
            .attr('class', 'viewfield')
            .classed('pano', function() { return this.parentNode.__data__.pano; })
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', viewfieldPath);

        function viewfieldPath() {
            var d = this.parentNode.__data__;
            if (d.pano) {
                return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
            } else {
                return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
            }
        }
    }


    function drawImages(selection) {
        var service = getService();

        layer = selection.selectAll('.layer-mapillary-position')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        var layerEnter = layer.enter()
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
