import { event as d3_event } from 'd3-selection';

import { svgIcon } from '../../svg/icon';
import { t } from '../../util/locale';
import { tooltip } from '../../util/tooltip';
import { uiDisclosure } from '../disclosure';
import { uiPane } from '../pane';


export function uiPanePreferences(context) {
  let _showThirdPartyIcons = context.storage('preferences.privacy.thirdpartyicons') || 'true';

  function renderPrivacyOptions(selection) {
    // enter
    let privacyOptionsListEnter = selection.selectAll('.privacy-options-list')
      .data([0])
      .enter()
      .append('ul')
      .attr('class', 'layer-list privacy-options-list');

    let thirdPartyIconsEnter = privacyOptionsListEnter
      .append('li')
      .attr('class', 'privacy-third-party-icons-item')
      .append('label')
      .call(tooltip()
        .title(t('preferences.privacy.third_party_icons.tooltip'))
        .placement('bottom')
      );

    thirdPartyIconsEnter
      .append('input')
      .attr('type', 'checkbox')
      .on('change', () => {
        d3_event.preventDefault();
        _showThirdPartyIcons = (_showThirdPartyIcons === 'true') ? 'false' : 'true';
        context.storage('preferences.privacy.thirdpartyicons', _showThirdPartyIcons);
        update();
      });

    thirdPartyIconsEnter
      .append('span')
      .text(t('preferences.privacy.third_party_icons.description'));


    // Privacy Policy link
    selection.selectAll('.privacy-link')
      .data([0])
      .enter()
      .append('div')
      .attr('class', 'privacy-link')
      .append('a')
      .attr('target', '_blank')
      .call(svgIcon('#iD-icon-out-link', 'inline'))
      .attr('href', 'https://github.com/openstreetmap/iD/blob/master/PRIVACY.md')
      .append('span')
      .text(t('preferences.privacy.privacy_link'));

    update();


    function update() {
      selection.selectAll('.privacy-third-party-icons-item')
        .classed('active', (_showThirdPartyIcons === 'true'))
        .select('input')
        .property('checked', (_showThirdPartyIcons === 'true'));
    }
  }

  let preferencesPane = uiPane('preferences', context)
    .key(t('preferences.key'))
    .title(t('preferences.title'))
    .description(t('preferences.description'))
    .iconName('fas-user-cog');

  preferencesPane.renderContent = (content) => {

    content
      .append('div')
      .attr('class', 'preferences-privacy')
      .call(uiDisclosure(context, 'preferences_third_party', true)
        .title(t('preferences.privacy.title'))
        .content(renderPrivacyOptions)
      );
  };

  return preferencesPane;
}
