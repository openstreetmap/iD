import _debounce from 'lodash-es/debounce';

import { event as d3_event } from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg/index';


export function uiNotice(context) {

    return function(selection) {
        var div = selection
            .append('div')
            .attr('class', 'notice');

        var button = div
            .append('button')
            .attr('class', 'zoom-to notice fillD')
            .on('click', function() {
                context.map().zoomEase(context.minEditableZoom());
            })
            .on('wheel', function() {   // let wheel events pass through #4482
                var e2 = new WheelEvent(d3_event.type, d3_event);
                context.surface().node().dispatchEvent(e2);
            });

        button
            .call(svgIcon('#iD-icon-plus', 'pre-text'))
            .append('span')
            .attr('class', 'label')
            .text(t('zoom_in_edit'));


        function disableTooHigh() {
            var canEdit = context.map().zoom() >= context.minEditableZoom();
            div.style('display', canEdit ? 'none' : 'block');
            // if an Esri basemap is being displayed and native zoom past 19 is enabled, check the tilemap
            if (canEdit) {
                var basemap = context.background().baseLayerSource();
                if (/^EsriWorldImagery/.test(basemap.id) && basemap.scaleExtent[1] > 19) {
                    var center = context.map().center();
                    basemap.fetchTilemap(center);
                }
            }
        }

        context.map()
            .on('move.notice', _debounce(disableTooHigh, 500));

        disableTooHigh();
    };
}
