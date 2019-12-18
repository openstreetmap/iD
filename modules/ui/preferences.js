import { event as d3_event, select as d3_select } from 'd3-selection';

import { svgIcon } from '../svg/icon';
import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { uiDisclosure } from './disclosure';
import { uiTooltipHtml } from './tooltipHtml';


export function uiPreferences(context) {
  const key = t('preferences.key');
  let _pane = d3_select(null);
  let _showThirdPartyIcons = context.storage('preferences.privacy.thirdpartyicons') || 'true';

  const paneTooltip = tooltip()
    .placement((textDirection === 'rtl') ? 'right' : 'left')
    .html(true)
    .title(uiTooltipHtml(t('preferences.description'), key));


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


  uiPreferences.togglePane = () => {
    if (d3_event) d3_event.preventDefault();
    paneTooltip.hide();
    context.ui().togglePanes(!_pane.classed('shown') ? _pane : undefined);
  };


  uiPreferences.renderToggleButton = (selection) => {
    selection
      .append('button')
      .on('click', uiPreferences.togglePane)
      .call(svgIcon('#fas-user-cog', 'light'))
      .call(paneTooltip);
  };


  uiPreferences.renderPane = (selection) => {
    _pane = selection
      .append('div')
      .attr('class', 'fillL map-pane preferences-pane hide')
      .attr('pane', 'preferences');

    let heading = _pane
      .append('div')
      .attr('class', 'pane-heading');

    heading
      .append('h2')
      .text(t('preferences.title'));

    heading
      .append('button')
      .on('click', () => context.ui().togglePanes())
      .call(svgIcon('#iD-icon-close'));


    let content = _pane
      .append('div')
      .attr('class', 'pane-content');

    content
      .append('div')
      .attr('class', 'preferences-privacy')
      .call(uiDisclosure(context, 'preferences_third_party', true)
        .title(t('preferences.privacy.title'))
        .content(renderPrivacyOptions)
      );

    context.keybinding()
      .on(key, uiPreferences.togglePane);
  };

  return uiPreferences;
}
