import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';
import type { LensEntry } from '../../core/lenses';
import {
    LENS_PREF,
    UPLOADED_LENSES_PREF,
    addUploadedLens,
    getSelectedLensId,
    getUploadedLenses,
    listLenses,
    removeUploadedLens,
    setSelectedLensId
} from '../../core/lenses';

/**
 * Preferences section to pick a UI lens: the built-in default, or a CSS file
 * imported by the user (kept in localStorage). Selecting a lens injects its CSS
 * and applies its tag-based styling to the map.
 *
 * @param context - the iD application context
 * @returns the section
 */
export function uiSectionLenses(context: any) {

    // uiSection is authored in JS; its fluent setters are added dynamically and
    // are not visible to TS, hence the `any`.
    const section: any = (uiSection('preferences-lenses', context) as any)
        .label(() => t.append('preferences.lens.title'))
        .disclosureContent(renderDisclosureContent);

    /** Display label for a lens entry (the built-in one is localized). */
    function lensLabel(entry: LensEntry): string {
        return entry.source === 'default' ? t('preferences.lens.default') : (entry.name || entry.id);
    }

    /** Read the selected CSS file, store it as a lens and select it. */
    function onUploadFile(this: HTMLInputElement) {
        const file = this.files && this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const lens = addUploadedLens({
                name: file.name.replace(/\.css$/i, ''),
                css: String(reader.result || '')
            });
            setSelectedLensId(lens.id);
        };
        reader.readAsText(file);
        this.value = '';  // allow re-importing the same filename
    }

    function renderDisclosureContent(selection: any) {
        let container = selection.selectAll('.lens-options-container').data([0]);

        const containerEnter = container.enter()
            .append('div')
            .attr('class', 'display-options-container lens-options-container');

        // lens picker
        const pickerEnter = containerEnter.append('div').attr('class', 'lens-pref');
        pickerEnter.append('label')
            .attr('class', 'lens-select-label')
            .call(t.append('preferences.lens.select'));
        pickerEnter.append('select')
            .attr('class', 'lens-select')
            .on('change', function(this: HTMLSelectElement) { setSelectedLensId(this.value); });

        // inline CSS import
        const uploadEnter = containerEnter.append('div').attr('class', 'lens-pref lens-upload');
        uploadEnter.append('label')
            .attr('class', 'lens-upload-label')
            .call(t.append('preferences.lens.upload'));
        uploadEnter.append('input')
            .attr('type', 'file')
            .attr('class', 'lens-upload-input')
            .attr('accept', '.css,text/css')
            .on('change', onUploadFile);
        uploadEnter.append('div')
            .attr('class', 'editing-option-description')
            .call(t.append('preferences.lens.upload_description'));
        uploadEnter.append('div')
            .attr('class', 'editing-option-description lens-upload-warning')
            .call(t.append('preferences.lens.upload_warning'));

        container = containerEnter.merge(container);

        // update: lens options
        const options = container.select('.lens-select')
            .selectAll('option')
            .data(listLenses(), (d: LensEntry) => d.id);
        options.exit().remove();
        options.enter().append('option')
            .merge(options)
            .attr('value', (d: LensEntry) => d.id)
            .text(lensLabel);
        container.select('.lens-select').property('value', getSelectedLensId());

        // update: uploaded lenses list with remove buttons
        renderUploadedList(container);
    }

    function renderUploadedList(container: any) {
        const list = container.selectAll('.lens-uploaded-list').data([0]);
        const listMerged = list.enter()
            .append('ul')
            .attr('class', 'layer-list lens-uploaded-list')
            .merge(list);

        const items = listMerged.selectAll('.lens-uploaded-item')
            .data(getUploadedLenses(), (d: any) => d.id);
        items.exit().remove();

        const itemsEnter = items.enter()
            .append('li')
            .attr('class', 'lens-uploaded-item');
        itemsEnter.append('span').attr('class', 'lens-uploaded-name');
        itemsEnter.append('button')
            .attr('class', 'lens-uploaded-remove')
            .attr('title', () => t('preferences.lens.remove'))
            .on('click', (_d3_event: any, d: any) => removeUploadedLens(d.id))
            .call(svgIcon('#iD-operation-delete'));

        itemsEnter.merge(items).select('.lens-uploaded-name').text((d: any) => d.name);
    }

    prefs.onChange(LENS_PREF, section.reRender);
    prefs.onChange(UPLOADED_LENSES_PREF, section.reRender);

    return section;
}
