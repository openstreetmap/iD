
import { uiToolSimpleButton } from './simple_button';
import { t } from '../../util/locale';

export function uiToolCenterZoom(context) {

    var originTransform;

    var tool = uiToolSimpleButton({
        id: 'center_zoom',
        label: function() {
            if (!originTransform) {
                return t('toolbar.center_zoom.title');
            } else {
                return t('toolbar.return');
            }
        },
        toolboxLabel: t('toolbar.center_zoom.title'),
        iconName: function() {
            if (!originTransform) {
                return 'iD-icon-frame-pin';
            } else {
                return 'iD-icon-frame-back';
            }
        },
        toolboxIconName: 'iD-icon-frame-pin',
        iconClass: 'operation-icon',
        onClick: function() {
            if (!originTransform) {
                context.mode().zoomToSelected();
                originTransform = context.projection.transform();
            } else {
                context.map().transformEase(originTransform);
                originTransform = null;
            }
        },
        tooltipText: function() {
            if (!originTransform) {
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
            } else {
                return t('toolbar.center_zoom.return_tooltip');
            }
        },
        tooltipKey: t('inspector.zoom_to.key'),
        barButtonClass: 'wide'
    });

    tool.allowed = function() {
        var modeID = context.mode().id;
        return (modeID === 'select' && !context.mode().newFeature()) || modeID === 'select-note' ||
            modeID === 'select-data' || modeID === 'select-error';
    };

    tool.install = function() {
        context.on('enter.uiToolCenterZoom', function() {
            originTransform = null;
        });
    };

    tool.uninstall = function() {
        context.on('enter.uiToolCenterZoom', null);
        originTransform = null;
    };

    return tool;
}
