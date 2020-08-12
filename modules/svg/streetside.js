import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPath, svgPointTransform } from './helpers';
import { services } from '../services';


export function svgStreetside(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 14;
    var minMarkerZoom = 16;
    var minViewfieldZoom = 18;
    var layer = d3_select(null);
    var _viewerYaw = 0;
    var _selectedSequence = null;
    var _streetside;

    /**
     * init().
     */
    function init() {
        if (svgStreetside.initialized) return;  // run once
        svgStreetside.enabled = false;
        svgStreetside.initialized = true;
    }

    /**
     * getService().
     */
    function getService() {
        if (services.streetside && !_streetside) {
            _streetside = services.streetside;
            _streetside.event
                .on('viewerChanged.svgStreetside', viewerChanged)
                .on('loadedBubbles.svgStreetside', throttledRedraw);
        } else if (!services.streetside && _streetside) {
            _streetside = null;
        }

        return _streetside;
    }

    /**
     * showLayer().
     */
    function showLayer() {
        var service = getService();
        if (!service) return;

        editOn();

        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });
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
    function click(d) {
        var service = getService();
        if (!service) return;

        // try to preserve the viewer rotation when staying on the same sequence
        if (d.sequenceKey !== _selectedSequence) {
            _viewerYaw = 0;  // reset
        }
        _selectedSequence = d.sequenceKey;

        service
            .selectImage(context, d)
            .then(response => {
                if (response.status === 'ok'){
                    service.showViewer(context, _viewerYaw);
                }
            });


        context.map().centerEase(d.loc);
    }

    /**
     * mouseover().
     */
    function mouseover(d) {
        var service = getService();
        if (service) service.setStyles(context, d);
    }

    /**
     * mouseout().
     */
    function mouseout() {
        var service = getService();
        if (service) service.setStyles(context, null);
    }

    /**
     * transform().
     */
    function transform(d) {
        var t = svgPointTransform(projection)(d);
        var rot = d.ca + _viewerYaw;
        if (rot) {
            t += ' rotate(' + Math.floor(rot) + ',0,0)';
        }
        return t;
    }


    function viewerChanged() {
        var service = getService();
        if (!service) return;

        var viewer = service.viewer();
        if (!viewer) return;

        // update viewfield rotation
        _viewerYaw = viewer.getYaw();

        // avoid updating if the map is currently transformed
        // e.g. during drags or easing.
        if (context.map().isTransformed()) return;

        layer.selectAll('.viewfield-group.currentView')
            .attr('transform', transform);
    }


    context.photos().on('change.streetside', update);

    /**
     * update().
     */
    function update() {
        var viewer = context.container().select('.photoviewer');
        var selected = viewer.empty() ? undefined : viewer.datum();
        var z = ~~context.map().zoom();
        var showMarkers = (z >= minMarkerZoom);
        var showViewfields = (z >= minViewfieldZoom);
        var service = getService();

        var sequences = [];
        var bubbles = [];

        if (context.photos().showsPanoramic()) {
            sequences = (service ? service.sequences(projection) : []);
            bubbles = (service && showMarkers ? service.bubbles(projection) : []);
        }

        var traces = layer.selectAll('.sequences').selectAll('.sequence')
            .data(sequences, function(d) { return d.properties.key; });

        // exit
        traces.exit()
            .remove();

        // enter/update
        traces = traces.enter()
            .append('path')
            .attr('class', 'sequence')
            .merge(traces)
            .attr('d', svgPath(projection).geojson);


        var groups = layer.selectAll('.markers').selectAll('.viewfield-group')
            .data(bubbles, function(d) {
                // force reenter once bubbles are attached to a sequence
                return d.key + (d.sequenceKey ? 'v1' : 'v0');
            });

        // exit
        groups.exit()
            .remove();

        // enter
        var groupsEnter = groups.enter()
            .append('g')
            .attr('class', 'viewfield-group')
            .on('mouseenter', mouseover)
            .on('mouseleave', mouseout)
            .on('click', click);

        groupsEnter
            .append('g')
            .attr('class', 'viewfield-scale');

        // update
        var markers = groups
            .merge(groupsEnter)
            .sort(function(a, b) {
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

        var viewfields = markers.selectAll('.viewfield')
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
            var d = this.parentNode.__data__;
            if (d.pano) {
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
        var enabled = svgStreetside.enabled;
        var service = getService();

        layer = selection.selectAll('.layer-streetside-images')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        var layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-streetside-images')
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
                service.loadBubbles(projection);
            } else {
                editOff();
            }
        }
    }


    /**
     * drawImages.enabled().
     */
    drawImages.enabled = function(_) {
        if (!arguments.length) return svgStreetside.enabled;
        svgStreetside.enabled = _;
        if (svgStreetside.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.call('change');
        return this;
    };

    /**
     * drawImages.supported().
     */
    drawImages.supported = function() {
        return !!getService();
    };

    init();

    return drawImages;
}
