import { t } from '../../core/localizer';
import { presetManager } from '../../presets';
import { PRESET_GALLERY_LAYOUT, actionAddPresetGallery, presetGallerySegment } from '../../actions/add_preset_gallery';
import { uiSection } from '../section';

/** Zoom level at which the gallery opens: editable, with segments 10 m apart still distinct. */
const GALLERY_ZOOM = 18;

/**
 * Tags of every line preset (no categories or brand suggestions), sorted by preset id,
 * with each preset's addTags applied as when it is picked (`*` values become `yes`).
 * @returns one tag set per preset
 */
export function presetGalleryTagSets(): Record<string, string>[] {
    return presetManager.collection
        .filter((preset: any) =>
            // categories have members; suggestions are brand (NSI) presets
            !preset.members &&
            !preset.suggestion &&
            !preset.replacement &&
            preset.geometry.includes('line') &&
            preset.searchable !== false &&
            !preset.isFallback() &&
            Object.keys(preset.tags).length > 0
        )
        .sort((a: any, b: any) => a.id.localeCompare(b.id))
        .map((preset: any) => preset.setTags({}, 'line', true));
}

/**
 * Map data section (fork) with a button that draws one segment per line preset
 * in the open ocean, to check the map colors and styles of all way presets.
 * The ways are a normal edit: undo it before saving.
 * @param context - the iD application context
 * @returns the section
 */
export function uiSectionPresetGallery(context: any) {

    // uiSection is authored in JS; its fluent setters are not visible to TS, hence the `any`.
    const section: any = (uiSection('map-data-preset-gallery', context) as any)
        .label(() => t.append('map_data.preset_gallery.title'))
        .disclosureContent(renderDisclosureContent)
        .expandedByDefault(false);

    function renderDisclosureContent(selection: any) {
        const containerEnter = selection.selectAll('.preset-gallery').data([0])
            .enter()
            .append('div')
            .attr('class', 'preset-gallery');

        containerEnter.append('button')
            .attr('class', 'secondary-action button preset-gallery-add')
            .on('click', addGallery)
            .call(t.append('map_data.preset_gallery.add'));
        containerEnter.append('div')
            .attr('class', 'editing-option-description')
            .call(t.append('map_data.preset_gallery.description', {
                length: PRESET_GALLERY_LAYOUT.segmentLengthMeters,
                spacing: PRESET_GALLERY_LAYOUT.spacingMeters
            }));
    }

    function addGallery() {
        const tagSets = presetGalleryTagSets();
        context.perform(
            actionAddPresetGallery(tagSets),
            t('map_data.preset_gallery.annotation', { n: tagSets.length })
        );
        // open on the middle of the first row
        const [south, north] = presetGallerySegment(Math.floor(PRESET_GALLERY_LAYOUT.segmentsPerRow / 2));
        context.map().centerZoomEase([south[0], (south[1] + north[1]) / 2], GALLERY_ZOOM);
    }

    return section;
}
