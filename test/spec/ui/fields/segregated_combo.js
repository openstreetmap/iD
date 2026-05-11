describe('iD.uiFieldSegregatedCombo', () => {
    /** @type {iD.Context} */
    let context;
    /** @type {import("d3-selection").Selection} */
    let selection;

    beforeEach(() => {
        context = iD.coreContext().assetPath('../dist/').init();
        selection = d3.select(document.createElement('div'));
    });

    const field = iD.presetField('surface_segregated', {
        key: 'surface',
        keys: ['surface', 'cycleway:surface', 'footway:surface'],
    });

    describe('values shown by inputs', () => {
        it('with no values set, all inputs are empty', () => {
            const instance = iD.uiFieldSegregatedCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{}]);

            expect(selection.selectAll('input').nodes()).toHaveLength(3);
            const [mainInput, cyclewayInput, footwayInput] = selection.selectAll('input').nodes();
            expect(mainInput.value).toBe('');
            expect(cyclewayInput.value).toBe('');
            expect(footwayInput.value).toBe('');
        });

        it('with only surface set, only the surface input shows the value', () => {
            const instance = iD.uiFieldSegregatedCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{ 'surface': 'paved' }]);

            const [mainInput, cyclewayInput, footwayInput] = selection.selectAll('input').nodes();
            expect(mainInput.value).toBe('paved');
            expect(cyclewayInput.value).toBe('');
            expect(footwayInput.value).toBe('');
        });

        it('with only cycleway:surface set, only the cycleway:surface input shows the value', () => {
            const instance = iD.uiFieldSegregatedCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{ 'cycleway:surface': 'asphalt' }]);

            const [mainInput, cyclewayInput, footwayInput] = selection.selectAll('input').nodes();
            expect(mainInput.value).toBe('');
            expect(cyclewayInput.value).toBe('asphalt');
            expect(footwayInput.value).toBe('');
        });

        it('with only footway:surface set, only the footway:surface input shows the value', () => {
            const instance = iD.uiFieldSegregatedCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{ 'footway:surface': 'paving_stones' }]);

            const [mainInput, cyclewayInput, footwayInput] = selection.selectAll('input').nodes();
            expect(mainInput.value).toBe('');
            expect(cyclewayInput.value).toBe('');
            expect(footwayInput.value).toBe('paving_stones');
        });

        it('with all three keys set, each input shows its respective value', () => {
            const instance = iD.uiFieldSegregatedCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{ 'surface': 'paved', 'cycleway:surface': 'asphalt', 'footway:surface': 'paving_stones' }]);

            expect(selection.selectAll('input').nodes()).toHaveLength(3);
            const [mainInput, cyclewayInput, footwayInput] = selection.selectAll('input').nodes();
            expect(mainInput.value).toBe('paved');
            expect(cyclewayInput.value).toBe('asphalt');
            expect(footwayInput.value).toBe('paving_stones');
        });
    });

    describe('no alteration of other keys on change', () => {
        it.each([
            { label: 'empty', initialTags: {} },
            { label: 'filled', initialTags: { 'cycleway:surface': 'asphalt', 'footway:surface': 'paving_stones' } },
        ])('setting surface doesn\'t alter $label cycleway:surface or footway:surface', ({ initialTags }) => {
            const instance = iD.uiFieldSegregatedCombo(field, context);
            selection.call(instance);
            let tags = { ...initialTags };
            instance.tags(undefined, [tags]);

            const onChange = vi.fn();
            instance.on('change', v => onChange(tags = v(tags)));

            const [mainInput] = selection.selectAll('input').nodes();

            mainInput.value = 'paved';
            d3.select(mainInput).dispatch('change');

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenNthCalledWith(1, { ...initialTags, 'surface': 'paved' });
        });

        it.each([
            { label: 'empty', initialTags: {} },
            { label: 'filled', initialTags: { 'surface': 'paved', 'footway:surface': 'paving_stones' } },
        ])('setting cycleway:surface doesn\'t alter $label surface or footway:surface', ({ initialTags }) => {
            const instance = iD.uiFieldSegregatedCombo(field, context);
            selection.call(instance);
            let tags = { ...initialTags };
            instance.tags(undefined, [tags]);

            const onChange = vi.fn();
            instance.on('change', v => onChange(tags = v(tags)));

            const [, cyclewayInput] = selection.selectAll('input').nodes();

            cyclewayInput.value = 'asphalt';
            d3.select(cyclewayInput).dispatch('change');

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenNthCalledWith(1, { ...initialTags, 'cycleway:surface': 'asphalt' });
        });

        it.each([
            { label: 'empty', initialTags: {} },
            { label: 'filled', initialTags: { 'surface': 'paved', 'cycleway:surface': 'asphalt' } },
        ])('setting footway:surface doesn\'t alter $label cycleway:surface or surface', ({ initialTags }) => {
            const instance = iD.uiFieldSegregatedCombo(field, context);
            selection.call(instance);
            let tags = { ...initialTags };
            instance.tags(undefined, [tags]);

            const onChange = vi.fn();
            instance.on('change', v => onChange(tags = v(tags)));

            const [,, footwayInput] = selection.selectAll('input').nodes();

            footwayInput.value = 'paving_stones';
            d3.select(footwayInput).dispatch('change');

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenNthCalledWith(1, { ...initialTags, 'footway:surface': 'paving_stones' });
        });
    });
});
