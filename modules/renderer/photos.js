import { dispatch as d3_dispatch } from 'd3-dispatch';

import { services } from '../services';
import { utilRebind } from '../util/rebind';
import { utilQsString, utilStringQs } from '../util';


export function rendererPhotos(context) {
    var dispatch = d3_dispatch('change');
    var _layerIDs = ['streetside', 'mapillary', 'mapillary-map-features', 'mapillary-signs', 'kartaview'];
    var _allPhotoTypes = ['flat', 'panoramic'];
    var _shownPhotoTypes = _allPhotoTypes.slice();   // shallow copy
    var _dateFilters = ['fromDate', 'toDate'];
    var _fromDate;
    var _toDate;
    var _usernames;

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

    photos.dateFilters = function() {
        return _dateFilters;
    };

    photos.dateFilterValue = function(val) {
        return val === _dateFilters[0] ? _fromDate : _toDate;
    };

    photos.setDateFilter = function(type, val, updateUrl) {
        // validate the date
        var date = val && new Date(val);
        if (date && !isNaN(date)) {
            val = date.toISOString().slice(0, 10);
        } else {
            val = null;
        }
        if (type === _dateFilters[0]) {
            _fromDate = val;
            if (_fromDate && _toDate && new Date(_toDate) < new Date(_fromDate)) {
                _toDate = _fromDate;
            }
        }
        if (type === _dateFilters[1]) {
            _toDate = val;
            if (_fromDate && _toDate && new Date(_toDate) < new Date(_fromDate)) {
                _fromDate = _toDate;
            }
        }
        dispatch.call('change', this);
        if (updateUrl) {
            var rangeString;
            if (_fromDate || _toDate) {
                rangeString = (_fromDate || '') + '_' + (_toDate || '');
            }
            setUrlFilterValue('photo_dates', rangeString);
        }
    };

    photos.setUsernameFilter = function(val, updateUrl) {
        if (val && typeof val === 'string') val = val.replace(/;/g, ',').split(',');
        if (val) {
            val = val.map(d => d.trim()).filter(Boolean);
            if (!val.length) {
                val = null;
            }
        }
        _usernames = val;
        dispatch.call('change', this);
        if (updateUrl) {
            var hashString;
            if (_usernames) {
                hashString = _usernames.join(',');
            }
            setUrlFilterValue('photo_username', hashString);
        }
    };

    function setUrlFilterValue(property, val) {
        if (!window.mocha) {
            var hash = utilStringQs(window.location.hash);
            if (val) {
                if (hash[property] === val) return;
                hash[property] = val;
            } else {
                if (!(property in hash)) return;
                delete hash[property];
            }
            window.location.replace('#' + utilQsString(hash, true));
        }
    }

    function showsLayer(id) {
        var layer = context.layers().layer(id);
        return layer && layer.supported() && layer.enabled();
    }

    photos.shouldFilterByDate = function() {
        return showsLayer('mapillary') || showsLayer('kartaview') || showsLayer('streetside');
    };

    photos.shouldFilterByPhotoType = function() {
        return showsLayer('mapillary') ||
            (showsLayer('streetside') && showsLayer('kartaview'));
    };

    photos.shouldFilterByUsername = function() {
        return !showsLayer('mapillary') && showsLayer('kartaview') && !showsLayer('streetside');
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

    photos.fromDate = function() {
        return _fromDate;
    };

    photos.toDate = function() {
        return _toDate;
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

    photos.usernames = function() {
        return _usernames;
    };

    photos.init = function() {
        var hash = utilStringQs(window.location.hash);
        if (hash.photo_dates) {
            // expect format like `photo_dates=2019-01-01_2020-12-31`, but allow a couple different separators
            var parts = /^(.*)[–_](.*)$/g.exec(hash.photo_dates.trim());
            this.setDateFilter('fromDate', parts && parts.length >= 2 && parts[1], false);
            this.setDateFilter('toDate', parts && parts.length >= 3 && parts[2], false);
        }
        if (hash.photo_username) {
            this.setUsernameFilter(hash.photo_username, false);
        }
        if (hash.photo_overlay) {
            // support enabling photo layers by default via a URL parameter, e.g. `photo_overlay=kartaview;mapillary;streetside`
            var hashOverlayIDs = hash.photo_overlay.replace(/;/g, ',').split(',');
            hashOverlayIDs.forEach(function(id) {
                if (id === 'openstreetcam') id = 'kartaview'; // legacy alias
                var layer = _layerIDs.indexOf(id) !== -1 && context.layers().layer(id);
                if (layer && !layer.enabled()) layer.enabled(true);
            });
        }
        if (hash.photo) {
            // support opening a photo via a URL parameter, e.g. `photo=mapillary-fztgSDtLpa08ohPZFZjeRQ`
            var photoIds = hash.photo.replace(/;/g, ',').split(',');
            var photoId = photoIds.length && photoIds[0].trim();
            var results = /(.*)\/(.*)/g.exec(photoId);
            if (results && results.length >= 3) {
                var serviceId = results[1];
                if (serviceId === 'openstreetcam') serviceId = 'kartaview'; // legacy alias
                var photoKey = results[2];
                var service = services[serviceId];
                if (service && service.ensureViewerLoaded) {

                    // if we're showing a photo then make sure its layer is enabled too
                    var layer = _layerIDs.indexOf(serviceId) !== -1 && context.layers().layer(serviceId);
                    if (layer && !layer.enabled()) layer.enabled(true);

                    var baselineTime = Date.now();

                    service.on('loadedImages.rendererPhotos', function() {
                        // don't open the viewer if too much time has elapsed
                        if (Date.now() - baselineTime > 45000) {
                            service.on('loadedImages.rendererPhotos', null);
                            return;
                        }

                        if (!service.cachedImage(photoKey)) return;

                        service.on('loadedImages.rendererPhotos', null);
                        service.ensureViewerLoaded(context)
                            .then(function() {
                                service
                                    .selectImage(context, photoKey)
                                    .showViewer(context);
                            });
                    });
                }
            }
        }

        context.layers().on('change.rendererPhotos', updateStorage);
    };

    return utilRebind(photos, dispatch, 'on');
}
