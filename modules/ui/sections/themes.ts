import { prefs } from '../../core/preferences';
import { t } from '../../core/localizer';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';
import type { ThemeEntry } from '../../core/themes';
import {
    THEME_PREF,
    UPLOADED_THEMES_PREF,
    addUploadedTheme,
    getSelectedThemeId,
    getUploadedThemes,
    listThemes,
    removeUploadedTheme,
    setSelectedThemeId
} from '../../core/themes';

/**
 * Preferences section to pick a UI theme: the built-in default, or a CSS file
 * imported by the user (kept in localStorage). Selecting a theme injects its CSS
 * and applies its tag-based styling to the map.
 *
 * @param context - the iD application context
 * @returns the section
 */
export function uiSectionThemes(context: any) {

    // uiSection is authored in JS; its fluent setters are added dynamically and
    // are not visible to TS, hence the `any`.
    const section: any = (uiSection('preferences-themes', context) as any)
        .label(() => t.append('preferences.theme.title'))
        .disclosureContent(renderDisclosureContent);

    /** Display label for a theme entry (the built-in one is localized). */
    function themeLabel(entry: ThemeEntry): string {
        return entry.source === 'default' ? t('preferences.theme.default') : (entry.name || entry.id);
    }

    /** Read the selected CSS file, store it as a theme and select it. */
    function onUploadFile(this: HTMLInputElement) {
        const file = this.files && this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const theme = addUploadedTheme({
                name: file.name.replace(/\.css$/i, ''),
                css: String(reader.result || '')
            });
            setSelectedThemeId(theme.id);
        };
        reader.readAsText(file);
        this.value = '';  // allow re-importing the same filename
    }

    function renderDisclosureContent(selection: any) {
        let container = selection.selectAll('.theme-options-container').data([0]);

        const containerEnter = container.enter()
            .append('div')
            .attr('class', 'display-options-container theme-options-container');

        // theme picker
        const pickerEnter = containerEnter.append('div').attr('class', 'theme-pref');
        pickerEnter.append('label')
            .attr('class', 'theme-select-label')
            .call(t.append('preferences.theme.select'));
        pickerEnter.append('select')
            .attr('class', 'theme-select')
            .on('change', function(this: HTMLSelectElement) { setSelectedThemeId(this.value); });

        // inline CSS import
        const uploadEnter = containerEnter.append('div').attr('class', 'theme-pref theme-upload');
        uploadEnter.append('label')
            .attr('class', 'theme-upload-label')
            .call(t.append('preferences.theme.upload'));
        uploadEnter.append('input')
            .attr('type', 'file')
            .attr('class', 'theme-upload-input')
            .attr('accept', '.css,text/css')
            .on('change', onUploadFile);
        uploadEnter.append('div')
            .attr('class', 'editing-option-description')
            .call(t.append('preferences.theme.upload_description'));

        container = containerEnter.merge(container);

        // update: theme options
        const options = container.select('.theme-select')
            .selectAll('option')
            .data(listThemes(), (d: ThemeEntry) => d.id);
        options.exit().remove();
        options.enter().append('option')
            .merge(options)
            .attr('value', (d: ThemeEntry) => d.id)
            .text(themeLabel);
        container.select('.theme-select').property('value', getSelectedThemeId());

        // update: uploaded themes list with remove buttons
        renderUploadedList(container);
    }

    function renderUploadedList(container: any) {
        const list = container.selectAll('.theme-uploaded-list').data([0]);
        const listMerged = list.enter()
            .append('ul')
            .attr('class', 'layer-list theme-uploaded-list')
            .merge(list);

        const items = listMerged.selectAll('.theme-uploaded-item')
            .data(getUploadedThemes(), (d: any) => d.id);
        items.exit().remove();

        const itemsEnter = items.enter()
            .append('li')
            .attr('class', 'theme-uploaded-item');
        itemsEnter.append('span').attr('class', 'theme-uploaded-name');
        itemsEnter.append('button')
            .attr('class', 'theme-uploaded-remove')
            .attr('title', () => t('preferences.theme.remove'))
            .on('click', (_d3_event: any, d: any) => removeUploadedTheme(d.id))
            .call(svgIcon('#iD-operation-delete'));

        itemsEnter.merge(items).select('.theme-uploaded-name').text((d: any) => d.name);
    }

    prefs.onChange(THEME_PREF, section.reRender);
    prefs.onChange(UPLOADED_THEMES_PREF, section.reRender);

    return section;
}
