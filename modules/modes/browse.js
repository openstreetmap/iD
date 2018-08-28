import { t } from '../util/locale';

import {
    behaviorHover,
    behaviorLasso,
    behaviorPaste,
    behaviorSelect
} from '../behavior';

import { modeDragNode } from './drag_node';
import { modeDragNote } from './drag_note';


export function modeBrowse(context) {
    var mode = {
        button: 'browse',
        id: 'browse',
        title: t('modes.browse.title'),
        description: t('modes.browse.description')
    }, sidebar;

    var behaviors = [
        behaviorPaste(context),
        behaviorHover(context).on('hover', context.ui().sidebar.hover),
        behaviorSelect(context),
        behaviorLasso(context),
        modeDragNode(context).behavior,
        modeDragNote(context).behavior
    ];


    mode.enter = function() {
        behaviors.forEach(context.install);

        // Get focus on the body.
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }

        if (sidebar) {
            context.ui().sidebar.show(sidebar);
        } else {
            context.ui().sidebar.select(null);
        }
    };


    mode.exit = function() {
        context.ui().sidebar.hover.cancel();
        behaviors.forEach(context.uninstall);

        if (sidebar) {
            context.ui().sidebar.hide();
        }
    };


    mode.sidebar = function(_) {
        if (!arguments.length) return sidebar;
        sidebar = _;
        return mode;
    };


    return mode;
}
