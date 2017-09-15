import _ from 'lodash';
import { t } from '../../util/locale';
import { services } from '../../services';


export function uiPanelLocation(context) {
    var currLocation = '';
    var OSM_PRECISION = 7;


    function wrap(x, min, max) {
        var d = max - min;
        return ((x - min) % d + d) % d + min;
    }


    function clamp(x, min, max) {
        return Math.max(min, Math.min(x, max));
    }


    function redraw(selection) {
        selection.html('');

        var list = selection
            .append('ul');

        // Mouse coordinates
        var coord = context.map().mouseCoordinates();
        if (coord.some(isNaN)) {
            coord = context.map().center();
        }

        var coordStr =
            clamp(coord[1], -90, 90).toFixed(OSM_PRECISION) + ', ' +
            wrap(coord[0], -180, 180).toFixed(OSM_PRECISION);

        list
            .append('li')
            .text(coordStr);

        // Location Info
        selection
            .append('div')
            .attr('class', 'location-info')
            .text(currLocation || ' ');

        debouncedGetLocation(selection, coord);
    }


    var debouncedGetLocation = _.debounce(getLocation, 250);
    function getLocation(selection, coord) {
        if (!services.geocoder) {
            currLocation = t('info_panels.location.unknown_location');
            selection.selectAll('.location-info')
                .text(currLocation);
        } else {
            services.geocoder.reverse(coord, function(err, result) {
                currLocation = result ? result.display_name : t('info_panels.location.unknown_location');
                selection.selectAll('.location-info')
                    .text(currLocation);
            });
        }
    }


    var panel = function(selection) {
        selection.call(redraw);

        context.surface()
            .on('mousemove.info-location', function() {
                selection.call(redraw);
            });
    };

    panel.off = function() {
        context.surface()
            .on('mousemove.info-location', null);
    };

    panel.id = 'location';
    panel.title = t('info_panels.location.title');
    panel.key = t('info_panels.location.key');


    return panel;
}
