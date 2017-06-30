import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';
import { services } from '../../services';


export function uiPanelLocation(context) {
    var lastLocation = '';
    var lastImagery = '';
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

        list
            .append('li')
            .text(t('infobox.location.zoom') + ': ' + context.map().zoom().toFixed(2));

        // Date of Imagery
        selection
            .append('p')
            .attr('class', 'imagery-vintage')
            .text(lastImagery);

        // Location Name
        selection
            .append('p')
            .attr('class', 'location-name')
            .text(lastLocation);

        debouncedLocation(selection, coord);
    }


    var debouncedLocation = _.debounce(updateLocation, 250);
    function updateLocation(selection, coord) {
        if (!services.geocoder) {
            lastLocation = t('infobox.location.unknown_location');
            selection.selectAll('.location-name')
                .text(lastLocation);
        } else {
            services.geocoder.reverse(coord, function(err, result) {
                lastLocation = result ? result.display_name : t('infobox.location.unknown_location');
                selection.selectAll('.location-name')
                    .text(lastLocation);
            });
        }
    }


    var debouncedImageryVintage = _.debounce(updateImageryVintage, 250);
    function updateImageryVintage(selection) {
        var tiledata = d3.select('.layer-background img').datum(),
            zoom = tiledata[2] || Math.floor(context.map().zoom()),
            center = context.map().center();

        context.background().baseLayerSource().getVintage(center, zoom, function(err, result) {
            if (!result) {
                lastImagery = t('infobox.location.unknown_imagery_age');
            } else {
                if (result.start || result.end) {
                    lastImagery = (result.start || '?') + ' - ' + (result.end || '?');
                } else {
                    lastImagery = t('infobox.location.unknown_imagery_age');
                }
            }

            selection.selectAll('.imagery-vintage')
                .text(lastImagery);
        });
    }


    var panel = function(selection) {
        selection.call(redraw);

        context.surface()
            .on('mousemove.info-location', function() {
                selection.call(redraw);
            });

        context.map()
            .on('drawn.info-location', function() {
                selection.call(redraw);
            })
            .on('move.info-location', function() {
                selection.call(debouncedImageryVintage);
            });

    };

    panel.off = function() {
        context.surface()
            .on('mousemove.info-location', null);

        context.map()
            .on('drawn.info-location', null)
            .on('move.info-location', null);
    };

    panel.id = 'location';
    panel.title = t('infobox.location.title');
    panel.key = t('infobox.location.key');


    return panel;
}
