import type { Field } from '@openstreetmap/id-tagging-schema';
import { select as d3_select } from 'd3-selection';

describe('iD.uiFieldCombo', () => {
    describe('combo', () => {
        let context: iD.Context;
        let selection: d3.Selection<HTMLDivElement>;
        let originalTaginfo: typeof iD.services.taginfo;

        beforeEach(() => {
            selection = d3_select(document.createElement('div'));
            document.body.appendChild(selection.node()!);
            context = iD.coreContext().assetPath('../dist/').init();
            context.container(selection as unknown as d3.Selection<HTMLElement>);
            originalTaginfo = iD.services.taginfo;
        });

        afterEach(() => {
            iD.services.taginfo = originalTaginfo;
            selection.remove();
        });

        it('shows Taginfo descriptions for static options when suggestions are disabled', async () => {
            const taginfo = {
                values: vi.fn((_params: unknown, callback: Parameters<typeof iD.services.taginfo.values>[1]) => {
                    callback(null, [
                        { value: 'fixed', title: 'A description from Taginfo' },
                        { value: 'fixed_extra', title: 'An additional Taginfo suggestion' }
                    ]);
                })
            };
            iD.services.taginfo = taginfo as unknown as typeof iD.services.taginfo;

            const field = iD.presetField('a', {
                key: 'example',
                type: 'combo',
                options: ['fixed'],
                autoSuggestions: false,
                strings: { options: { fixed: 'Fixed option' } },
                label: 'Example'
            } as unknown as Field);
            const instance = iD.uiFieldCombo(field, context);
            selection.call(instance);

            // Wait for the static options to be installed by initCombo.
            await new Promise(resolve => { setTimeout(resolve, 0); });

            const input = selection.select<HTMLInputElement>('input');
            input.node()!.focus();
            iD.utilGetSetValue(input, 'fix');
            input.dispatch('input');

            expect(taginfo.values).toHaveBeenCalled();
            const options = selection.selectAll<HTMLAnchorElement, unknown>('.combobox-option').nodes();
            expect(options).toHaveLength(1);
            expect(options[0].getAttribute('title')).toContain('A description from Taginfo');
        });
    });

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
});
