import { select as d3_select } from 'd3-selection';

import { t, localizer } from '../core/localizer';
import { uiTooltip } from './tooltip';
import { geoExtent } from '../geo';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';
import { uiLoading } from './loading';

export function uiGeolocate(context) {
    var _geolocationOptions = {
        // prioritize speed and power usage over precision
        enableHighAccuracy: false,
        // don't hang indefinitely getting the location
        timeout: 6000 // 6sec
    };
    var _locating = uiLoading(context).message(t.html('geolocate.locating')).blocking(true);
    var _layer = context.layers().layer('geolocate');
    var _position;
    var _extent;
    var _timeoutID;
    var _button = d3_select(null);

    function click() {
        if (context.inIntro()) return;
        if (!_layer.enabled() && !_locating.isShown()) {

            // This timeout ensures that we still call finish() even if
            // the user declines to share their location in Firefox
            _timeoutID = setTimeout(error, 10000 /* 10sec */ );

            context.container().call(_locating);
            // get the latest position even if we already have one
            navigator.geolocation.getCurrentPosition(success, error, _geolocationOptions);
        } else {
            _locating.close();
            _layer.enabled(null, false);
            updateButtonState();
        }
    }

    function zoomTo() {
        context.enter(modeBrowse(context));

        var map = context.map();
        _layer.enabled(_position, true);
        updateButtonState();
        map.centerZoomEase(_extent.center(), Math.min(20, map.extentZoom(_extent)));
    }

    function success(geolocation) {
        _position = geolocation;
        var coords = _position.coords;
        _extent = geoExtent([coords.longitude, coords.latitude]).padByMeters(coords.accuracy);
        zoomTo();
        finish();
    }

    function error() {
        if (_position) {
            // use the position from a previous call if we have one
            zoomTo();
        } else {
            context.ui().flash
                .label(t.append('geolocate.location_unavailable'))
                .iconName('#iD-icon-geolocate')();
        }

        finish();
    }

    function finish() {
        _locating.close();  // unblock ui
        if (_timeoutID) { clearTimeout(_timeoutID); }
        _timeoutID = undefined;
    }

    function updateButtonState() {
        _button.classed('active', _layer.enabled());
        _button.attr('aria-pressed', _layer.enabled());
    }

    return function(selection) {
        if (!navigator.geolocation || !navigator.geolocation.getCurrentPosition) return;

        _button = selection
            .append('button')
            .on('click', click)
            .attr('aria-pressed', false)
            .call(svgIcon('#iD-icon-geolocate', 'light'))
            .call(uiTooltip()
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
                .title(() => t.append('geolocate.title'))
                .keys([t('geolocate.key')])
            );

        context.keybinding().on(t('geolocate.key'), click);
    };
}
