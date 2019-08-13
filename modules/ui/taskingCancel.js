import { dispatch as d3_dispatch } from 'd3-dispatch';

import { modeBrowse } from '../modes/browse';

import { t } from '../util/locale';
import { uiConfirm } from './confirm';
import { utilRebind } from '../util';


export function uiTaskingCancel(context) {
    var dispatch = d3_dispatch('change');

    function render(selection) {

        var _number_changes = context.history().hasChanges() && context.history().difference().length();

        var tasking = context.tasking();
        var svg = context.layers().layer('tasking');

        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-tasking', true);

        modal.select('.modal-section.header')
            .append('h3')
            .text(t('tasking.cancel.header'));


        var textSection = modal.select('.modal-section.message-text');

        textSection
            .append('p')
            .attr('class', 'tasking-cancel-body')
            .text(function() {
                var _text = t('tasking.cancel.body');
                _text += _number_changes ?
                t('tasking.cancel.changes',
                    {
                        number_edits: _number_changes,
                        plural: function() {
                            var _plural = _number_changes > 1;
                            return _plural ? t('tasking.cancel.s') : '';
                        }
                    }
                ) : '';

                return _text;
            });


        // insert a cancel button
        var buttonSection = modal.select('.modal-section.buttons');

        buttonSection
            .insert('button', '.ok-button')
            .attr('class', 'button cancel-button action')
            .text(t('tasking.cancel.dont_cancel'));

        buttonSection.select('.cancel-button')
            .on('click.cancel', clickCancel);

        buttonSection.select('.ok-button')
            .classed('action', false)
            .attr('class', 'secondary-action')
            .text(t('tasking.cancel.accept'))
            .on('click.save', clickConfirm);


        // don't cancel tasking
        function clickCancel() {
            this.blur();
            modal.close();
        }

        // cancel tasking
        function clickConfirm() {
            // disable tasking
            svg.enabled(false);

            // reset current manager, project, and task
            tasking.resetProjectAndTask();

            // reset edits
            context.history().reset();

            context.enter(modeBrowse(context));

            this.blur();
            modal.close();

            dispatch.call('change', this);
        }
    }

    return utilRebind(render, dispatch, 'on');
}
