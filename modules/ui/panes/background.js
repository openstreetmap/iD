import { event as d3_event } from 'd3-selection';

import { t } from '../../util/locale';
import { uiCmd } from '../cmd';
import { uiPane } from '../pane';

import { uiSectionBackgroundDisplayOptions } from '../sections/background_display_options';
import { uiSectionBackgroundList } from '../sections/background_list';
import { uiSectionBackgroundOffset } from '../sections/background_offset';
import { uiSectionOverlayList } from '../sections/overlay_list';

export function uiPaneBackground(context) {

    context.keybinding()
        .on(uiCmd('⌘' + t('background.key')), quickSwitch);

    function quickSwitch() {
        if (d3_event) {
            d3_event.stopImmediatePropagation();
            d3_event.preventDefault();
        }
        var previousBackground = context.background().findSource(context.storage('background-last-used-toggle'));
        if (previousBackground) {
            var currentBackground = context.background().baseLayerSource();
            context.storage('background-last-used-toggle', currentBackground.id);
            context.storage('background-last-used', previousBackground.id);
            context.background().baseLayerSource(previousBackground);
        }
    }

    var backgroundPane = uiPane('background', context)
        .key(t('background.key'))
        .title(t('background.title'))
        .description(t('background.description'))
        .iconName('iD-icon-layers')
        .sections([
            uiSectionBackgroundList(context),
            uiSectionOverlayList(context),
            uiSectionBackgroundDisplayOptions(context),
            uiSectionBackgroundOffset(context)
        ]);

    return backgroundPane;
}
