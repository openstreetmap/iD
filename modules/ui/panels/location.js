import _debounce from 'lodash-es/debounce';

import { decimalCoordinatePair, dmsCoordinatePair } from '../../util/units';
import { t } from '../../core/localizer';
import { services } from '../../services';


export function uiPanelLocation(context) {
    var currLocation = '';


    function redraw(selection) {
        selection.html('');

        var list = selection
            .append('ul');

        // Mouse coordinates
        var coord = context.map().mouseCoordinates();
        if (coord.some(isNaN)) {
            coord = context.map().center();
        }

        list
            .append('li')
            .text(dmsCoordinatePair(coord))
            .append('li')
            .text(decimalCoordinatePair(coord));

        // Location Info
        selection
            .append('div')
            .attr('class', 'location-info')
            .text(currLocation || ' ');

        debouncedGetLocation(selection, coord);
    }


    var debouncedGetLocation = _debounce(getLocation, 250);
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
            .on(('PointerEvent' in window ? 'pointer' : 'mouse') + 'move.info-location', function() {
                selection.call(redraw);
            });
    };

    panel.off = function() {
        context.surface()
            .on('.info-location', null);
    };

    panel.id = 'location';
    panel.title = t('info_panels.location.title');
    panel.key = t('info_panels.location.key');


    return panel;
}
