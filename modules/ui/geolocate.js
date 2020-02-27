import { select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { geoExtent } from '../geo';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';
import { uiLoading } from './loading';
import { uiTooltipHtml } from './tooltipHtml';

export function uiGeolocate(context) {
    var geoOptions = { enableHighAccuracy: false, timeout: 6000 /* 6sec */ };
    var locating = uiLoading(context).message(t('geolocate.locating')).blocking(true);
    var layer = context.layers().layer('geolocate');
    var _position;
    var _extent;
    var _timeoutID;
    var _button = d3_select(null);

    function click() {
        if (context.inIntro()) return;
        context.enter(modeBrowse(context));
        if (!layer.enabled()) {
            if (!_position) {
                context.container().call(locating);
                navigator.geolocation.getCurrentPosition(success, error, geoOptions);
            } else {
                zoomTo();
            }
        } else {
            layer.enabled(null, false);
            updateButtonState();
        }
        // This timeout ensures that we still call finish() even if
        // the user declines to share their location in Firefox
        _timeoutID = setTimeout(finish, 10000 /* 10sec */ );
    }

    function zoomTo() {
        var map = context.map();
        layer.enabled(_position, true);
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
        finish();
    }

    function finish() {
        locating.close();  // unblock ui
        if (_timeoutID) { clearTimeout(_timeoutID); }
        _timeoutID = undefined;
    }

    function updateButtonState() {
        _button.classed('active', layer.enabled());
    }

    return function(selection) {
        if (!navigator.geolocation) return;

        _button = selection
            .append('button')
            .on('click', click)
            .call(svgIcon('#iD-icon-geolocate', 'light'))
            .call(tooltip()
                .placement((textDirection === 'rtl') ? 'right' : 'left')
                .html(true)
                .title(uiTooltipHtml(t('geolocate.title'), t('geolocate.key')))
            );

        context.keybinding().on(t('geolocate.key'), click);
    };
}
