export * from './history';
export * from './location';
export * from './measurement';

import { uiPanelHistory } from './history';
import { uiPanelLocation } from './location';
import { uiPanelMeasurement } from './measurement';

export var uiInfoPanels = {
    history: uiPanelHistory,
    location: uiPanelLocation,
    measurement: uiPanelMeasurement,
};
