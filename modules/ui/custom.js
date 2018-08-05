import { t } from '../util/locale';
import { uiIntro } from './intro';
import { uiModal } from './modal';


export function uiCustom(context) {

    return function(selection) {

        /*if (context.storage('sawCustom'))
             return;

        context.storage('sawCustom', true);*/

        var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modalSelection = uiModal(selection);

        modalSelection.select('.modal')
            .attr('class', 'modal-splash modal col6');

        var introModal = modalSelection.select('.content')
            .append('div')
            .attr('class', 'fillL');

        introModal
            .append('div')
            .attr('class','modal-section cf')
            .append('h3').text(t('background.custom_heading'));

        introModal
            .append('div')
            .attr('class','modal-section')
            .append('p').text(t('background.custom_prompt'))
            /*.append('p').text(t('background.custom_token1'))
            .append('p').text(t('background.custom_token2'))
            .append('p').text(t('background.custom_token3'))
            .append('p').text(t('background.custom_token4'))
            .append('p').text(t('background.custom_example', { example: example }))*/
            .append('textarea');


        /*var textAreaWrap = introModal
            .append('div')
            .attr('class', 'modal-section');

        var urlArea = textAreaWrap
            .append('textarea');*/

        var buttonWrap = introModal
            .append('div')
            .attr('class', 'modal-section');


        var startEditing = buttonWrap
            .append('button')
            .attr('class', 'button-cancel')
            .on('click', modalSelection.close);

        startEditing
            .append('div')
            .text('Cancel');

        var walkthrough = buttonWrap
            .append('button')
            .attr('class', 'button-ok')
            .on('click', function() {
                context.container().call(uiIntro(context));
                modalSelection.close();
            });

        walkthrough
            .append('div')
            .text('OK');


        modalSelection.select('button.close')
            .attr('class','hide');


    };
}
