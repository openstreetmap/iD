import { t } from '../../core/localizer';
import { uiPane } from '../pane';
import { uiSectionNavigation } from '../sections/navigation';
import { uiSectionPrivacy } from '../sections/privacy';

export function uiPanePreferences(context) {

  let preferencesPane = uiPane('preferences', context)
    .key(t('preferences.key'))
    .label(t.append('preferences.title'))
    .description(t.append('preferences.description'))
    .iconName('fas-user-cog')
    .sections([
        uiSectionNavigation(context),
        uiSectionPrivacy(context)
    ]);

  return preferencesPane;
}
