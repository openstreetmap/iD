
import { t } from '../../core/localizer';
import { uiPane } from '../pane';

import { uiSectionBackgroundDisplayOptions } from '../sections/background_display_options';
import { uiSectionBackgroundList } from '../sections/background_list';
import { uiSectionBackgroundOffset } from '../sections/background_offset';
import { uiSectionOverlayList } from '../sections/overlay_list';

export function uiPaneBackground(context) {

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
