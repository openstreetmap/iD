import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { svgPath, svgPointTransform } from './helpers';
import { services } from '../services';


export function svgKartaviewImages(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var minZoom = 12;
    var minMarkerZoom = 16;
    var minViewfieldZoom = 18;
    var layer = d3_select(null);
    var _kartaview;


    function init() {
        if (svgKartaviewImages.initialized) return;  // run once
        svgKartaviewImages.enabled = false;
        svgKartaviewImages.initialized = true;
    }


    function getService() {
        if (services.kartaview && !_kartaview) {
            _kartaview = services.kartaview;
            _kartaview.event.on('loadedImages', throttledRedraw);
        } else if (!services.kartaview && _kartaview) {
            _kartaview = null;
        }

        return _kartaview;
    }


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


    function hideLayer() {
        throttledRedraw.cancel();

        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end', editOff);
    }


    function editOn() {
        layer.style('display', 'block');
    }


    function editOff() {
        layer.selectAll('.viewfield-group').remove();
        layer.style('display', 'none');
    }


    function click(d3_event, d) {
        var service = getService();
        if (!service) return;

        service
            .ensureViewerLoaded(context)
            .then(function() {
                service.selectImage(context, d.key)
                    .showViewer(context);
            });

        context.map().centerEase(d.loc);
    }


    function mouseover(d3_event, d) {
        var service = getService();
        if (service) service.setStyles(context, d);
    }


    function mouseout() {
        var service = getService();
        if (service) service.setStyles(context, null);
    }


    function transform(d) {
        var t = svgPointTransform(projection)(d);
        if (d.ca) {
            t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        }
        return t;
    }


    function filterImages(images) {
        var fromDate = context.photos().fromDate();
        var toDate = context.photos().toDate();
        var usernames = context.photos().usernames();

        if (fromDate) {
            var fromTimestamp = new Date(fromDate).getTime();
            images = images.filter(function(item) {
                return new Date(item.captured_at).getTime() >= fromTimestamp;
            });
        }
        if (toDate) {
            var toTimestamp = new Date(toDate).getTime();
            images = images.filter(function(item) {
                return new Date(item.captured_at).getTime() <= toTimestamp;
            });
        }
        if (usernames) {
            images = images.filter(function(item) {
                return usernames.indexOf(item.captured_by) !== -1;
            });
        }

        return images;
    }

    function filterSequences(sequences) {
        var fromDate = context.photos().fromDate();
        var toDate = context.photos().toDate();
        var usernames = context.photos().usernames();

        if (fromDate) {
            var fromTimestamp = new Date(fromDate).getTime();
            sequences = sequences.filter(function(image) {
                return new Date(image.properties.captured_at).getTime() >= fromTimestamp;
            });
        }
        if (toDate) {
            var toTimestamp = new Date(toDate).getTime();
            sequences = sequences.filter(function(image) {
                return new Date(image.properties.captured_at).getTime() <= toTimestamp;
            });
        }
        if (usernames) {
            sequences = sequences.filter(function(image) {
                return usernames.indexOf(image.properties.captured_by) !== -1;
            });
        }

        return sequences;
    }

    function update() {
        var viewer = context.container().select('.photoviewer');
        var selected = viewer.empty() ? undefined : viewer.datum();

        var z = ~~context.map().zoom();
        var showMarkers = (z >= minMarkerZoom);
        var showViewfields = (z >= minViewfieldZoom);

        var service = getService();
        var sequences = [];
        var images = [];

        if (context.photos().showsFlat()) {
            sequences = (service ? service.sequences(projection) : []);
            images = (service && showMarkers ? service.images(projection) : []);
            sequences = filterSequences(sequences);
            images = filterImages(images);
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
            .data(images, function(d) { return d.key; });

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
                    : b.loc[1] - a.loc[1];  // sort Y
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

        viewfields.enter()               // viewfields may or may not be drawn...
            .insert('path', 'circle')    // but if they are, draw below the circles
            .attr('class', 'viewfield')
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z');
    }


    function drawImages(selection) {
        var enabled = svgKartaviewImages.enabled,
            service = getService();

        layer = selection.selectAll('.layer-kartaview')
            .data(service ? [0] : []);

        layer.exit()
            .remove();

        var layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-kartaview')
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
            } else {
                editOff();
            }
        }
    }


    drawImages.enabled = function(_) {
        if (!arguments.length) return svgKartaviewImages.enabled;
        svgKartaviewImages.enabled = _;
        if (svgKartaviewImages.enabled) {
            showLayer();
            context.photos().on('change.kartaview_images', update);
        } else {
            hideLayer();
            context.photos().on('change.kartaview_images', null);
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
