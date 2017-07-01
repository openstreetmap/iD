import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';
import { services } from '../../services';


export function uiPanelLocation(context) {
    var background = context.background();
    var currLocation = '';
    var currImagerySource = null;
    var currImageryDates = '';
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


        // Imagery Info
        if (currImagerySource !== background.baseLayerSource().name()) {
            currImagerySource = background.baseLayerSource().name();
            currImageryDates = '';
        }

        var imageryList = selection
            .append('ul')
            .attr('class', 'imagery-info');

        imageryList
            .append('li')
            .text(currImagerySource);

        imageryList
            .append('li')
            .text(t('infobox.location.imagery_capture_dates') + ':');

        imageryList
            .append('li')
            .attr('class', 'imagery-dates')
            .text(currImageryDates || ' ');

        if (!currImageryDates) {
            debouncedGetImageryDates(selection);
        }


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
            currLocation = t('infobox.location.unknown_location');
            selection.selectAll('.location-info')
                .text(currLocation);
        } else {
            services.geocoder.reverse(coord, function(err, result) {
                currLocation = result ? result.display_name : t('infobox.location.unknown_location');
                selection.selectAll('.location-info')
                    .text(currLocation);
            });
        }
    }


    var debouncedGetImageryDates = _.debounce(getImageryDates, 250);
    function getImageryDates(selection) {
        var tiledata = d3.select('.layer-background img').datum(),
            zoom = tiledata[2] || Math.floor(context.map().zoom()),
            center = context.map().center();

        background.baseLayerSource().getVintage(center, zoom, function(err, result) {
            if (!result) {
                currImageryDates = t('infobox.location.unknown_imagery_age');
            } else {
                if (result.start || result.end) {
                    currImageryDates = (result.start || '?') + ' - ' + (result.end || '?');
                } else {
                    currImageryDates = t('infobox.location.unknown_imagery_age');
                }
            }

            selection.selectAll('.imagery-dates')
                .text(currImageryDates);
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
                selection.call(debouncedGetImageryDates);
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
