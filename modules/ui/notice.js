import { t } from '../util/locale';
import _ from 'lodash';
import { Icon } from '../svg/index';
export function Notice(context) {
    return function(selection) {
        var div = selection.append('div')
            .attr('class', 'notice');

        var button = div.append('button')
            .attr('class', 'zoom-to notice')
            .on('click', function() { context.map().zoom(context.minEditableZoom()); });

        button
            .call(Icon('#icon-plus', 'pre-text'))
            .append('span')
            .attr('class', 'label')
            .text(t('zoom_in_edit'));

        function disableTooHigh() {
            div.style('display', context.editable() ? 'none' : 'block');
        }

        context.map()
            .on('move.notice', _.debounce(disableTooHigh, 500));

        disableTooHigh();
    };
}
