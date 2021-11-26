
import { t } from '../../core/localizer';
import { uiPane } from '../pane';

import {
    uiSectionBackgroundDisplayOptions,
    uiSectionBackgroundExtras,
    uiSectionBackgroundList,
    uiSectionBackgroundOffset
} from '../sections';

export function uiPaneBackground(context) {

    var backgroundPane = uiPane('background', context)
        .key(t('background.key'))
        .label(t.html('background.title'))
        .description(t.html('background.description'))
        .iconName('iD-icon-layers')
        .sections([
            uiSectionBackgroundList(context),
            uiSectionBackgroundExtras(context),
            uiSectionBackgroundDisplayOptions(context),
            uiSectionBackgroundOffset(context)
        ]);

    return backgroundPane;
}
