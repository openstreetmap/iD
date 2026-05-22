/**
 * Shared directional-combo arrow geometry.
 * Keep map markers and sidebar label arrows visually aligned.
 */
export const DIRECTIONAL_COMBO_ARROW_VIEWBOX = '0 0 2 2.8';
// Keep shaft width at 1/4 of total arrow width (0.5 on a width-2 viewBox),
// and use a short stump so direction reads clearly.
export const DIRECTIONAL_COMBO_ARROW_UP_PATH = 'M 0,1.1 L 1,0 L 2,1.1 L 1.25,1.1 L 1.25,1.6 L 0.75,1.6 L 0.75,1.1 Z';
export const DIRECTIONAL_COMBO_ARROW_DOWN_PATH = 'M 0,1.7 L 1,2.8 L 2,1.7 L 1.25,1.7 L 1.25,1.2 L 0.75,1.2 L 0.75,1.7 Z';

