import _throttle from 'lodash-es/throttle';

import { utilDetect } from '../util/detect';
import { select as d3_select } from 'd3-selection';
import { svgPath, svgPointTransform } from './helpers';
// Modern Node.js can import CommonJS
import exifr from 'exifr'; // => exifr/dist/full.umd.cjs

var _initialized = false;

export function svgLocalPhotos(projection, context, dispatch) {
    const throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var detected = utilDetect();
    let layer = d3_select(null);
    var _fileList;
    var _imageList= [];

    function init() {
        if (_initialized) return;  // run once

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
    function click(d3_event, image) {
        // removes old div(s), if any
        closePhotoViewer();

        var image_container = d3_select('.over-map')
                              .append('div')
                              .attr('style', 'position: relative;margin: 5px;border: 5px solid white;')
                              .attr('class', 'local-photo-viewer');

        var close_button = image_container
                           .append('button')
                           .text('X')
                           .on('click', function(d3_event) {
                                d3_event.preventDefault();
                                closePhotoViewer();
                            })
                           .attr('style', 'position: absolute;right: 0;padding: 3px 10px;font-size: medium;border-radius:0;');

        var myimage = image_container
                      .append('img')
                      .attr('src', image.src)
                      .attr('width', 400)
                      .attr('height', 300);


        // centers the map with image location
        context.map().centerEase(image.loc);
    }


    function transform(d) {
        // projection expects [long, lat]
        var svgpoint = projection(d.loc);
        return 'translate(' + svgpoint[0] + ',' + svgpoint[1] + ')';
    }

    // puts the image markers on the map
    function display_markers(imageList) {
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
            .data(_fileList ? [0] : []);

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

         // if (_imageList.length !== 0) {
         // if (_fileList && _fileList.length !== 0) {
         if (_imageList && _imageList.length !== 0) {
            display_markers(_imageList);
        }
    }


    /**
     * Reads and parses files
     * @param {Array<object>} arrayFiles - Holds array of file - [file_1, file_2, ...]
     */
    async function readmultifiles(arrayFiles) {
        const filePromises = arrayFiles.map((file, i) => {
            // Return a promise per file
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                // converts image to base64
                reader.readAsDataURL(file);

                reader.onload = async () => {
                    try {
                        const response = await exifr.parse(file)
                         .then(output => {

                             _imageList.push(
                                {
                                  id: i,
                                  name: file.name,
                                  src: reader.result,
                                  loc: [output.longitude, output.latitude]
                                }
                             );
                         });
                        // Resolve the promise with the response value
                        resolve(response);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = (error) => {
                    reject(error);
                };

            });
        });

        // Wait for all promises to be resolved
        const fileInfos = await Promise.all(filePromises);
        dispatch.call('change');
    };

    drawPhotos.setFile = function(fileList) {
        /**
         * Holds array of file - [file_1, file_2, ...]
         * file_1 = {name: "Das.png", lastModified: 1625064498536, lastModifiedDate: Wed Jun 30 2021 20:18:18 GMT+0530 (India Standard Time), webkitRelativePath: "", size: 859658, …}
         * @type {Array<object>}
         */
        var arrayFiles = Object.keys(fileList).map(function(k) { return fileList[k]; });

        // read and parse asynchronously
        readmultifiles(arrayFiles);

        dispatch.call('change');
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

        return this;
    };

    // TODO: when all photos are uploaded, zoom to see them all
    // drawPhotos.fitZoom = function() {
    // };

    init();
    return drawPhotos;
}
