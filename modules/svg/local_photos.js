import { select as d3_select } from 'd3-selection';
import exifr from 'exifr';
import { isArray, isNumber } from 'lodash-es';

import { utilDetect } from '../util/detect';
import { geoExtent } from '../geo';
import planePhotoFrame from '../services/plane_photo';

var _initialized = false;
var _enabled = false;
const minViewfieldZoom = 16;

export function svgLocalPhotos(projection, context, dispatch) {
    const detected = utilDetect();
    let layer = d3_select(null);
    let _fileList;
    let _photos = [];
    let _idAutoinc = 0;
    let _photoFrame;

    function init() {
        if (_initialized) return;  // run once

        _enabled = true;

        function over(d3_event) {
            d3_event.stopPropagation();
            d3_event.preventDefault();
            d3_event.dataTransfer.dropEffect = 'copy';
        }

        context.container()
            .attr('dropzone', 'copy')
            .on('drop.svgLocalPhotos', function(d3_event) {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                if (!detected.filedrop) return;
                drawPhotos.fileList(d3_event.dataTransfer.files);
            })
            .on('dragenter.svgLocalPhotos', over)
            .on('dragexit.svgLocalPhotos', over)
            .on('dragover.svgLocalPhotos', over);

        _initialized = true;
    }

   function ensureViewerLoaded(context) {
        if (_photoFrame) {
            return Promise.resolve(_photoFrame);
        }

        const viewer = context.container().select('.photoviewer')
            .selectAll('.local-photos-wrapper')
            .data([0]);

        const viewerEnter = viewer.enter()
            .append('div')
            .attr('class', 'photo-wrapper local-photos-wrapper')
            .classed('hide', true);

        viewerEnter
            .append('div')
            .attr('class', 'photo-attribution fillD');

        return planePhotoFrame.init(context, viewerEnter)
            .then(planePhotoFrame => {
                _photoFrame = planePhotoFrame;
                //_photoFrame.event.on('viewerChanged', () => …);
            });
    }

    function closePhotoViewer() {
        const viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(null);

        viewer
            .classed('hide', true)
            .selectAll('.photo-wrapper')
            .classed('hide', true);
    }

    // opens the image at bottom left
    function click(d3_event, image, zoomTo) {
        ensureViewerLoaded(context).then(() => {
            const viewer = context.container().select('.photoviewer')
                .classed('hide', false);

            const viewerWrap = viewer.select('.local-photos-wrapper')
                .classed('hide', false);

            const attribution = viewerWrap.selectAll('.photo-attribution').text('');

            if (image.name) {
                attribution
                    .append('span')
                    .classed('filename', true)
                    .text(image.name);
            }

            _photoFrame
                .selectPhoto({ image_path: image.src }, false)
                .showPhotoFrame(viewerWrap);
        });

        // centers the map with image location
        if (zoomTo) {
            context.map().centerEase(image.loc);
        }
    }


    function transform(d) {
        // projection expects [long, lat]
        var svgpoint = projection(d.loc);
        return 'translate(' + svgpoint[0] + ',' + svgpoint[1] + ')';
    }

    // puts the image markers on the map
    function display_markers(imageList) {
        imageList = imageList.filter(image => isArray(image.loc) && isNumber(image.loc[0]) && isNumber(image.loc[1]));
        const groups = layer.selectAll('.markers').selectAll('.viewfield-group')
            .data(imageList, function(d) { return d.id; });

        // exit
        groups.exit()
            .remove();

        // enter
        const groupsEnter = groups.enter()
            .append('g')
            .attr('class', 'viewfield-group')
            .on('click', click);

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

        const showViewfields = context.map().zoom() >= minViewfieldZoom;

        const viewfields = markers.selectAll('.viewfield')
            .data(showViewfields ? [0] : []);

        viewfields.exit()
            .remove();

        // viewfields may or may not be drawn...
        // but if they are, draw below the circles
        viewfields.enter()
            .insert('path', 'circle')
            .attr('class', 'viewfield')
            .attr('transform', function() {
                const d = this.parentNode.__data__;
                return `rotate(${Math.round(d.direction ?? 0)},0,0),scale(1.5,1.5),translate(-8, -13)`;
            })
            .attr('d', 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z')
            .style('visibility', function() {
                const d = this.parentNode.__data__;
                return isNumber(d.direction) ? 'visible' : 'hidden';
            });
    }

    function drawPhotos(selection) {
        layer = selection.selectAll('.layer-local-photos')
            .data(_photos ? [0] : []);

        layer.exit()
            .remove();

        const layerEnter = layer.enter()
            .append('g')
            .attr('class', 'layer-local-photos');

        layerEnter
            .append('g')
            .attr('class', 'markers');

        layer = layerEnter
            .merge(layer);

        if (_photos && _photos.length !== 0) {
            display_markers(_photos);
        }
    }


    /**
     * Reads and parses files
     * @param {Array<object>} files - Holds array of file - [file_1, file_2, ...]
     */
    async function readmultifiles(files) {
        const filePromises = files.map(file => {
            // Return a promise per file
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                // converts image to base64
                reader.readAsDataURL(file);

                reader.onload = async () => {
                    try {
                        const response = await exifr.parse(file)
                        .then(output => {
                            if (_photos.find(i => i.name === file.name && i.src === reader.result)) {
                                // skip if already loaded photos
                                return;
                            }
                            _photos.push({
                                id: _idAutoinc++,
                                name: file.name,
                                src: reader.result,
                                loc: [output.longitude, output.latitude],
                                direction: output.GPSImgDirection
                            });
                        });
                        // Resolve the promise with the response value
                        resolve(response);
                    } catch (err) {
                        console.error(err); // eslint-disable-line no-console
                        reject(err);
                    }
                };
                reader.onerror = (error) => {
                    console.error(err); // eslint-disable-line no-console
                    reject(error);
                };

            });
        });

        // Wait for all promises to be resolved
        await Promise.allSettled(filePromises);
        _photos = _photos.sort((a, b) => a.id - b.id);
        dispatch.call('change');
    }

    drawPhotos.setFile = function(fileList) {
        // read and parse asynchronously
        readmultifiles(Array.from(fileList));
        return this;
    };

    // Step 1: entry point
    /**
     * Sets the fileList
     * @param {Object} fileList - The uploaded files. fileList is an object, not an array object
     * @param {Object} fileList.0 - A File - {name: "Das.png", lastModified: 1625064498536, lastModifiedDate: Wed Jun 30 2021 20:18:18 GMT+0530 (India Standard Time), webkitRelativePath: "", size: 859658, …}
     */
    drawPhotos.fileList = function(fileList) {
        if (!arguments.length) return _fileList;

        _fileList = fileList;

        if (!fileList || !fileList.length) return this;

        drawPhotos.setFile(_fileList);

        // TODO: when all photos are uploaded, zoom to see them all
        return this;
    };

    drawPhotos.getPhotos = function() {
        return _photos;
    };

    drawPhotos.removePhoto = function(id) {
        _photos = _photos.filter(i => i.id !== id);
        dispatch.call('change');
        return _photos;
    };

    drawPhotos.openPhoto = click;

    drawPhotos.fitZoom = function() {
        let extent = _photos
            .map(image => image.loc)
            .filter(l => isArray(l) && isNumber(l[0]) && isNumber(l[1]))
            .map(l => geoExtent(l, l))
            .reduce((a, b) => a.extend(b));

        const map = context.map();
        map.centerZoom(extent.center(), Math.min(18, map.trimmedExtentZoom(extent)));
    };

    function showLayer() {
        layer.style('display', 'block');

        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });
    }


    function hideLayer() {
        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end', () => {
                layer.selectAll('.viewfield-group').remove();
                layer.style('display', 'none');
            });
    }

    drawPhotos.enabled = function(val) {
        if (!arguments.length) return _enabled;

        _enabled = val;
        if (_enabled) {
            showLayer();
        } else {
            hideLayer();
        }

        dispatch.call('change');
        return this;
    };

    drawPhotos.hasData = function() {
        return isArray(_photos) && _photos.length > 0;
    };


    init();
    return drawPhotos;
}
