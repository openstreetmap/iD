
import { t } from '../../util/locale';
import { uiPane } from '../pane';
import { uiSectionPrivacy } from '../sections/privacy';

export function uiPanePreferences(context) {

  let preferencesPane = uiPane('preferences', context)
    .key(t('preferences.key'))
    .title(t('preferences.title'))
    .description(t('preferences.description'))
    .iconName('fas-user-cog')
    .sections([
        uiSectionPrivacy(context)
    ]);

  return preferencesPane;
}
