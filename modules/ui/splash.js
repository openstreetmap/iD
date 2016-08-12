import * as d3 from 'd3';
import { t } from '../util/locale';
import { intro } from './intro/index';
import { modal } from './modal';

export function Splash(context) {
    return function(selection) {
        if (context.storage('sawSplash'))
             return;

        context.storage('sawSplash', true);

        var modalSelection = modal(selection);

        modalSelection.select('.modal')
            .attr('class', 'modal-splash modal col6');

        var introModal = modalSelection.select('.content')
            .append('div')
            .attr('class', 'fillL');

        introModal.append('div')
            .attr('class','modal-section cf')
            .append('h3').text(t('splash.welcome'));

        introModal.append('div')
            .attr('class','modal-section')
            .append('p')
            .html(t('splash.text', {
                version: context.version,
                website: '<a href="http://ideditor.com/">ideditor.com</a>',
                github: '<a href="https://github.com/openstreetmap/iD">github.com</a>'
            }));

        var buttons = introModal.append('div').attr('class', 'modal-actions cf');

        buttons.append('button')
            .attr('class', 'col6 walkthrough')
            .text(t('splash.walkthrough'))
            .on('click', function() {
                d3.select(document.body).call(intro(context));
                modalSelection.close();
            });

        buttons.append('button')
            .attr('class', 'col6 start')
            .text(t('splash.start'))
            .on('click', modalSelection.close);

        modalSelection.select('button.close').attr('class','hide');

    };
}
