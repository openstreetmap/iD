import { prefs } from '../core/preferences';
import { fileFetcher } from '../core/file_fetcher';
import { t } from '../core/localizer';
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
    const sawPrivacyVersion = prefs('sawPrivacyVersion');
    let showSplash = !prefs('sawSplash');
    if (sawPrivacyVersion !== context.privacyVersion) {
      updateMessage = t('splash.privacy_update');
      showSplash = true;
    }

    if (!showSplash) return;

    prefs('sawSplash', true);
    prefs('sawPrivacyVersion', context.privacyVersion);

    // fetch intro graph data now, while user is looking at the splash screen
    fileFetcher.get('intro_graph');

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
        privacyLink: '<a target="_blank" href="https://github.com/openstreetmap/iD/blob/release/PRIVACY.md">' +
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
