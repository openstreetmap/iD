import { dispatch as d3_dispatch } from 'd3-dispatch';

import { t } from '../../util/locale';
import { uiConfirm } from '../confirm';
import { utilNoAuto, utilRebind } from '../../util';


export function uiSettingsCustomTasking(context) {
    var dispatch = d3_dispatch('change');

    function render(selection) {
        // keep separate copies of original and current settings
        var _origSettings = context.tasking().customSettings();
        var _currSettings = context.tasking().customSettings();

        var placeholder = 'https://{m}/project/{p}/task/{t}';
        var example = 'https://tasks.hotosm.org/api/v1/project/1/task/10';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-tasking', true);

        modal.select('.modal-section.header')
            .append('h3')
            .text(t('settings.custom_tasking.header'));


        var textSection = modal.select('.modal-section.message-text');

        textSection
            .append('pre')
            .attr('class', 'instructions-template')
            .text(t('settings.custom_tasking.instructions', { placeholder: placeholder, example: example }));

        textSection
            .append('textarea')
            .attr('class', 'field-template')
            .attr('placeholder', t('settings.custom_tasking.template.placeholder'))
            .call(utilNoAuto)
            .property('value', function() { return _currSettings.template || null; });


        // insert a cancel button
        var buttonSection = modal.select('.modal-section.buttons');

        buttonSection
            .insert('button', '.ok-button')
            .attr('class', 'button cancel-button secondary-action')
            .text(t('confirm.cancel'));


        buttonSection.select('.cancel-button')
            .on('click.cancel', clickCancel);

        buttonSection.select('.ok-button')
            .attr('disabled', isSaveDisabled)
            .on('click.save', clickSave);


        function isSaveDisabled() {
            return null;
        }


        // restore the original template
        function clickCancel() {
            textSection.select('.field-template').property('value', _origSettings);
            context.tasking().customSettings(_origSettings);
            this.blur();
            modal.close();
        }

        // accept the current template
        function clickSave() {
            _currSettings.template = textSection.select('.field-template').property('value');
            context.tasking().customSettings(_currSettings);
            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }
    }

    return utilRebind(render, dispatch, 'on');
}



// import { dispatch as d3_dispatch } from 'd3-dispatch';

// import { t } from '../../util/locale';
// import { uiConfirm } from '../confirm';
// import { utilNoAuto, utilRebind } from '../../util';


// export function uiSettingsCustomTasking(context) {
//     var dispatch = d3_dispatch('change');

//     function render(selection) {
//         // keep separate copies of original and current settings
//         var _origSettings = {
//             template: context.tasking().customSettings()
//             // template: context.storage('background-custom-template')
//         };
//         var _currSettings = {
//             template: context.tasking().customSettings()
//             // template: context.storage('background-custom-template')
//         };

//         var example = 'https://tasks.hotosm.org/api/v1/project/{x}/task/{y}.';
//         var modal = uiConfirm(selection).okButton();

//         modal
//             .classed('settings-modal settings-custom-tasking', true);

//         modal.select('.modal-section.header')
//             .append('h3')
//             .text(t('tasking.managers.custom.header'));


//         var textSection = modal.select('.modal-section.message-text');

//         textSection
//             .append('pre')
//             .attr('class', 'instructions-template')
//             .text(t('tasking.managers.custom.instructions', { example: example }));

//         textSection
//             .append('textarea')
//             .attr('class', 'field-template')
//             .attr('placeholder', t('settings.custom_background.template.placeholder'))
//             .call(utilNoAuto)
//             .property('value', _currSettings.template);


//         // insert a cancel button
//         var buttonSection = modal.select('.modal-section.buttons');

//         buttonSection
//             .insert('button', '.ok-button')
//             .attr('class', 'button cancel-button secondary-action')
//             .text(t('confirm.cancel'));


//         buttonSection.select('.cancel-button')
//             .on('click.cancel', clickCancel);

//         buttonSection.select('.ok-button')
//             .attr('disabled', isSaveDisabled)
//             .on('click.save', clickSave);


//         function isSaveDisabled() {
//             return null;
//         }


//         // restore the original template
//         function clickCancel() {
//             textSection.select('.field-template').property('value', _origSettings.template);
//             context.storage('background-custom-template', _origSettings.template);
//             this.blur();
//             modal.close();
//         }

//         // accept the current template
//         function clickSave() {
//             _currSettings.template = textSection.select('.field-template').property('value');
//             context.storage('background-custom-template', _currSettings.template);
//             this.blur();
//             modal.close();
//             dispatch.call('change', this, _currSettings);
//         }
//     }

//     return utilRebind(render, dispatch, 'on');
// }






// // import { dispatch as d3_dispatch } from 'd3-dispatch';
// // import { event as d3_event } from 'd3-selection';

// // import { t } from '../../util/locale';
// // import { uiConfirm } from '../confirm';
// // import { utilNoAuto, utilRebind } from '../../util';


// // export function uiTaskData(context) {
// //     var dispatch = d3_dispatch('change');

// //     function render(selection) {

// //         // keep separate copies of original and current settings
// //         var _origSettings = {
// //             url: context.storage('settings-tasks-data-url')
// //         };
// //         var _currSettings = {
// //             url: context.storage('settings-tasks-data-url')
// //         };

// //         // var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
// //         var modal = uiConfirm(selection).okButton();

// //         modal
// //             .classed('settings-modal settings-tasks-data', true);

// //         modal.select('.modal-section.header')
// //             .append('h3')
// //             .text(t('settings.custom_data.header'));


// //         var textSection = modal.select('.modal-section.message-text');

// //         textSection
// //             .append('textarea')
// //             .attr('class', 'field-url')
// //             .attr('placeholder', t('settings.custom_data.url.placeholder'))
// //             .call(utilNoAuto)
// //             .property('value', _currSettings.url);


// //         // insert a cancel button
// //         var buttonSection = modal.select('.modal-section.buttons');

// //         buttonSection
// //             .insert('button', '.ok-button')
// //             .attr('class', 'button cancel-button secondary-action')
// //             .text(t('confirm.cancel'));


// //         buttonSection.select('.cancel-button')
// //             .on('click.cancel', clickCancel);

// //         buttonSection.select('.ok-button')
// //             .attr('disabled', isSaveDisabled)
// //             .on('click.save', clickSave);


// //         function isSaveDisabled() {
// //             return null;
// //         }


// //         // restore the original url
// //         function clickCancel() {
// //             textSection.select('.field-url').property('value', _origSettings.url);
// //             context.storage('settings-tasks-data-url', _origSettings.url);
// //             this.blur();
// //             modal.close();
// //         }

// //         // accept the current url
// //         function clickSave() {
// //             _currSettings.url = textSection.select('.field-url').property('value').trim();

// //             context.storage('settings-tasks-data-url', _currSettings.url);
// //             this.blur();
// //             modal.close();
// //             dispatch.call('change', this, _currSettings);
// //         }
// //     }

// //     return utilRebind(render, dispatch, 'on');
// // }

