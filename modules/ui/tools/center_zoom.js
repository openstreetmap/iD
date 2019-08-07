
import { uiToolSimpleButton } from './simple_button';
import { t } from '../../util/locale';

export function uiToolCenterZoom(context) {

    var tool = uiToolSimpleButton({
        id: 'center_zoom',
        label: t('toolbar.center_zoom.title'),
        iconName: 'iD-icon-frame-pin',
        onClick: function() {
            context.mode().zoomToSelected();
        },
        tooltipText: function() {
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
        tooltipKey: t('inspector.zoom_to.key'),
        barButtonClass: 'wide'
    });

    tool.available = function() {
        var modeID = context.mode().id;
        return (modeID === 'select' && !context.mode().newFeature()) || modeID === 'select-note' ||
            modeID === 'select-data' || modeID === 'select-error';
    };

    return tool;
}
