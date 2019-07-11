
import { uiToolSimpleButton } from './simple_button';
import { t } from '../../util/locale';

export function uiToolCenterZoom(context) {

    var tool = uiToolSimpleButton(
        'center_zoom',
        t('toolbar.center_zoom.title'),
        'iD-icon-frame-pin', function() {
            context.mode().zoomToSelected();
        }, function() {
            var mode = context.mode();
            if (mode.id === 'select') {
                return t('inspector.zoom_to.tooltip_feature');
            } else if (mode.id === 'select-note') {
                return t('inspector.zoom_to.tooltip_note');
            } else if (mode.id === 'select-data') {
                return t('inspector.zoom_to.tooltip_data');
            } else if (mode.id === 'select-error') {
                return t('inspector.zoom_to.tooltip_issue');
            }
        },
        t('inspector.zoom_to.key'),
        'wide'
    );

    return tool;
}
