import type { Field } from '@openstreetmap/id-tagging-schema';
import { select as d3_select } from 'd3-selection';

describe('iD.uiFieldCombo', () => {
    describe('semiCombo', () => {
        let context: iD.Context;
        let selection: d3.Selection<HTMLDivElement>;

        beforeEach(() => {
            context = iD.coreContext().assetPath('../dist/').init();
            selection = d3_select(document.createElement('div'));
        });

        it('filters out duplicates by default', () => {
            const field = iD.presetField('a', { key: 'destination:symbol', type: 'semiCombo' } as Field);
            const instance = iD.uiFieldCombo(field, context);
            selection.call(instance);
            instance.tags({ 'destination:symbol': 'none;none;Jurong East;none;Māngere' });

            expect(selection.selectAll('li.raw-value').nodes()).toHaveLength(3); // not 5
        });

        it('supports duplicates when allowDuplicates is true', () => {
            const field = iD.presetField('a', {
                key: 'destination:symbol',
                type: 'semiCombo',
                allowDuplicates: true
            } as Field);

            const onChange = vi.fn();

            const instance = iD.uiFieldCombo(field, context);
            selection.call(instance);

            let tags = { 'destination:symbol': 'none;none;Jurong East;none;Māngere' };
            instance.tags(tags);
            instance.on('change', onChange);

            expect(selection.selectAll('li.raw-value').nodes()).toHaveLength(5);

            // click the remove button from the 4th value
            selection.select('li.raw-value:nth-child(4) a.remove').dispatch('click');

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith({
                // the `none` value at the correct index was deleted
                'destination:symbol': 'none;none;Jurong East;Māngere'
            });
        });

        it('does not add duplicates if the only difference is whitespace', () => {
            const field = iD.presetField('a', { key: 'destination', type: 'semiCombo' } as Field);

            const onChange = vi.fn();

            const instance = iD.uiFieldCombo(field, context);
            selection.call(instance);
            instance.tags({ destination: 'none; kirribilli' }); // space before value
            instance.on('change', onChange);

            const input = selection.selectAll('.form-field-input-wrap input');
            iD.utilGetSetValue(input, 'kirribilli'); // add the same value again
            input.dispatch('change');

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith({
                destination: 'none;kirribilli' // whitespace was trimmed, no duplicate
            });
        });
    });

    describe('combo', () => {
        let context: iD.Context;
        let selection: d3.Selection<HTMLDivElement>;
        let originalRegionalTranslations: unknown;
        const regionalTranslations = {
            options: {
                zebra: 'Longitudinal Bars',
                surface: 'Surface Treatment Only'
            }
        };
        beforeEach(() => {
            context = iD.coreContext().assetPath('../dist/').init();
            selection = d3_select(document.createElement('div'));

            const localizerInternals = iD.localizer as any;
            const fields = localizerInternals._localeStrings.tagging.en.presets.fields;

            originalRegionalTranslations = fields['crossing/markings-BG'];
            fields['crossing/markings-BG'] = regionalTranslations;
        });

        afterEach(() => {
            const localizerInternals = iD.localizer as any;
            const fields = localizerInternals._localeStrings.tagging.en.presets.fields;

            if (originalRegionalTranslations === undefined) {
                delete fields['crossing/markings-BG'];
            } else {
                fields['crossing/markings-BG'] = originalRegionalTranslations;
            }
        });

        it('preserves the canonical value for translated options excluded from regional options', () => {
            const field = iD.presetField('crossing/markings-BG', {
                key: 'crossing:markings',
                type: 'combo',
                autoSuggestions: false,
                options: ['zebra', 'no', 'dots', 'dashes', 'yes']
            } as Field);

            const instance = iD.uiFieldCombo(field, context);
            selection.call(instance);

            const onChange = vi.fn();
            instance.on('change', onChange);

            const input = selection.select<HTMLInputElement>('input');

            iD.utilGetSetValue(input, 'Surface Treatment Only');
            input.dispatch('blur');

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith({
                'crossing:markings': 'surface'
            });
            expect(field.options).not.toContain('surface');
        });

        it('displays excluded translated options using their canonical value', () => {
            const field = iD.presetField('crossing/markings-BG', {
                key: 'crossing:markings',
                type: 'combo',
                autoSuggestions: false,
                options: ['zebra', 'no', 'dots', 'dashes', 'yes']
            } as Field);

            const instance = iD.uiFieldCombo(field, context);
            selection.call(instance);

            const input = selection.select<HTMLInputElement>('input');

            instance.tags({ 'crossing:markings': 'surface' });

            expect(iD.utilGetSetValue(input)).toBe('surface');
        });

        it('translates configured options when displaying their canonical value', () => {
            const field = iD.presetField('crossing/markings-BG', {
                key: 'crossing:markings',
                type: 'combo',
                autoSuggestions: false,
                options: ['zebra', 'no', 'dots', 'dashes', 'yes']
            } as Field);

            const instance = iD.uiFieldCombo(field, context);
            selection.call(instance);

            const input = selection.select<HTMLInputElement>('input');

            instance.tags({ 'crossing:markings': 'zebra' });

            expect(iD.utilGetSetValue(input)).toBe('Longitudinal Bars');
        });
    });
});
