import { rtlRegex } from '../../../modules/util/svg_paths_rtl_fix';

describe('rtlRegex', () => {
    it('classifies Arabic text as right-to-left', () => {
        expect(rtlRegex.test('اَلْعَرَبِيَّةُ')).toBe(true);
    });

    it('does not classify text with an en dash as right-to-left', () => {
        expect(rtlRegex.test('June–July 1967')).toBe(false);
    });
});
