import { dispatch as d3_dispatch } from 'd3-dispatch';

import { services } from '../services';
import { utilRebind } from '../util/rebind';
import { utilQsString, utilStringQs } from '../util';


export function rendererPhotos(context) {
    var dispatch = d3_dispatch('change');
    var _layerIDs = ['streetside', 'mapillary', 'mapillary-map-features', 'mapillary-signs', 'openstreetcam'];
    var _allPhotoTypes = ['flat', 'panoramic'];
    var _shownPhotoTypes = _allPhotoTypes.slice();   // shallow copy

    function photos() {}

    function updateStorage() {
        if (window.mocha) return;

        var hash = utilStringQs(window.location.hash);
        var enabled = context.layers().all().filter(function(d) {
            return _layerIDs.indexOf(d.id) !== -1 && d.layer && d.layer.supported() && d.layer.enabled();
        }).map(function(d) {
            return d.id;
        });
        if (enabled.length) {
            hash.photo_overlay = enabled.join(',');
        } else {
            delete hash.photo_overlay;
        }
        window.location.replace('#' + utilQsString(hash, true));
    }

    photos.overlayLayerIDs = function() {
        return _layerIDs;
    };

    photos.allPhotoTypes = function() {
        return _allPhotoTypes;
    };

    function showsLayer(id) {
        var layer = context.layers().layer(id);
        return layer && layer.supported() && layer.enabled();
    }

    photos.shouldFilterByPhotoType = function() {
        return showsLayer('mapillary') ||
            (showsLayer('streetside') && showsLayer('openstreetcam'));
    };

    photos.showsPhotoType = function(val) {
        if (!photos.shouldFilterByPhotoType()) return true;

        return _shownPhotoTypes.indexOf(val) !== -1;
    };

    photos.showsFlat = function() {
        return photos.showsPhotoType('flat');
    };

    photos.showsPanoramic = function() {
        return photos.showsPhotoType('panoramic');
    };

    photos.togglePhotoType = function(val) {
        var index = _shownPhotoTypes.indexOf(val);
        if (index !== -1) {
            _shownPhotoTypes.splice(index, 1);
        } else {
            _shownPhotoTypes.push(val);
        }
        dispatch.call('change', this);
        return photos;
    };

    photos.init = function() {
        var hash = utilStringQs(window.location.hash);
        if (hash.photo_overlay) {
            var hashOverlayIDs = hash.photo_overlay.replace(/;/g, ',').split(',');
            hashOverlayIDs.forEach(function(id) {
                var layer = _layerIDs.indexOf(id) !== -1 && context.layers().layer(id);
                if (layer && !layer.enabled()) layer.enabled(true);
            });
        }
        if (hash.photo) {
            var photoIds = hash.photo.replace(/;/g, ',').split(',');
            var photoId = photoIds.length && photoIds[0].trim();
            var results = /(.*)-(.*)/g.exec(photoId);
            if (results && results.length >= 3) {
                var serviceId = results[1];
                var photoKey = results[2];
                var service = services[serviceId];
                if (service && service.ensureViewerLoaded) {

                    // if we're showing a photo then make sure its layer is enabled too
                    var layer = _layerIDs.indexOf(serviceId) !== -1 && context.layers().layer(serviceId);
                    if (layer && !layer.enabled()) layer.enabled(true);

                    service.ensureViewerLoaded(context)
                        .then(function() {
                            service.updateViewer(context, photoKey);
                            service.showViewer(context);
                        });
                }
            }
        }

        context.layers().on('change.rendererPhotos', updateStorage);
    };

    return utilRebind(photos, dispatch, 'on');
}
