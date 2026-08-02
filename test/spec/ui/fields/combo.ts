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
            const field = iD.presetField('a', { key: 'destination:symbol', type: 'semiCombo' });
            const instance = iD.uiFieldCombo(field, context);
            selection.call(instance);
            instance.tags({ 'destination:symbol': 'none;none;Jurong East;none;Māngere' });

            expect(selection.selectAll('li.raw-value').nodes()).toHaveLength(3); // not 5
        });

        it('supports duplicates when allowDuplicates is true', () => {
            const field = iD.presetField('a', {
                key: 'destination:symbol',
                type: 'semiCombo',
                allowDuplicates: true,
            });

            const onChange = vi.fn();

            const instance = iD.uiFieldCombo(field, context);
            selection.call(instance);

            const tags = { 'destination:symbol': 'none;none;Jurong East;none;Māngere' };
            instance.tags(tags);
            instance.on('change', onChange);

            expect(selection.selectAll('li.raw-value').nodes()).toHaveLength(5);

            // click the remove button from the 4th value
            selection.select('li.raw-value:nth-child(4) a.remove').dispatch('click');

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith({
                // the `none` value at the correct index was deleted
                'destination:symbol': 'none;none;Jurong East;Māngere',
            });
        });

        it('does not add duplicates if the only difference is whitespace', () => {
            const field = iD.presetField('a', { key: 'destination', type: 'semiCombo' });

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
                destination: 'none;kirribilli', // whitespace was trimmed, no duplicate
            });
        });
    });
});
