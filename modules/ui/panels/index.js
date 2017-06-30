export * from './location';
export * from './measurement';

import { uiPanelLocation } from './location';
import { uiPanelMeasurement } from './measurement';

export var uiInfoPanels = {
    location: uiPanelLocation,
    measurement: uiPanelMeasurement,
};
