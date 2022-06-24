import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';

export function uiSectionPrivacy(context) {
    let section = uiSection('preferences-third-party', context)
      .label(() => t.append('preferences.privacy.title'))
      .disclosureContent(renderDisclosureContent);

    function renderDisclosureContent(selection) {
      // enter
      selection.selectAll('.privacy-options-list')
        .data([0])
        .enter()
        .append('ul')
        .attr('class', 'layer-list privacy-options-list');

      let thirdPartyIconsEnter = selection.select('.privacy-options-list')
        .selectAll('.privacy-third-party-icons-item')
        .data([prefs('preferences.privacy.thirdpartyicons') || 'true'])
        .enter()
        .append('li')
        .attr('class', 'privacy-third-party-icons-item')
        .append('label')
        .call(uiTooltip()
          .title(() => t.append('preferences.privacy.third_party_icons.tooltip'))
          .placement('bottom')
        );

      thirdPartyIconsEnter
        .append('input')
        .attr('type', 'checkbox')
        .on('change', (d3_event, d) => {
          d3_event.preventDefault();
          prefs('preferences.privacy.thirdpartyicons', d === 'true' ? 'false' : 'true');
        });

      thirdPartyIconsEnter
        .append('span')
        .call(t.append('preferences.privacy.third_party_icons.description'));

      // update
      selection.selectAll('.privacy-third-party-icons-item')
        .classed('active', d => d === 'true')
        .select('input')
        .property('checked', d => d === 'true');

      // Privacy Policy link
      selection.selectAll('.privacy-link')
        .data([0])
        .enter()
        .append('div')
        .attr('class', 'privacy-link')
        .append('a')
        .attr('target', '_blank')
        .call(svgIcon('#iD-icon-out-link', 'inline'))
        .attr('href', 'https://github.com/openstreetmap/iD/blob/release/PRIVACY.md')
        .append('span')
        .call(t.append('preferences.privacy.privacy_link'));

    }

    prefs.onChange('preferences.privacy.thirdpartyicons', section.reRender);

    return section;
}
