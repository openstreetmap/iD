import * as d3 from 'd3';
import { t } from '../../util/locale';
import { icon } from './helper';
import { uiModal } from '../modal';
import { utilRebind } from '../../util/rebind';


export function uiIntroStartEditing(context, reveal) {
    var dispatch = d3.dispatch('done', 'startEditing'),
        modalSelection,
        timeouts = [];

    var step = {
        title: 'intro.startediting.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    step.enter = function() {
        reveal('.map-control.help-control',
            t('intro.startediting.help', { button: icon('#icon-help', 'pre-text') }));

        timeout(function() {
            reveal('#bar button.save', t('intro.startediting.save'));
        }, 5000);

        timeout(function() {
            reveal('#surface');
        }, 10000);

        timeout(function() {
            modalSelection = uiModal(context.container());

            modalSelection.select('.modal')
                .attr('class', 'modal-splash modal col6');

            modalSelection.selectAll('.close').remove();

            var startbutton = modalSelection.select('.content')
                .attr('class', 'fillL')
                .append('button')
                    .attr('class', 'modal-section huge-modal-button')
                    .on('click', function() {
                        modalSelection.remove();
                    });

                startbutton
                    .append('div')
                    .attr('class','illustration');

                startbutton
                    .append('h2')
                    .text(t('intro.startediting.start'));

            dispatch.call('startEditing');
        }, 10500);
    };


    step.exit = function() {
        if (modalSelection) { modalSelection.remove(); }
        timeouts.forEach(window.clearTimeout);
    };


    return utilRebind(step, dispatch, 'on');
}
