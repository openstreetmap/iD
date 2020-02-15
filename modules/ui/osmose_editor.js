import { dispatch as d3_dispatch } from 'd3-dispatch';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';

import { uiOsmoseDetails } from './osmose_details';
import { uiOsmoseHeader } from './osmose_header';
import { uiQuickLinks } from './quick_links';
import { uiTooltipHtml } from './tooltipHtml';
import { uiViewOnOsmose } from './view_on_osmose';

import { utilRebind } from '../util';

export function uiOsmoseEditor(context) {
  const dispatch = d3_dispatch('change');
  const qaDetails = uiOsmoseDetails(context);
  const qaHeader = uiOsmoseHeader(context);
  const quickLinks = uiQuickLinks();

  let _qaItem;

  function osmoseEditor(selection) {
    // quick links
    const choices = [{
      id: 'zoom_to',
      label: 'inspector.zoom_to.title',
      tooltip: () => uiTooltipHtml(t('inspector.zoom_to.tooltip_qaItem'), t('inspector.zoom_to.key')),
      click: () => context.mode().zoomToSelected()
    }];

    const header = selection.selectAll('.header')
      .data([0]);

    const headerEnter = header.enter()
      .append('div')
        .attr('class', 'header fillL');

    headerEnter
      .append('button')
        .attr('class', 'fr qa-editor-close')
        .on('click', () => context.enter(modeBrowse(context)))
        .call(svgIcon('#iD-icon-close'));

    headerEnter
      .append('h3')
        .text(t('QA.osmose.title'));

    let body = selection.selectAll('.body')
      .data([0]);

    body = body.enter()
        .append('div')
        .attr('class', 'body')
      .merge(body);

    let editor = body.selectAll('.qa-editor')
      .data([0]);

    editor.enter()
      .append('div')
        .attr('class', 'modal-section qa-editor')
      .merge(editor)
        .call(qaHeader.issue(_qaItem))
        .call(quickLinks.choices(choices))
        .call(qaDetails.issue(_qaItem))
        .call(osmoseSaveSection);

    const footer = selection.selectAll('.footer')
      .data([0]);

    footer.enter()
      .append('div')
      .attr('class', 'footer')
      .merge(footer)
      .call(uiViewOnOsmose(context).what(_qaItem));
  }

  function osmoseSaveSection(selection) {
    const isSelected = (_qaItem && _qaItem.id === context.selectedErrorID());
    const isShown = (_qaItem && isSelected);
    let saveSection = selection.selectAll('.qa-save')
      .data(
        (isShown ? [_qaItem] : []),
        d => `${d.id}-${d.status || 0}`
      );

    // exit
    saveSection.exit()
      .remove();

    // enter
    const saveSectionEnter = saveSection.enter()
      .append('div')
        .attr('class', 'qa-save save-section cf');

    // update
    saveSection = saveSectionEnter
      .merge(saveSection)
        .call(qaSaveButtons);
  }

  function qaSaveButtons(selection) {
    const isSelected = (_qaItem && _qaItem.id === context.selectedErrorID());
    let buttonSection = selection.selectAll('.buttons')
      .data((isSelected ? [_qaItem] : []), d => d.status + d.id);

    // exit
    buttonSection.exit()
      .remove();

    // enter
    const buttonEnter = buttonSection.enter()
      .append('div')
        .attr('class', 'buttons');

    buttonEnter
      .append('button')
        .attr('class', 'button close-button action');

    buttonEnter
      .append('button')
        .attr('class', 'button ignore-button action');

    // update
    buttonSection = buttonSection
      .merge(buttonEnter);

    buttonSection.select('.close-button')
      .text(() => t('QA.keepRight.close'))
      .on('click.close', function(d) {
        this.blur();    // avoid keeping focus on the button - #4641
        const qaService = services.osmose;
        if (qaService) {
          d.newStatus = 'done';
          qaService.postUpdate(d, (err, item) => dispatch.call('change', item));
        }
      });

    buttonSection.select('.ignore-button')
      .text(() => t('QA.keepRight.ignore'))
      .on('click.ignore', function(d) {
        this.blur();    // avoid keeping focus on the button - #4641
        const qaService = services.osmose;
        if (qaService) {
          d.newStatus = 'false';
          qaService.postUpdate(d, (err, item) => dispatch.call('change', item));
        }
      });
  }

  // NOTE: Don't change method name until UI v3 is merged
  osmoseEditor.error = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return osmoseEditor;
  };

  return utilRebind(osmoseEditor, dispatch, 'on');
}
