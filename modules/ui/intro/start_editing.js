import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
    select as d3_select
} from 'd3-selection';

import { t } from '../../core/localizer';
import { helpHtml } from './helper';
import { uiModal } from '../modal';
import { utilRebind } from '../../util/rebind';


export function uiIntroStartEditing(context, reveal) {
    var dispatch = d3_dispatch('done', 'startEditing');
    var modalSelection = d3_select(null);


    var chapter = {
        title: 'intro.startediting.title'
    };

    function showHelp() {
        reveal('.map-control.help-control',
            helpHtml('intro.startediting.help'), {
                buttonText: t.html('intro.ok'),
                buttonCallback: function() { shortcuts(); }
            }
        );
    }

    function shortcuts() {
        reveal('.map-control.help-control',
            helpHtml('intro.startediting.shortcuts'), {
                buttonText: t.html('intro.ok'),
                buttonCallback: function() { showSave(); }
            }
        );
    }

    function showSave() {
        context.container().selectAll('.shaded').remove();  // in case user opened keyboard shortcuts
        reveal('.top-toolbar button.save',
            helpHtml('intro.startediting.save'), {
                buttonText: t.html('intro.ok'),
                buttonCallback: function() { showStart(); }
            }
        );
    }

    function showStart() {
        context.container().selectAll('.shaded').remove();  // in case user opened keyboard shortcuts

        modalSelection = uiModal(context.container());

        modalSelection.select('.modal')
            .attr('class', 'modal-splash modal');

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
                .attr('xlink:href', '#iD-logo-walkthrough');

            startbutton
                .append('h2')
                .html(t.html('intro.startediting.start'));

        dispatch.call('startEditing');
    }


    chapter.enter = function() {
        showHelp();
    };


    chapter.exit = function() {
        modalSelection.remove();
        context.container().selectAll('.shaded').remove();  // in case user opened keyboard shortcuts
    };


    return utilRebind(chapter, dispatch, 'on');
}
