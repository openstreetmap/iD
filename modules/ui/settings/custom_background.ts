import { dispatch as d3_dispatch } from 'd3-dispatch';
import { marked } from 'marked';

import { localizer, t } from '../../core/localizer';
import type { CustomTemplate } from '../../renderer/custom_backgrounds';
import { svgIcon } from '../../svg/icon';
import { utilNoAuto, utilRebind } from '../../util';
import { uiConfirm } from '../confirm';
import { uiDisclosure } from '../disclosure';


type CustomBackgroundModal = d3.Selection<HTMLElement> & {
    close: () => void;
    okButton: () => CustomBackgroundModal;
};

type RenderFn = ((selection: d3.Selection<HTMLElement>) => void) & {
    forEntry: (entry: CustomTemplate | null | undefined) => RenderFn;
    on: (...args: unknown[]) => RenderFn;
};


/**
 * Modal for adding or editing a single custom background. Use `forEntry(entry)`
 * to edit an existing entry (`{ id, name, template }`) or `forEntry(null)` to add
 * a new one, then call the returned render with a selection. Dispatches `change`
 * with `{ source }` (the affected/selected source) on save.
 */
export function uiSettingsCustomBackground(context: iD.Context): RenderFn {
    const dispatch = d3_dispatch('change');
    // the entry being edited, or null when adding a new one
    let _entry: CustomTemplate | null = null;

    function render(selection: d3.Selection<HTMLElement>) {
        const isEdit = !!(_entry && _entry.id);
        const origName = isEdit ? (_entry!.name || '') : '';
        const origTemplate = isEdit ? (_entry!.template || '') : '';

        const example = 'https://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        const modal = uiConfirm(selection).okButton() as unknown as CustomBackgroundModal;

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
            .html(marked.parse(licenseMarkdown) as string);
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
            // utilNoAuto is typed against a loose d3.Selection
            .call(utilNoAuto as any)
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
            .call(utilNoAuto as any)
            .on('input.custom-background', updateSaveDisabled)
            .property('value', origTemplate);

        // help block: a help icon, collapsible WMS/TMS token refs (closed by
        // default), then the always-visible example URL
        const helpBlock = textSection
            .append('div')
            .attr('class', 'settings-custom-background-help');

        helpBlock
            .call(svgIcon('#iD-icon-help', 'inline'));

        const instructions = helpBlock
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
                                .join('\n')) as string)
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

        const exampleRow = instructions
            .append('div')
            .attr('class', 'instructions-example');

        exampleRow
            .append('span')
            .attr('class', 'instructions-example-label')
            .call(t.append('settings.custom_background.instructions.example'));

        exampleRow
            .append('code')
            .text(example);


        // insert a cancel button
        const buttonSection = modal.select('.modal-section.buttons');

        buttonSection
            .insert('button', '.ok-button')
            .attr('class', 'button cancel-button secondary-action')
            .call(t.append('confirm.cancel'));


        buttonSection.select('.cancel-button')
            .on('click.cancel', clickCancel);

        buttonSection.select('.ok-button')
            .on('click.save', clickSave);

        updateSaveDisabled();

        // focus the name field when the modal opens (uiConfirm's okButton() focuses
        // the OK button by default; focusing here overrides that)
        nameInput.node()!.focus();


        // keep Save disabled while the URL template is empty, so a save can never
        // silently drop the edit. Paste whitespace is cleaned on save before
        // persistence. Use the trash button to delete.
        function updateSaveDisabled() {
            buttonSection.select('.ok-button')
                .attr('disabled', templateInput.property('value').trim() ? null : true);
        }

        // close without changing anything
        function clickCancel(this: any) {
            _entry = null;
            this.blur();
            modal.close();
        }

        // add or update the custom background, then notify the list
        function clickSave(this: any) {
            const template = templateInput.property('value') as string;
            const name = textSection.select('.field-name').property('value') as string;
            if (!template.trim()) return;   // Save is disabled in this state; guard anyway

            this.blur();
            modal.close();

            const background = context.background() as any;
            let source;
            if (isEdit && _entry) {
                source = background.updateCustomSource(_entry.id, { template: template, name: name });
            } else {
                source = background.addOrGetCustomSource(template, name);
            }

            _entry = null;
            dispatch.call('change', this, { source: source });
        }
    }


    // Set the entry to edit before opening; pass null/undefined to add a new one.
    (render as RenderFn).forEntry = function(entry) {
        _entry = entry || null;
        return render as RenderFn;
    };


    return utilRebind(render, dispatch, 'on') as unknown as RenderFn;
}
