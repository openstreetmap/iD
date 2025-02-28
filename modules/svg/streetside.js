import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPath, svgPointTransform } from './helpers';
import { services } from '../services';


export function svgStreetside(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const minZoom = 14;
    const minMarkerZoom = 16;
    const minViewfieldZoom = 18;
    let layer = d3_select(null);
    let _viewerYaw = 0;
    let _selectedSequence = null;
    let _streetside;

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
                .on('loadedImages.svgStreetside', throttledRedraw);
        } else if (!services.streetside && _streetside) {
            _streetside = null;
        }

        return _streetside;
    }

    /**
     * showLayer().
     */
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
        if (d.sequenceKey !== _selectedSequence) {
            _viewerYaw = 0;  // reset
        }
        _selectedSequence = d.sequenceKey;

        service
            .ensureViewerLoaded(context)
            .then(function() {
                service
                    .selectImage(context, d.key)
                    .yaw(_viewerYaw)
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


    function filterBubbles(bubbles) {
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();
        const usernames = context.photos().usernames();

        if (fromDate) {
            const fromTimestamp = new Date(fromDate).getTime();
            bubbles = bubbles.filter(function(bubble) {
                return new Date(bubble.captured_at).getTime() >= fromTimestamp;
            });
        }
        if (toDate) {
            const toTimestamp = new Date(toDate).getTime();
            bubbles = bubbles.filter(function(bubble) {
                return new Date(bubble.captured_at).getTime() <= toTimestamp;
            });
        }
        if (usernames) {
            bubbles = bubbles.filter(function(bubble) {
                return usernames.indexOf(bubble.captured_by) !== -1;
            });
        }

        return bubbles;
    }

    function filterSequences(sequences) {
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();
        const usernames = context.photos().usernames();

        if (fromDate) {
            const fromTimestamp = new Date(fromDate).getTime();
            sequences = sequences.filter(function(sequences) {
                return new Date(sequences.properties.captured_at).getTime() >= fromTimestamp;
            });
        }
        if (toDate) {
            const toTimestamp = new Date(toDate).getTime();
            sequences = sequences.filter(function(sequences) {
                return new Date(sequences.properties.captured_at).getTime() <= toTimestamp;
            });
        }
        if (usernames) {
            sequences = sequences.filter(function(sequences) {
                return usernames.indexOf(sequences.properties.captured_by) !== -1;
            });
        }

        return sequences;
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
        let bubbles = [];

        if (context.photos().showsPanoramic()) {
            sequences = (service ? service.sequences(projection) : []);
            bubbles = (service && showMarkers ? service.bubbles(projection) : []);
            sequences = filterSequences(sequences);
            bubbles = filterBubbles(bubbles);
        }

        let traces = layer.selectAll('.sequences').selectAll('.sequence')
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


        const groups = layer.selectAll('.markers').selectAll('.viewfield-group')
            .data(bubbles, function(d) {
                // force reenter once bubbles are attached to a sequence
                return d.key + (d.sequenceKey ? 'v1' : 'v0');
            });

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
        const enabled = svgStreetside.enabled;
        const service = getService();

        layer = selection.selectAll('.layer-streetside-images')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        const layerEnter = layer.enter()
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
            context.photos().on('change.streetside', update);
        } else {
            hideLayer();
            context.photos().on('change.streetside', null);
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

    drawImages.rendered = function(zoom) {
      return zoom >= minZoom;
    };

    init();

    return drawImages;
}
