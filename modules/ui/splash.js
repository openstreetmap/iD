import { t } from '../util/locale';
import { uiIntro } from './intro';
import { uiModal } from './modal';


export function uiSplash(context) {
  return (selection) => {
    // Exception - if there are restorable changes, skip this splash screen.
    // This is because we currently only support one `uiModal` at a time
    //  and we need to show them `uiRestore`` instead of this one.
    if (context.history().hasRestorableChanges()) return;

    // If user has not seen this version of the privacy policy, show the splash again.
    let updateMessage = '';
    const sawPrivacyVersion = context.storage('sawPrivacyVersion');
    if (sawPrivacyVersion !== context.privacyVersion) {
      updateMessage = t('splash.privacy_update');
      context.storage('sawSplash', null);
    }

    if (context.storage('sawSplash')) return;

    context.storage('sawSplash', true);
    context.storage('sawPrivacyVersion', context.privacyVersion);

    let modalSelection = uiModal(selection);

    modalSelection.select('.modal')
      .attr('class', 'modal-splash modal');

    let introModal = modalSelection.select('.content')
      .append('div')
      .attr('class', 'fillL');

    introModal
      .append('div')
      .attr('class','modal-section')
      .append('h3')
      .text(t('splash.welcome'));

    let modalSection = introModal
      .append('div')
      .attr('class','modal-section');

    modalSection
      .append('p')
      .html(t('splash.text', {
        version: context.version,
        website: '<a target="_blank" href="http://ideditor.blog/">ideditor.blog</a>',
        github: '<a target="_blank" href="https://github.com/openstreetmap/iD">github.com</a>'
      }));

    modalSection
      .append('p')
      .html(t('splash.privacy', {
        updateMessage: updateMessage,
        privacyLink: '<a target="_blank" href="https://github.com/openstreetmap/iD/blob/master/PRIVACY.md">' +
          t('splash.privacy_policy') + '</a>'
      }));

    let buttonWrap = introModal
      .append('div')
      .attr('class', 'modal-actions');

    let walkthrough = buttonWrap
      .append('button')
      .attr('class', 'walkthrough')
      .on('click', () => {
        context.container().call(uiIntro(context));
        modalSelection.close();
      });

    walkthrough
      .append('svg')
      .attr('class', 'logo logo-walkthrough')
      .append('use')
      .attr('xlink:href', '#iD-logo-walkthrough');

    walkthrough
      .append('div')
      .text(t('splash.walkthrough'));

    let startEditing = buttonWrap
      .append('button')
      .attr('class', 'start-editing')
      .on('click', modalSelection.close);

    startEditing
      .append('svg')
      .attr('class', 'logo logo-features')
      .append('use')
      .attr('xlink:href', '#iD-logo-features');

    startEditing
      .append('div')
      .text(t('splash.start'));

    modalSelection.select('button.close')
      .attr('class','hide');
  };
}
