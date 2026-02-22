import { describe, it, expect } from 'vitest';
import { osmTagSuggestingArea, osmSetAreaKeys } from '../modules/osm/tags.js';

describe('emergency=designated validation', () => {
    it('should NOT suggest area for emergency=designated', () => {
        osmSetAreaKeys({ emergency: {} });
        const tags = { emergency: 'designated' };
        const result = osmTagSuggestingArea(tags);
        expect(result).toBeNull();
    });
});
