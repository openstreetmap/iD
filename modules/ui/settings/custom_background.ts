import { dispatch as d3_dispatch } from 'd3-dispatch';
import { marked } from 'marked';

import { localizer, t } from '../../core/localizer';
import type { CustomTemplate } from '../../renderer/custom_backgrounds';
import { utilNoAuto, utilRebind } from '../../util';
import { uiConfirm } from '../confirm';
import { uiDisclosure } from '../disclosure';


/**
 * Modal for adding or editing a single custom background.
 * Open with `.call(settings, entry)` to edit, or `.call(settings)` / `.call(settings, null)`
 * to add. Dispatches `change` with `{ source }` on save.
 */
export function uiSettingsCustomBackground(context: iD.Context) {
    const dispatch = d3_dispatch('change');

    function render(selection: d3.Selection<HTMLElement>, entry?: CustomTemplate | null) {
        const current = entry || null;
        const isEdit = !!(current && current.id);
        const origName = current ? (current.name || '') : '';
        const origTemplate = current ? (current.template || '') : '';

        const example = 'https://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        const modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-background', true);

        modal.select('.modal-section.header')
            .append('h3')
            .call(t.append('settings.custom_background.header'));


        const textSection = modal.select('.modal-section.message-text');

        // license disclaimer, shown as a callout
        const licenseMarkdown =
            `${localizer.t_html('settings.custom_background.instructions.license_disclaimer')} ` +
            `[${localizer.t_html('settings.custom_background.instructions.license_faq')}](${t('settings.custom_background.instructions.license_faq_url')})`;

        const calloutDiv = textSection
            .append('div')
            .attr('class', 'settings-custom-background-callout')
            .html(marked.parse(licenseMarkdown, { async: false }));
        calloutDiv.selectAll('p').attr('dir', 'auto');
        calloutDiv.selectAll('a')   // "Read more" opens in a new tab
            .attr('target', '_blank')
            .attr('rel', 'noopener');

        // optional display name
        textSection
            .append('label')
            .attr('class', 'field-name-label')
            .call(t.append('settings.custom_background.name.label'));

        const nameInput = textSection
            .append('input')
            .attr('class', 'field-name')
            .attr('type', 'text')
            .call(utilNoAuto)
            .property('value', origName);

        // tile URL template
        textSection
            .append('label')
            .attr('class', 'field-template-label')
            .call(t.append('settings.custom_background.template.label'));

        const templateInput = textSection
            .append('textarea')
            .attr('class', 'field-template')
            .attr('placeholder', t('settings.custom_background.template.placeholder'))
            .call(utilNoAuto)
            .on('input.custom-background', updateSaveDisabled)
            .property('value', origTemplate);

        // form help directly under the template field (div, not p — modal-section
        // adds padding-bottom to non-last p elements)
        const exampleRow = textSection
            .append('div')
            .attr('class', 'instructions-example deemphasize');

        exampleRow
            .append('span')
            .call(t.append('settings.custom_background.instructions.example'));

        exampleRow
            .append('code')
            .text(example);

        // collapsible WMS/TMS token reference (closed by default)
        const instructions = textSection
            .append('div')
            .attr('class', 'instructions-template');

        function tokenDisclosure(key: string, labelPath: string, tokenPaths: string[]) {
            instructions
                .append('div')
                .call(uiDisclosure(context, key, false)
                    .expanded(false)
                    .updatePreference(false)
                    .label(() => t.append(labelPath))
                    .content((contentSelection: d3.Selection<HTMLElement>) => {
                        // disclosure re-calls content on every expand; only
                        // build the list once
                        const list = contentSelection.selectAll('.token-list')
                            .data([0]);
                        list.enter()
                            .append('div')
                            .attr('class', 'token-list')
                            .html(marked.parse(tokenPaths
                                .map(path => `* ${localizer.t_html(path)}`)
                                .join('\n'), { async: false }))
                            .selectAll('p')
                            .attr('dir', 'auto');
                    })
                );
        }

        tokenDisclosure(
            'custom_background_wms_tokens',
            'settings.custom_background.instructions.wms.tokens_label',
            [
                'settings.custom_background.instructions.wms.tokens.proj',
                'settings.custom_background.instructions.wms.tokens.wkid',
                'settings.custom_background.instructions.wms.tokens.dimensions',
                'settings.custom_background.instructions.wms.tokens.bbox'
            ]
        );

        tokenDisclosure(
            'custom_background_tms_tokens',
            'settings.custom_background.instructions.tms.tokens_label',
            [
                'settings.custom_background.instructions.tms.tokens.xyz',
                'settings.custom_background.instructions.tms.tokens.flipped_y',
                'settings.custom_background.instructions.tms.tokens.switch',
                'settings.custom_background.instructions.tms.tokens.quadtile',
                'settings.custom_background.instructions.tms.tokens.scale_factor'
            ]
        );


        // insert a cancel button
        const buttonSection = modal.select('.modal-section.buttons');

        buttonSection
            .insert('button', '.ok-button')
            .attr('class', 'button cancel-button secondary-action')
            .call(t.append('confirm.cancel'));


        buttonSection.select<HTMLButtonElement>('.cancel-button')
            .on('click.cancel', clickCancel);

        buttonSection.select<HTMLButtonElement>('.ok-button')
            .on('click.save', clickSave);

        updateSaveDisabled();

        // focus the name field when the modal opens (uiConfirm's okButton() focuses
        // the OK button by default; focusing here overrides that)
        nameInput.node()?.focus();


        // keep Save disabled while the URL template is empty, so a save can never
        // silently drop the edit. Paste whitespace is cleaned on save before
        // persistence. Use the trash button to delete.
        function updateSaveDisabled() {
            buttonSection.select('.ok-button')
                .attr('disabled', String(templateInput.property('value')).trim() ? null : true);
        }

        // close without changing anything
        function clickCancel(this: HTMLButtonElement) {
            this.blur();
            modal.close();
        }

        // add or update the custom background, then notify the list
        function clickSave(this: HTMLButtonElement) {
            const template = String(templateInput.property('value'));
            const name = String(textSection.select('.field-name').property('value'));
            if (!template.trim()) return;   // Save is disabled in this state; guard anyway

            this.blur();
            modal.close();

            const background = context.background();
            let source;
            if (isEdit && current) {
                source = background.updateCustomSource(current.id, { template: template, name: name });
            } else {
                source = background.addOrGetCustomSource(template, name);
            }

            dispatch.call('change', this, { source: source });
        }
    }


    return utilRebind(render, dispatch, 'on');
}
