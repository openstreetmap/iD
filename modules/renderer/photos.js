import _clone from 'lodash-es/clone';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import { utilRebind } from '../util/rebind';


export function rendererPhotos(context) {

    var dispatch = d3_dispatch('change');

    var _allPhotoTypes = ['flat', 'panoramic'];
    var _shownPhotoTypes = _clone(_allPhotoTypes);

    function photos() {}

    photos.allPhotoTypes = function() {
        return _allPhotoTypes;
    };

    function showsLayer(id) {
        var layer = context.layers().layer(id);
        return layer && layer.supported() && layer.enabled();
    }

    photos.shouldFilterByPhotoType = function() {
        return showsLayer('mapillary-images') ||
            (showsLayer('streetside') && showsLayer('openstreetcam-images'));
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

    return utilRebind(photos, dispatch, 'on');
}
