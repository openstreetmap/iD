import { t } from '../../core/localizer';
import { uiPane } from '../pane';

import { uiSectionDataLayers } from '../sections/data_layers';
import { uiSectionMapFeatureFilters } from '../sections/map_feature_filters';
import { uiSectionMapStyleOptions } from '../sections/map_style_options';
import { uiSectionPhotoOverlays } from '../sections/photo_overlays';

export function uiPaneMapData(context) {

    var mapDataPane = uiPane('map-data', context)
        .key(t('map_data.key'))
        .label(t.append('map_data.title'))
        .description(t.append('map_data.description'))
        .iconName('iD-icon-data')
        .sections([
            uiSectionDataLayers(context),
            uiSectionPhotoOverlays(context),
            uiSectionMapStyleOptions(context),
            uiSectionMapFeatureFilters(context)
        ]);

    return mapDataPane;
}
