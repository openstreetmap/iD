
import { t } from '../../core/localizer';
import { uiPane } from '../pane';
import { uiSectionBackgroundExtras } from '../sections/background-extras';

import { uiSectionBackgroundDisplayOptions } from '../sections/background_display_options';
import { uiSectionBackgroundList } from '../sections/background_list';
import { uiSectionBackgroundOffset } from '../sections/background_offset';

export function uiPaneBackground(context) {

    var backgroundPane = uiPane('background', context)
        .key(t('background.key'))
        .label(t.html('background.title'))
        .description(t.html('background.description'))
        .iconName('iD-icon-layers')
        .sections(
            uiSectionBackgroundList(context).concat([
            uiSectionBackgroundExtras(context),
            uiSectionBackgroundDisplayOptions(context),
            uiSectionBackgroundOffset(context)
        ]));

    return backgroundPane;
}
