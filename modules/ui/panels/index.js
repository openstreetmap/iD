export * from './history';
export * from './imagery';
export * from './location';
export * from './measurement';

import { uiPanelHistory } from './history';
import { uiPanelImagery } from './imagery';
import { uiPanelLocation } from './location';
import { uiPanelMeasurement } from './measurement';

export var uiInfoPanels = {
    history: uiPanelHistory,
    imagery: uiPanelImagery,
    location: uiPanelLocation,
    measurement: uiPanelMeasurement,
};
