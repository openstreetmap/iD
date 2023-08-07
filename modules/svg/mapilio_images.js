import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { services } from '../services';
import {svgPath, svgPointTransform} from './helpers';


export function svgMapilioImages(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const minZoom = 12;
    let layer = d3_select(null);
    let _mapilio;
    const viewFieldZoomLevel = 18;


    function init() {
        if (svgMapilioImages.initialized) return;
        svgMapilioImages.enabled = false;
        svgMapilioImages.initialized = true;
    }


    function getService() {
        if (services.mapilio && !_mapilio) {
            _mapilio = services.mapilio;
            _mapilio.event.on('loadedImages', throttledRedraw);
        } else if (!services.mapilio && _mapilio) {
            _mapilio = null;
        }

        return _mapilio;
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
            .on('end', function () { dispatch.call('change'); });
    }


    function hideLayer() {
        throttledRedraw.cancel();

        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end', editOff);
    }

    function transform(d) {
        let t = svgPointTransform(projection)(d);
        if (d.heading) {
            t += ' rotate(' + Math.floor(d.heading) + ',0,0)';
        }
        return t;
    }


    function editOn() {
        layer.style('display', 'block');
    }


    function editOff() {
        layer.selectAll('.viewfield-group').remove();
        layer.style('display', 'none');
    }

    function click(d3_event, image) {
        const service = getService();
        if (!service) return;

        service
            .ensureViewerLoaded(context, image.id)
            .then(function() {
                service
                    .selectImage(context, image.id)
                    .showViewer(context);
            });

        context.map().centerEase(image.loc);
    }

    function mouseover(d3_event, image) {
        const service = getService();
        if (service) service.setStyles(context, image);
    }


    function mouseout() {
        const service = getService();
        if (service) service.setStyles(context, null);
    }

    function update() {

        const z = ~~context.map().zoom();
        const showViewfields = (z >= viewFieldZoomLevel);

        const service = getService();
        let sequences = (service ? service.sequences(projection) : []);
        let images = (service ? service.images(projection) : []);

        let traces = layer.selectAll('.sequences').selectAll('.sequence')
            .data(sequences, function(d) { return d.properties.id; });

        // exit
        traces.exit()
            .remove();

        traces.enter()
            .append('path')
            .attr('class', 'sequence')
            .merge(traces)
            .attr('d', svgPath(projection).geojson);


        const groups = layer.selectAll('.markers').selectAll('.viewfield-group')
            .data(images, function(d) { return d.id; });

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
            .sort(function(a, b) {
                return b.loc[1] - a.loc[1];  // sort Y
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

        viewfields.enter()
            .insert('path', 'circle')
            .attr('class', 'viewfield')
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', viewfieldPath);

        function viewfieldPath() {
            if (this.parentNode.__data__.isPano) {
                return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
            } else {
                return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
            }
        }

    }


    function drawImages(selection) {
        const enabled = svgMapilioImages.enabled;
        const service = getService();

        layer = selection.selectAll('.layer-mapilio')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        const layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-mapilio')
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
                service.loadLines(projection);
            } else {
                editOff();
            }
        }
    }


    drawImages.enabled = function(_) {
        if (!arguments.length) return svgMapilioImages.enabled;
        svgMapilioImages.enabled = _;
        if (svgMapilioImages.enabled) {
            showLayer();
            context.photos().on('change.mapilio_images', null);
        } else {
            hideLayer();
            context.photos().on('change.mapilio_images', null);
        }
        dispatch.call('change');
        return this;
    };


    drawImages.supported = function() {
        return !!getService();
    };

    drawImages.rendered = function(zoom) {
      return zoom >= minZoom;
    };


    init();
    return drawImages;
}
