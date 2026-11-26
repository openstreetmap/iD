import _debounce from 'lodash-es/debounce';

import { t } from '../core/localizer';
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
            .on('wheel', function(d3_event) {   // let wheel events pass through #4482
                var e2 = new WheelEvent(d3_event.type, d3_event);
                context.surface().node().dispatchEvent(e2);
            });

        button
            .call(svgIcon('#iD-icon-plus', 'pre-text'))
            .append('span')
            .attr('class', 'label')
            .call(t.append('zoom_in_edit'));


        function disableTooHigh() {
            var canEdit = context.map().zoom() >= context.minEditableZoom();
            div.style('display', canEdit ? 'none' : 'block');
        }

        context.map()
            .on('move.notice', _debounce(disableTooHigh, 500));

        disableTooHigh();
    };
}
