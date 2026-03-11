import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';

export function uiSectionPrivacy(context) {
    let section = uiSection('preferences-third-party', context)
      .label(() => t.append('preferences.privacy.title'))
      .disclosureContent(renderDisclosureContent);

      let wikimedia = prefs('preferences.privacy.icons.wikimedia') || 'true';
      let facebook = prefs('preferences.privacy.icons.facebook') || 'true';

    function renderDisclosureContent(selection) {
      // enter
      selection.selectAll('.privacy-options-list')
        .data([0])
        .enter()
        .append('ul')
        .attr('class', 'layer-list privacy-options-list');

      let options = [
      { key: 'preferences.privacy.icons.wikimedia', label: 'Wikimedia icons' },
      { key: 'preferences.privacy.icons.facebook', label: 'Facebook icons' },
      { key: 'preferences.privacy.icons.other', label: 'Other third-party icons' }
      ];

     let thirdPartyIconsEnter = selection.select('.privacy-options-list')
        .selectAll('.privacy-third-party-icons-item')
        .data(options)
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
       .property('checked', d => (prefs(d.key) || 'true') === 'true')
       .on('change', (event, d) => {
       let current = prefs(d.key) || 'true';
       prefs(d.key, current === 'true' ? 'false' : 'true');
      });

      thirdPartyIconsEnter
       .append('span')
       .text(d => d.label);

      // update
      selection.selectAll('.privacy-third-party-icons-item')
        .classed('active', d => d === 'true')
        .select('input')
        .property('checked', d => (prefs(d.key) || 'true') === 'true');

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

    prefs.onChange('preferences.privacy.icons.wikimedia', section.reRender);
    prefs.onChange('preferences.privacy.icons.facebook', section.reRender);
    prefs.onChange('preferences.privacy.icons.other', section.reRender);

    return section;
}
