import { t } from '../../util/locale';
import { uiBackground } from '../background';
import { uiModal } from '../modal';


export function uiSettingsCustomBackground(context) {

    return function(selection) {

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
            .append('p').text(t('background.custom_prompt', { example: example }))
            .append('textarea');


        /*var textAreaWrap = introModal
            .append('div')
            .attr('class', 'modal-section');

        var urlArea = textAreaWrap
            .append('textarea');*/

        var buttonWrap = introModal
            .append('div')
            .attr('class', 'modal-section');


        var cancelButton = buttonWrap
            .append('button')
            .attr('class', 'button-cancel')
            .on('click', modalSelection.close);

        cancelButton
            .append('div')
            .text('Cancel');

        var okButton = buttonWrap
            .append('button')
            .attr('class', 'button-ok')
            .on('click', function() {
                var template = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
                context.container().call(uiBackground.edit, template);
                modalSelection.close();
            });

        okButton
            .append('div')
            .text('OK');


        modalSelection.select('button.close')
            .attr('class','hide');


    };
}
