import { select as d3_select } from 'd3-selection';
import { locationManager } from '../../../../modules';

function simulateKeydown(input: d3.Selection<HTMLInputElement>, keyCode: number) {
    input.node()!.dispatchEvent(new KeyboardEvent('keydown', { keyCode }));
}

describe('iD.uiFieldCombo', () => {
    describe('combo (optionsLocationSet)', () => {
        let context: iD.Context;
        let body: d3.Selection<HTMLElement>;
        let container: d3.Selection<HTMLElement>;
        let selection: d3.Selection<HTMLDivElement>;
        let realLocationSetsAt: typeof locationManager.locationSetsAt;

        beforeEach(() => {
            body = d3_select('body');
            container = body.append<HTMLElement>('div').attr('class', 'ideditor');
            context = iD.coreContext().assetPath('../dist/').init().container(container);
            selection = container.append('div');
            realLocationSetsAt = locationManager.locationSetsAt;
        });

        afterEach(() => {
            locationManager.locationSetsAt = realLocationSetsAt;
            body.selectAll('.combobox').remove();
            container.remove();
        });

        function makeField() {
            const field = iD.presetField('surface', {
                key: 'surface',
                type: 'combo',
                label: 'Surface',
                options: ['dirt', 'laterite'],
                autoSuggestions: false
            });
            // normally set by presetIndex#merge; set directly here to isolate the combo.js behavior
            field.optionsLocationSetID = { laterite: '+[Q869]' }; // Thailand, arbitrary id for this test
            return field;
        }

        async function openSuggestions(instance: ReturnType<typeof iD.uiFieldCombo>) {
            const node = new iD.osmNode({ id: 'n1', loc: [2.3, 48.8] }); // Paris
            context.history().merge([node]);
            instance.entityIDs([node.id]);

            selection.call(instance);
            // let setStaticValues' setTimeout(0) run
            await new Promise(resolve => { setTimeout(resolve, 10); });

            const input = selection.selectAll('input') as d3.Selection<HTMLInputElement>;
            input.node()!.focus(); // triggers a synchronous fetchComboData('')
            simulateKeydown(input, 40); // ↓ arrow, opens the dropdown and renders suggestions

            return body.selectAll('.combobox-option').nodes().map(n => (n as HTMLElement).textContent);
        }

        it('excludes an option restricted to a region we are not in', async () => {
            locationManager.locationSetsAt = () => new Map(Object.entries({ '+[Q2]': 1 })); // world only

            const instance = iD.uiFieldCombo(makeField(), context);
            const optionTexts = await openSuggestions(instance);

            expect(optionTexts).toContain('dirt');
            expect(optionTexts).not.toContain('laterite');
        });

        it('includes the option when we are inside its region', async () => {
            locationManager.locationSetsAt = () => new Map(Object.entries({ '+[Q2]': 1, '+[Q869]': 1 }));

            const instance = iD.uiFieldCombo(makeField(), context);
            const optionTexts = await openSuggestions(instance);

            expect(optionTexts).toContain('dirt');
            expect(optionTexts).toContain('laterite');
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
                allowDuplicates: true
            });

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
                destination: 'none;kirribilli' // whitespace was trimmed, no duplicate
            });
        });
    });
});
