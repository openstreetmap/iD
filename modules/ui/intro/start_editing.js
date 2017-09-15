import * as d3 from 'd3';
import { t } from '../../util/locale';
import { icon } from './helper';
import { uiModal } from '../modal';
import { utilRebind } from '../../util/rebind';


export function uiIntroStartEditing(context, reveal) {
    var dispatch = d3.dispatch('done', 'startEditing'),
        modalSelection = d3.select(null);


    var chapter = {
        title: 'intro.startediting.title'
    };

    function showHelp() {
        reveal('.map-control.help-control',
            t('intro.startediting.help', { button: icon('#icon-help', 'pre-text'), key: t('help.key') }), {
                buttonText: t('intro.ok'),
                buttonCallback: function() { shortcuts(); }
            }
        );
    }

    function shortcuts() {
        reveal('.map-control.help-control',
            t('intro.startediting.shortcuts', { key: t('shortcuts.toggle.key') }), {
                buttonText: t('intro.ok'),
                buttonCallback: function() { showSave(); }
            }
        );
    }

    function showSave() {
        d3.selectAll('.shaded').remove();  // in case user opened keyboard shortcuts
        reveal('#bar button.save',
            t('intro.startediting.save'), {
                buttonText: t('intro.ok'),
                buttonCallback: function() { showStart(); }
            }
        );
    }

    function showStart() {
        d3.selectAll('.shaded').remove();  // in case user opened keyboard shortcuts

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
                .append('svg')
                .attr('class', 'illustration')
                .append('use')
                .attr('xlink:href', '#logo-walkthrough');

            startbutton
                .append('h2')
                .text(t('intro.startediting.start'));

        dispatch.call('startEditing');
    }


    chapter.enter = function() {
        showHelp();
    };


    chapter.exit = function() {
        modalSelection.remove();
        d3.selectAll('.shaded').remove();  // in case user opened keyboard shortcuts
    };


    return utilRebind(chapter, dispatch, 'on');
}
