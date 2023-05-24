import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';
import { services } from '../services';
import {svgPath, svgPointTransform} from './helpers';


export function svgMapilioImages(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const minZoom = 12;
    let layer = d3_select(null);
    let _mapilio;


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
        if (d.ca) {
            t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
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

    function update() {

        const z = ~~context.map().zoom();

        const service = getService();
        let sequences = (service ? service.sequences(projection) : []);
        let images = (service ? service.images(projection) : []);


        // service.filterViewer(context);

        let traces = layer.selectAll('.sequences').selectAll('.sequence')
            .data(sequences, function(d) { return d.properties.id; });

        // exit
        traces.exit()
            .remove();
        //
        // // enter/update
        traces = traces.enter()
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
            .attr('class', 'viewfield-group');

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
            .data([0]);

        viewfields.exit()
            .remove();

        viewfields.enter()               // viewfields may or may not be drawn...
            .insert('path', 'circle')    // but if they are, draw below the circles
            .attr('class', 'viewfield')
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')

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


    init();
    return drawImages;
}
