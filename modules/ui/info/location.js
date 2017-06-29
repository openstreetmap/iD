import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';
import { services } from '../../services';


export function uiPanelLocation(context) {
    var lastLocation = '';
    var debouncedUpdate = _.debounce(updateLocation, 250);
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
        if (coord.some(isNaN)) {
            coord = context.map().center();
        }

        var coordStr =
            clamp(coord[1], -90, 90).toFixed(OSM_PRECISION) + ', ' +
            wrap(coord[0], -180, 180).toFixed(OSM_PRECISION);

        list
            .append('li')
            .text(coordStr);

        // Location Name
        if (services.geocoder) {
            selection
                .append('p')
                .attr('class', 'location-name')
                .text(lastLocation);

            debouncedUpdate(selection, coord);
        }
    }


    function updateLocation(selection, coord) {
        if (!services.geocoder) return;
        services.geocoder.reverse(coord, function(err, result) {
            if (result) {
                lastLocation = result.display_name;
                selection.selectAll('.location-name')
                    .text(lastLocation);
            }
        });
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
    panel.title = t('infobox.location.title');
    panel.key = t('infobox.location.key');


    return panel;
}
