import { select as d3_select } from 'd3-selection';
import exifr from 'exifr';

import { utilDetect } from '../util/detect';
import { geoExtent } from '../geo';
import { isArray, isNumber } from 'lodash-es';

var _initialized = false;
var _enabled = false;

export function svgLocalPhotos(projection, context, dispatch) {
    var detected = utilDetect();
    let layer = d3_select(null);
    var _fileList;
    var _photos = [];
    var _idAutoinc = 0;

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

    function closePhotoViewer() {
        d3_select('.over-map').selectAll('.local-photo-viewer').remove();
    }

    // opens the image at bottom left
    function click(d3_event, image, zoomTo) {
        // removes old div(s), if any
        closePhotoViewer();

        var image_container = d3_select('.over-map')
            .append('div')
            .attr('style', 'position: relative;margin: 5px;border: 5px solid white;')
            .attr('class', 'local-photo-viewer');

        image_container
            .append('button')
            .text('X')
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                closePhotoViewer();
            })
            .attr('style', 'position: absolute;right: 0;padding: 3px 10px;font-size: medium;border-radius:0;');

        image_container
            .append('img')
            .attr('src', image.src)
            .attr('width', 400)
            .attr('height', 300);


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
            .attr('r', '20')
            .attr('fill', 'red');

        const viewfields = markers.selectAll('.viewfield')
            .data([0]);

        viewfields.exit()
            .remove();

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
                                loc: [output.longitude, output.latitude]
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
