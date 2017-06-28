export * from './location';
export * from './measurement';

import { uiInfoLocation } from './location';
import { uiInfoMeasurement } from './measurement';

export var uiInfoWidgets = {
    location: uiInfoLocation,
    measurement: uiInfoMeasurement,
};
