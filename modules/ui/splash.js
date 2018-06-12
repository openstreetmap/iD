import { t } from '../util/locale';
import { uiIntro } from './intro';
import { uiModal } from './modal';


export function uiSplash(context) {

    return function(selection) {
        if (context.storage('sawSplash'))
             return;

        context.storage('sawSplash', true);

        var modalSelection = uiModal(selection);

        modalSelection.select('.modal')
            .attr('class', 'modal-splash modal col6');

        var introModal = modalSelection.select('.content')
            .append('div')
            .attr('class', 'fillL');

        introModal
            .append('div')
            .attr('class','modal-section cf')
            .append('h3').text(t('splash.welcome'));

        introModal
            .append('div')
            .attr('class','modal-section')
            .append('p')
            .html(t('splash.text', {
                version: context.version,
                website: '<a href="http://ideditor.com/">ideditor.com</a>',
                github: '<a href="https://github.com/openstreetmap/iD">github.com</a>'
            }));

        var buttonWrap = introModal
            .append('div')
            .attr('class', 'modal-actions cf');

        var walkthrough = buttonWrap
            .append('button')
            .attr('class', 'walkthrough col6')
            .on('click', function() {
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

        var startEditing = buttonWrap
            .append('button')
            .attr('class', 'start-editing col6')
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
