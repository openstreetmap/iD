export * from './background';
export * from './history';
export * from './location';
export * from './measurement';

import type { LocalizedTextRenderer } from '../../core/localizer';
import { uiPanelBackground } from './background';
import { uiPanelHistory } from './history';
import { uiPanelLocation } from './location';
import { uiPanelMeasurement } from './measurement';


export interface Panel {
    (selection: d3.Selection): void;
    off(): void;
    id: string;
    label: LocalizedTextRenderer;
    key: string;
}
export type PanelId = keyof typeof uiInfoPanels;


export var uiInfoPanels = {
    background: uiPanelBackground,
    history: uiPanelHistory,
    location: uiPanelLocation,
    measurement: uiPanelMeasurement,
};
