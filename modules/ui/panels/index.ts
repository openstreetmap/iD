export * from './background';
export * from './history';
export * from './location';
export * from './measurement';

import { uiPanelBackground } from './background';
import { uiPanelHistory } from './history';
import { uiPanelLocation } from './location';
import { uiPanelMeasurement } from './measurement';

export var uiInfoPanels = {
    background: uiPanelBackground,
    history: uiPanelHistory,
    location: uiPanelLocation,
    measurement: uiPanelMeasurement,
};
