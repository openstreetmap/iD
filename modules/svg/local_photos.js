import _throttle from 'lodash-es/throttle';

import { utilDetect } from '../util/detect';
import { select as d3_select } from 'd3-selection';
import { svgPath, svgPointTransform } from './helpers';
// import { services } from '../services';
// Modern Node.js can import CommonJS
import exifr from 'exifr'; // => exifr/dist/full.umd.cjs

// new
var _initialized = false;
var _enabled = false;

export function svgLocalPhotos(projection, context, dispatch) {
    // required
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    const minZoom = 12;
    const minMarkerZoom = 16;
    const minViewfieldZoom = 18;
    var detected = utilDetect();
    let layer = d3_select(null);
    var _fileList;

    // new
    function init() {
        console.log('inti() called');
        if (_initialized) return;  // run once

        _enabled = true;

        function over(d3_event) {
            d3_event.stopPropagation();
            d3_event.preventDefault();
            d3_event.dataTransfer.dropEffect = 'copy';
        }

        context.container()
            .attr('dropzone', 'copy')
            // .on('drop.svgData', function(d3_event) {
            .on('drop.svgLocalPhotos', function(d3_event) {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                if (!detected.filedrop) return;
                drawPhotos.fileList(d3_event.dataTransfer.files);
            })
            // .on('dragenter.svgData', over)
            // .on('dragexit.svgData', over)
            // .on('dragover.svgData', over);
            .on('dragenter.svgLocalPhotos', over)
            .on('dragexit.svgLocalPhotos', over)
            .on('dragover.svgLocalPhotos', over);

        _initialized = true;
    }

    // TODO: after checkbox is implemented
    function showLayer() {
        console.log('showLayer() called');
        // if images are not available return
        // const service = getService();
        // if (!service) return;

        // same as layerOn() in data.js
        editOn();

        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });
    }

    // TODO: after checkbox is implemented
    function hideLayer() {
        console.log('hideLayer() called');
        throttledRedraw.cancel();

        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end', editOff);
    }

    // same as layerOn() in data.js
    function editOn() {
        console.log('editOn() called');
        layer.style('display', 'block');
    }


    // same as layerOff() in data.js
    function editOff() {
        console.log('editOff() called');
        layer.selectAll('.viewfield-group').remove();
        layer.style('display', 'none');
    }

    // opens the image at bottom left
    function click(d3_event, image) {
        console.log('click() called');

        var width = 750, height = 400;

        var canvas = context.container().select('#container')
                     .append('canvas')
                     .attr('width', width)
                     .attr('height', height)
                     .style('position', 'absolute');
// style="position: absolute; width: 320px; height: 240px;"
        var canvas_context = canvas.node().getContext('2d');

        // const service = getService();
        // if (!service) return;

        // service
        //     .ensureViewerLoaded(context)
        //     .then(function() {
        //         service
        //             .selectImage(context, image.id)
        //             .showViewer(context);
        //     });

        context.map().centerEase(image.loc);
    }

    // TODO: later
    function mouseover(d3_event, image) {
        console.log('mouseover() called');
        // const service = getService();

        // if (service) service.setStyles(context, image);
    }

    // TODO: later
    function mouseout() {
        console.log('mouseout() called');
        // const service = getService();
        // if (service) service.setStyles(context, null);
    }

    // if you want to put any image with geo coordinates
    // this is coordinates transformation
    // converting gps coordinates on screen
    function fn_transform(projection) {
        var svgpoint = function(entity) {
            var pt = projection(entity.loc);
        console.log('projection point', pt);
            return 'translate(' + pt[0] + ',' + pt[1] + ')';
        };

        return svgpoint;
    }

    function transform(d) {
        console.log('transform() called with', d);
        // projection expects [long, lat]
        let t = fn_transform(projection)(d);
        console.log('after svgPointTransform', t);
        return t;
    }
    // a sequence is a list of images
    // no need to filter sequence
    // function filterSequences(sequences) {...}


    // puts the images on the map
    function update() {
        console.log('update() called');
        console.log(context.map());
        const z = ~~context.map().zoom();
        const showMarkers = (z >= minMarkerZoom);
        // const showViewfields = (z >= minViewfieldZoom);
        const showViewfields = true;

        // const service = getService();
        // const service = _fileList;
        // let sequences = (service ? service.sequences(projection) : []);
        // supply dummy data and see the rest of the code
        // let images = (service && showMarkers ? service.images(projection) : []);

        // images[0]
        // {
        //    "loc":[13.235349655151367,52.50694232952122],
        //    "captured_at":1619457514500,
        //    "ca":0,
        //    "id":505488307476058,
        //    "is_pano":false,
        //    "sequence_id":"zcyumxorbza3dq3twjybam"
        //    }
        // let image_1 = { ca: 63.629999999999995,
        //                 captured_at: 1629896192000,
        //                 id: 1698202743707180,
        //                 is_pano: false,
        //                 loc: [ 125, 280],
        //                 sequence_id: "DMyGn8gtvrBwN1xPbVFHAZ",
        //               }

        // let image_2 = { ca: 154.6,
        //                 captured_at: 1629892592000,
        //                 id: 331503412089696,
        //                 is_pano: false,
        //                 loc: [52.50783, 13.23618],
        //                 sequence_id: "eIZiowmur0COgFXAh468db"
        //               }

        let image_1 = {
                        id: 1,
                        // loc: [12.99306035041809, 51.99935827101777],
                        loc: [12, 51]
                      }

        let image_2 = {
                        id: 2,
                        // loc: [12.993113994598389, 51.999364876443025],
                        // loc: [13.23618, 52.50783],
                        loc: [35.014377, 52]
                      }

        let images = [image_1, image_2]


        const groups = layer.selectAll('.markers').selectAll('.viewfield-group')
            // .data(images, function(d) { return d.id; });
            .data(images, function(d) { return d.id; });


        // exit
        groups.exit()
            .remove();

        // enter
        const groupsEnter = groups.enter()
            .append('g')
            .attr('class', 'viewfield-group')
            // .on('mouseenter', mouseover)
            // .on('mouseleave', mouseout)
            .on('click', click);

        groupsEnter
            .append('g')
            .attr('class', 'viewfield-scale');

        // update
        const markers = groups
            .merge(groupsEnter)
            // .sort(function(a, b) {
            //     return b.loc[1] - a.loc[1];  // sort Y
            // })
            .attr('transform', transform)
            .select('.viewfield-scale');


        markers.selectAll('circle')
            .data([0])
            .enter()
            .append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('r', '15');

        const viewfields = markers.selectAll('.viewfield')
            .data(showViewfields ? [0] : []);

        viewfields.exit()
            .remove();

    }


    // draws the actual images
    // create your onw css for this
    function drawPhotos(selection) {
        console.log('drawPhotos fn called');

        // const enabled = svgMapillaryImages.enabled;
        // const enabled = _enabled;
        const enabled = true;
        const fileList = _fileList;


        // creates a layer if doesn't exist
        layer = selection.selectAll('.layer-local-photos')
            .data(fileList ? [0] : []);

        layer.exit()
            .remove();

        const layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-local-photos')
            .style('display', enabled ? 'block' : 'none');

        layerEnter
            .append('g')
            .attr('class', 'markers');

        layer = layerEnter
            .merge(layer);

        // if (enabled) {
        //     if (~~context.map().zoom() >= minZoom) {
        //         editOn();
        //         update();
        //         // service.loadImages(projection);
        //     } else {
        //         editOff();
        //     }
        // }

        if (_fileList) {
            editOn();
            update();
        } else {
            editOff();
        }
    }


    // drawImages.enabled = function(_) {
    //     if (!arguments.length) return svgMapillaryImages.enabled;
    //     svgMapillaryImages.enabled = _;
    //     if (svgMapillaryImages.enabled) {
    //         showLayer();
    //         context.photos().on('change.mapillary_images', update);
    //     } else {
    //         hideLayer();
    //         context.photos().on('change.mapillary_images', null);
    //     }
    //     dispatch.call('change');
    //     return this;
    // };

    // new
    // use this since using global value
    // slightly modified for photos
    drawPhotos.enabled = function(val) {
        console.log('drawPhotos.enabled called');
        if (!arguments.length) return _enabled;

        _enabled = val;
        if (_enabled) {
            showLayer();
            // context.photos().on('change.mapillary_images', update);
            context.photos().on('change.', update);
        } else {
            hideLayer();
            // context.photos().on('change.mapillary_images', null);
            context.photos().on('change.', null);
        }

        dispatch.call('change');
        return this;
    };

    function extract_exif(image) {
        var reader = new FileReader();

        reader.onload = function () {
            exifr.parse(image)
                 .then(output => console.log('Image parsed', output));
        };

        reader.readAsText(image);
    }

    // Step 2
    // this is where the exif parsing library comes into play
    // get all info from the image
    // drawPhotos.setFile = function(extension, data) {
    // drawPhotos.setFile = function(fileList) {
    drawPhotos.setFile = function(file) {
        console.log('drawPhotos.setFile called');
        // _fileList = null;

        // fileList.forEach(image =>
        //    extract_exif(image)
        //      .then(console.log('All images parsed successfully'))
        //      .catch(err => console.log(err))
        // );

        extract_exif(file);

        dispatch.call('change');
        return this;
    };

    // Step 1: entry point
    drawPhotos.fileList = function(fileList) {
        console.log('drawPhotos.fileList called');
        console.log('Step 2: fileList read', fileList);
        if (!arguments.length) return _fileList;

        _fileList = fileList;

        if (!fileList || !fileList.length) return this;
        // its just fetching one entry
        // fetch all for local photos
        // probablay a promise is required
        var f = fileList[0];
        drawPhotos.setFile(f);

        // var reader = new FileReader();
        // reader.onload = (function() {
        //     return function(e) {
        //         // Step 2
        //         drawPhotos.setFile(extension, e.target.result);
        //     };
        // })(f);

        return this;
    };

    // TODO: later
    // new
    // when all photos are uploaded, zoom to see them all
    drawPhotos.fitZoom = function() {
        console.log('drawPhotos.fitZoom called');
        // var features = getFeatures(_geojson);
        // if (!features.length) return;

        var map = context.map();
        var viewport = map.trimmedExtent().polygon();
        // features is not defined
        // var coords = features.reduce(function(coords) {
        //     var geom = feature.geometry;
        //     if (!geom) return coords;

        //     var c = geom.coordinates;

        //     /* eslint-disable no-fallthrough */
        //     switch (geom.type) {
        //         case 'Point':
        //             c = [c];
        //         case 'MultiPoint':
        //         case 'LineString':
        //             break;

        //         case 'MultiPolygon':
        //             // c = utilArrayFlatten(c);
        //         case 'Polygon':
        //         case 'MultiLineString':
        //             // c = utilArrayFlatten(c);
        //             break;
        //     }
        //     /* eslint-enable no-fallthrough */

        //     return utilArrayUnion(coords, c);
        // }, []);

        // if (!geoPolygonIntersectsPolygon(viewport, coords, true)) {
        //     var extent = geoExtent(d3_geoBounds({ type: 'LineString', coordinates: coords }));
        //     map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
        // }

        return this;
    };

    // TODO: later
    drawPhotos.supported = function() {
        console.log('drawPhotos.supported called');
        // return !!getService();
    };


    init();
    return drawPhotos;
}
