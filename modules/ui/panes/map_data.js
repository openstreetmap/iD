import { t } from '../../core/localizer';
import { uiPane } from '../pane';

import { uiSectionDataLayers } from '../sections/data_layers';
import { uiSectionLenses } from '../sections/lenses';
import { uiSectionMapFeatures } from '../sections/map_features';
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
            uiSectionLenses(context),
            uiSectionMapFeatures(context)
        ]);

    return mapDataPane;
}
