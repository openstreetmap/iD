import { dispatch as d3_dispatch } from 'd3-dispatch';

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
                var layer = context.layers().layer(id);
                if (layer) layer.enabled(true);
            });
        }

        context.layers().on('change.rendererPhotos', updateStorage);
    };

    return utilRebind(photos, dispatch, 'on');
}
