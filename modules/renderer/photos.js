import { dispatch as d3_dispatch } from 'd3-dispatch';

import { services } from '../services';
import { utilRebind } from '../util/rebind';
import { utilQsString, utilStringQs } from '../util';


export function rendererPhotos(context) {
    var dispatch = d3_dispatch('change');
    var _layerIDs = ['streetside', 'mapillary', 'mapillary-map-features', 'mapillary-signs', 'kartaview', 'mapilio', 'vegbilder', 'panoramax'];
    var _allPhotoTypes = ['flat', 'panoramic'];
    var _shownPhotoTypes = _allPhotoTypes.slice();   // shallow copy
    var _dateFilters = ['fromDate', 'toDate'];
    var _fromDate;
    var _toDate;
    var _yearSliderValue;
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

    /**
     * @returns The layer ID
     */
    photos.overlayLayerIDs = function() {
        return _layerIDs;
    };

    /**
     * @returns All the photo types
     */
    photos.allPhotoTypes = function() {
        return _allPhotoTypes;
    };

    /**
     * @returns The date filters value
     */
    photos.dateFilters = function() {
        return _dateFilters;
    };

    /**
     * @returns The year date filter value
     */
    photos.yearSliderValue = function() {
        return _yearSliderValue;
    };

    photos.dateFilterValue = function(val) {
        return val === _dateFilters[0] ? _fromDate : _toDate;
    };

    /**
     * Sets the date filter (min/max date)
     * @param {*} type Either 'fromDate' or 'toDate'
     * @param {*} val The actual Date
     * @param {boolean} updateUrl Whether the URL should update or not
     */
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

    /**
     * Sets the username filter
     * @param {string} val The username
     * @param {boolean} updateUrl Whether the URL should update or not
     */
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

    /**
     * Util function to set the slider date filter
     * @param {*} year The slider value
     * @param {boolean} updateUrl whether the URL should update or not
     */
    photos.setFromYearFilter = function(year, updateUrl){

        _yearSliderValue = year;

        if (year !== '5') {
            let days = 365 * year;
            var fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - days);
            var dd = String(fromDate.getDate()).padStart(2, '0');
            var mm = String(fromDate.getMonth() + 1).padStart(2, '0');
            var yyyy = fromDate.getFullYear();

            fromDate = mm + '/' + dd + '/' + yyyy;
            photos.setDateFilter('fromDate', fromDate, updateUrl);
        } else {
            photos.setDateFilter('fromDate', null, updateUrl);
        }

        if (updateUrl) {
            setUrlFilterValue('year_slider', year);
        }
    };

    /**
     * Util function to set the slider date filter
     * @param {*} val Either 'panoramic' or 'flat'
     * @param {boolean} updateUrl Whether the URL should update or not
     */
    photos.togglePhotoType = function(val, updateUrl) {
        var index = _shownPhotoTypes.indexOf(val);
        if (index !== -1) {
            _shownPhotoTypes.splice(index, 1);
        } else {
            _shownPhotoTypes.push(val);
        }

        if (updateUrl) {
            var hashString;
            if (_shownPhotoTypes) {
                hashString = _shownPhotoTypes.join(',');
            }
            setUrlFilterValue('photo_type', hashString);
        }

        dispatch.call('change', this);
        return photos;
    };

    /**
     * Updates the URL with new values
     * @param {*} val value to save
     * @param {string} property Name of the value
     */
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

    /**
     * @returns If the Date filter should be drawn
     */
    photos.shouldFilterByDate = function() {
        return false;
    };

    /**
     * @returns If the Date Slider filter should be drawn
     */
    photos.shouldFilterDateBySlider = function(){
        return showsLayer('mapillary') || showsLayer('kartaview') || showsLayer('mapilio')
        || showsLayer('streetside') || showsLayer('vegbilder') || showsLayer('panoramax');
    };

    /**
     * @returns If the Photo Type filter should be drawn
     */
    photos.shouldFilterByPhotoType = function() {
        return showsLayer('mapillary') ||
            (showsLayer('streetside') && showsLayer('kartaview')) || showsLayer('vegbilder') || showsLayer('panoramax');
    };

    /**
     * @returns If the Username filter should be drawn
     */
    photos.shouldFilterByUsername = function() {
        return !showsLayer('mapillary') && showsLayer('kartaview') && !showsLayer('streetside') || showsLayer('panoramax');
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

    photos.usernames = function() {
        return _usernames;
    };

    /**
     * Inits the streetlevel layer given the saved values in the URL
     */
    photos.init = function() {
        var hash = utilStringQs(window.location.hash);
        var parts;
        if (hash.photo_dates) {
            // expect format like `photo_dates=2019-01-01_2020-12-31`, but allow a couple different separators
            parts = /^(.*)[–_](.*)$/g.exec(hash.photo_dates.trim());
            this.setDateFilter('fromDate', parts && parts.length >= 2 && parts[1], false);
            this.setDateFilter('toDate', parts && parts.length >= 3 && parts[2], false);
        }
        if (hash.year_slider){
            this.setFromYearFilter(hash.year_slider, false);
        }
        if (hash.photo_username) {
            this.setUsernameFilter(hash.photo_username, false);
        }
        if (hash.photo_type) {
            parts = hash.photo_type.replace(/;/g, ',').split(',');
            _allPhotoTypes.forEach(d => {
                if (!parts.includes(d)) this.togglePhotoType(d, false);
            });
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
