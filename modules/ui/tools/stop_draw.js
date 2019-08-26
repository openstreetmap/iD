
import { uiToolSimpleButton } from './simple_button';
import { t } from '../../util/locale';
import { modeBrowse } from '../../modes/browse';

export function uiToolStopDraw(context) {

    var cancelOrFinish = 'cancel';

    var tool = uiToolSimpleButton({
        id: 'stop_draw',
        label: function() {
            if (cancelOrFinish === 'finish') {
                return t('toolbar.finish');
            }
            return t('confirm.cancel');
        },
        iconName: function() {
            if (cancelOrFinish === 'finish') {
                return 'iD-icon-apply';
            }
            return 'iD-icon-close';
        },
        onClick: function() {
            var mode = context.mode();
            if (cancelOrFinish === 'finish' && mode.finish) {
                mode.finish();
            } else {
                context.enter(modeBrowse(context));
            }
        },
        tooltipKey: 'Esc',
        barButtonClass: 'wide',
        userToggleable: false
    });

    tool.allowed = function() {
        var newCancelOrFinish = drawCancelOrFinish();
        if (newCancelOrFinish) {
            cancelOrFinish = newCancelOrFinish;
        }
        return newCancelOrFinish;
    };


    function drawCancelOrFinish() {
        var mode = context.mode();
        if (mode.id === 'draw-line' || mode.id === 'draw-area') {
            var way = context.hasEntity(mode.wayID);
            var wayIsDegenerate = way && new Set(way.nodes).size - 1 < (way.isArea() ? 3 : 2);
            if (wayIsDegenerate) {
                return 'cancel';
            }
            return 'finish';
        } else if (mode.id === 'add-point' || mode.id === 'add-line' || mode.id === 'add-area') {
            if (mode.addedEntityIDs().length === 0) {
                return 'cancel';
            }
            return 'finish';
        }
        return null;
    }

    return tool;
}
