import { dispatch as d3_dispatch } from 'd3-dispatch';
import { zoom as d3_zoom, zoomIdentity as d3_zoomIdentity } from 'd3-zoom';
import { utilSetTransform, utilRebind } from '../util';


export async function planePhotoFrame(context, selection) {
    const dispatch = d3_dispatch('viewerChanged');

    const module = {};
    module.event = utilRebind(module, dispatch, 'on');

    let _photo;
    let _imageWrapper;
    let _planeWrapper;
    let _viewerDimensions = [];
    let _photoDimensions = [];
    const _imgZoom = d3_zoom()
        .on('zoom', zoomPan)
        .on('start', () => _imageWrapper.classed('grabbing', true))
        .on('end', () => _imageWrapper.classed('grabbing', false));

    function zoomPan(d3_event) {
        let t = d3_event.transform;
        _imageWrapper.call(utilSetTransform, t.x, t.y, t.k);
    }

    function loadImage(selection, path) {
        return new Promise((resolve) => {
            selection.attr('src', path);
            selection.on('load', () => {
                resolve(selection);
            });
        });
    }

    function updateTransform() {
        const xScale = _viewerDimensions[0] / _photoDimensions[0];
        const yScale = _viewerDimensions[1] / _photoDimensions[1];
        const fitScale = Math.max(xScale, yScale);
        const minScale = Math.min(xScale, yScale);
        _imgZoom
            .extent([[0, 0], _viewerDimensions])
            .translateExtent([[0, 0], _photoDimensions])
            .scaleExtent([minScale, 4]);
        const centerOffset = [0, 0];
        if (xScale < yScale) {
            centerOffset[0] = (_viewerDimensions[0] / fitScale - _photoDimensions[0]) / 2;
        } else {
            centerOffset[1] = (_viewerDimensions[1] / fitScale - _photoDimensions[1]) / 2;
        }
        const transform = d3_zoomIdentity.scale(fitScale).translate(centerOffset[0], centerOffset[1]);
        _planeWrapper.call(_imgZoom.transform, transform);
    }

    _planeWrapper = selection;
    _planeWrapper.call(_imgZoom);

    _imageWrapper = _planeWrapper
      .append('div')
      .attr('class', 'photo-frame plane-frame')
      .classed('hide', true);

    _photo = _imageWrapper
      .append('img')
      .attr('class', 'plane-photo');

    context.ui().photoviewer.on('resize.plane', function(dimensions) {
      _viewerDimensions = dimensions;
      updateTransform();
    });

    await Promise.resolve();

    /**
     * Shows the photo frame if hidden
     * @param {*} selection the HTML wrap of the frame
     */
    module.showPhotoFrame = function(selection) {
        const isHidden = selection.selectAll('.photo-frame.plane-frame.hide').size();

        if (isHidden) {
            selection
                .selectAll('.photo-frame:not(.plane-frame)')
                .classed('hide', true);

            selection
                .selectAll('.photo-frame.plane-frame')
                .classed('hide', false);
        }

        // set initial viewer size
        _viewerDimensions = context.ui().photoviewer.viewerSize();
        updateTransform();

        return module;
    };

    /**
     * Hides the photo frame if shown
     * @param {*} context the HTML wrap of the frame
     */
    module.hidePhotoFrame = function(context) {
        context
            .select('photo-frame.plane-frame')
            .classed('hide', false);

        return module;
    };

    /**
     * Renders an image inside the frame
     * @param {*} data the image data, it should contain an image_path attribute, a link to the actual image.
     */
    module.selectPhoto = function(data) {
        dispatch.call('viewerChanged');

        loadImage(_photo, '');
        _planeWrapper.classed('show-loader', true);
        loadImage(_photo, data.image_path)
            .then(selection => {
                _planeWrapper.classed('show-loader', false);
                const { naturalWidth, naturalHeight } = selection.node();
                _photoDimensions = [naturalWidth, naturalHeight];
                updateTransform();
            });
        return module;
    };

    module.getYaw = function() {
        return 0;
    };

    return module;
};
