import * as d3 from 'd3';
import { t } from '../../util/locale';


export function uiInfoLocation(context) {
    var OSM_PRECISION = 7;

    function wrap(x, min, max) {
        var d = max - min;
        return ((x - min) % d + d) % d + min;
    }

    function clamp(x, min, max) {
        return Math.max(min, Math.min(x, max));
    }


    function redraw(selection) {
        if (d3.selectAll('.infobox.hide').size()) return;   // infobox is hidden

        selection.html('');

        var list = selection
            .append('ul');

        // Mouse coordinates
        var coord = context.map().mouseCoordinates();
        var coordStr =
            clamp(coord[1], -90, 90).toFixed(OSM_PRECISION) + ', ' +
            wrap(coord[0], -180, 180).toFixed(OSM_PRECISION);

        list
            .append('li')
            .text(t('infobox.location.pointer') + ': ' + coordStr);
    }


    var widget = function(selection) {
        selection.call(redraw);

        context.surface()
            .on('mousemove.info-location', function() {
                selection.call(redraw);
            });
    };

    widget.off = function() {
        context.surface()
            .on('mousemove.info-location', null);
    };

    widget.id = 'location';
    widget.title = t('infobox.location.title');
    widget.key = t('infobox.location.key');


    return widget;
}
