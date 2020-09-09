import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';
import { services } from '../services';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';

import { uiImproveOsmComments } from './improveOSM_comments';
import { uiImproveOsmDetails } from './improveOSM_details';
import { uiImproveOsmHeader } from './improveOSM_header';

import { utilNoAuto, utilRebind } from '../util';

export function uiImproveOsmEditor(context) {
  const dispatch = d3_dispatch('change');
  const qaDetails = uiImproveOsmDetails(context);
  const qaComments = uiImproveOsmComments(context);
  const qaHeader = uiImproveOsmHeader(context);

  let _qaItem;

  function improveOsmEditor(selection) {

    const headerEnter = selection.selectAll('.header')
      .data([0])
      .enter()
      .append('div')
        .attr('class', 'header fillL');

    headerEnter
      .append('button')
        .attr('class', 'close')
        .on('click', () => context.enter(modeBrowse(context)))
        .call(svgIcon('#iD-icon-close'));

    headerEnter
      .append('h3')
        .text(t('QA.improveOSM.title'));

    let body = selection.selectAll('.body')
      .data([0]);

    body = body.enter()
      .append('div')
        .attr('class', 'body')
      .merge(body);

    const editor = body.selectAll('.qa-editor')
      .data([0]);

    editor.enter()
      .append('div')
        .attr('class', 'modal-section qa-editor')
      .merge(editor)
        .call(qaHeader.issue(_qaItem))
        .call(qaDetails.issue(_qaItem))
        .call(qaComments.issue(_qaItem))
        .call(improveOsmSaveSection);
  }

  function improveOsmSaveSection(selection) {
    const isSelected = (_qaItem && _qaItem.id === context.selectedErrorID());
    const isShown = (_qaItem && (isSelected || _qaItem.newComment || _qaItem.comment));
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

    saveSectionEnter
      .append('h4')
        .attr('class', '.qa-save-header')
        .text(t('note.newComment'));

    saveSectionEnter
      .append('textarea')
        .attr('class', 'new-comment-input')
        .attr('placeholder', t('QA.keepRight.comment_placeholder'))
        .attr('maxlength', 1000)
        .property('value', d => d.newComment)
        .call(utilNoAuto)
        .on('input', changeInput)
        .on('blur', changeInput);

    // update
    saveSection = saveSectionEnter
      .merge(saveSection)
        .call(qaSaveButtons);

    function changeInput() {
      const input = d3_select(this);
      let val = input.property('value').trim();

      if (val === '') {
        val = undefined;
      }

      // store the unsaved comment with the issue itself
      _qaItem = _qaItem.update({ newComment: val });

      const qaService = services.improveOSM;
      if (qaService) {
        qaService.replaceItem(_qaItem);
      }

      saveSection
        .call(qaSaveButtons);
    }
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
        .attr('class', 'button comment-button action')
        .text(t('QA.keepRight.save_comment'));

    buttonEnter
      .append('button')
        .attr('class', 'button close-button action');

    buttonEnter
      .append('button')
        .attr('class', 'button ignore-button action');

    // update
    buttonSection = buttonSection
      .merge(buttonEnter);

    buttonSection.select('.comment-button')
      .attr('disabled', d => d.newComment ? null : true)
      .on('click.comment', function(d) {
        this.blur();    // avoid keeping focus on the button - #4641
        const qaService = services.improveOSM;
        if (qaService) {
          qaService.postUpdate(d, (err, item) => dispatch.call('change', item));
        }
      });

    buttonSection.select('.close-button')
      .text(d => {
        const andComment = (d.newComment ? '_comment' : '');
        return t(`QA.keepRight.close${andComment}`);
      })
      .on('click.close', function(d) {
        this.blur();    // avoid keeping focus on the button - #4641
        const qaService = services.improveOSM;
        if (qaService) {
          d.newStatus = 'SOLVED';
          qaService.postUpdate(d, (err, item) => dispatch.call('change', item));
        }
      });

    buttonSection.select('.ignore-button')
      .text(d => {
        const andComment = (d.newComment ? '_comment' : '');
        return t(`QA.keepRight.ignore${andComment}`);
      })
      .on('click.ignore', function(d) {
        this.blur();    // avoid keeping focus on the button - #4641
        const qaService = services.improveOSM;
        if (qaService) {
          d.newStatus = 'INVALID';
          qaService.postUpdate(d, (err, item) => dispatch.call('change', item));
        }
      });
  }

  // NOTE: Don't change method name until UI v3 is merged
  improveOsmEditor.error = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return improveOsmEditor;
  };

  return utilRebind(improveOsmEditor, dispatch, 'on');
}
