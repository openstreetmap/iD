import {
    event as d3_event
} from 'd3-selection';

import { t } from '../../util/locale';
import { modeBrowse } from '../../modes/browse';
import { uiCmd } from '../cmd';
import { uiPane } from '../pane';

import { uiSectionDataLayers } from '../sections/data_layers';
import { uiSectionMapFeatures } from '../sections/map_features';
import { uiSectionMapStyleOptions } from '../sections/map_style_options';
import { uiSectionPhotoOverlays } from '../sections/photo_overlays';

export function uiPaneMapData(context) {

    context.keybinding()
        .on(t('area_fill.wireframe.key'), function toggleWireframe() {
            d3_event.preventDefault();
            d3_event.stopPropagation();
            context.map().toggleWireframe();
        })
        .on(uiCmd('⌥' + t('area_fill.wireframe.key')), function toggleOsmData() {
            d3_event.preventDefault();
            d3_event.stopPropagation();

            // Don't allow layer changes while drawing - #6584
            var mode = context.mode();
            if (mode && /^draw/.test(mode.id)) return;

            var layer = context.layers().layer('osm');
            if (layer) {
                layer.enabled(!layer.enabled());
                if (!layer.enabled()) {
                    context.enter(modeBrowse(context));
                }
            }
        })
        .on(t('map_data.highlight_edits.key'), function toggleHighlightEdited() {
            d3_event.preventDefault();
            context.map().toggleHighlightEdited();
        });

    var mapDataPane = uiPane('map-data', context)
        .key(t('map_data.key'))
        .title(t('map_data.title'))
        .description(t('map_data.description'))
        .iconName('iD-icon-data')
        .sections([
            uiSectionDataLayers(context),
            uiSectionPhotoOverlays(context),
            uiSectionMapStyleOptions(context),
            uiSectionMapFeatures(context)
        ]);

    return mapDataPane;
}
