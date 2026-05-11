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

    describe('placeholder value for subkeys', () => {

        function getSubkeyPlaceholders(...entityTagsList) {
            const instance = iD.uiFieldSegregatedCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, entityTagsList);
            const [, cyclewayInput, footwayInput] = selection.selectAll('input').nodes();
            return [
                cyclewayInput.getAttribute('placeholder'),
                footwayInput.getAttribute('placeholder')
            ];
        }

        it('shows the main value as placeholder on unset subkeys', () => {
            const [cycleway, footway] = getSubkeyPlaceholders({ 'surface': 'asphalt' });
            expect(cycleway).toBe('asphalt');
            expect(footway).toBe('asphalt');
        });

        it('does not set a placeholder on a subkey with value', () => {
            const [cycleway, footway] = getSubkeyPlaceholders({ 'surface': 'asphalt', 'cycleway:surface': 'asphalt' });
            expect(cycleway).not.toBe('asphalt');
            expect(footway).toBe('asphalt');
        });

        it('does not set a placeholder when the main value is not set', () => {
            const [cycleway, footway] = getSubkeyPlaceholders({});
            expect(cycleway).toBeFalsy();
            expect(footway).toBeFalsy();
        });
    });

    describe('widget display allowance', () => {

        // Mock up "surface_segregated" field
        const presetField = iD.presetField('surface_segregated', {
            key: 'surface',
            keys: ['surface', 'cycleway:surface', 'footway:surface'],
            type: 'segregatedCombo',
            fallbackKey: 'surface',
            prerequisiteTag: { key: 'segregated', value: 'yes' },
        });

        function makeField(tags) {
            const node = new iD.osmNode({ loc: [0, 0], tags });
            context.perform(iD.actionAddEntity(node));
            const uiField = iD.uiField(context, presetField, [node.id]);
            uiField.tags(tags);
            return uiField;
        }

        // Mock up plain "surface" field
        const fallbackPresetField = iD.presetField('surface', { key: 'surface', type: 'combo' });

        function makeFallbackField(mainField) {
            return iD.uiField(context, fallbackPresetField, mainField.entityIDs, { fallbackFor: mainField });
        }

        it('is allowed when segregated=yes', () => {
            const uiField = makeField({ segregated: 'yes' });
            expect(uiField.isAllowed()).toBe(true);

            const fallbackField = makeFallbackField(uiField);
            expect(fallbackField.isAllowed()).toBe(false);
        });

        it('is allowed when segregated=yes and also surface is set', () => {
            const uiField = makeField({ segregated: 'yes', surface: 'asphalt' });
            expect(uiField.isAllowed()).toBe(true);

            const fallbackField = makeFallbackField(uiField);
            expect(fallbackField.isAllowed()).toBe(false);
        });

        it('is allowed when segregated=yes and also cycleway:surface is set', () => {
            const uiField = makeField({ segregated: 'yes', 'cycleway:surface': 'asphalt' });
            expect(uiField.isAllowed()).toBe(true);

            const fallbackField = makeFallbackField(uiField);
            expect(fallbackField.isAllowed()).toBe(false);
        });

        it('is allowed when segregated=yes and also both surface and cycleway:surface are set', () => {
            const uiField = makeField({ segregated: 'yes', surface: 'paved', 'cycleway:surface': 'asphalt' });
            expect(uiField.isAllowed()).toBe(true);

            const fallbackField = makeFallbackField(uiField);
            expect(fallbackField.isAllowed()).toBe(false);
        });

        it('is not allowed when segregated=no', () => {
            const uiField = makeField({ segregated: 'no' });
            expect(uiField.isAllowed()).toBe(false);

            const fallbackField = makeFallbackField(uiField);
            expect(fallbackField.isAllowed()).toBe(true);
        });

        it('is not allowed when segregated=no even if surface is set', () => {
            const uiField = makeField({ segregated: 'no', surface: 'asphalt' });
            expect(uiField.isAllowed()).toBe(false);

            const fallbackField = makeFallbackField(uiField);
            expect(fallbackField.isAllowed()).toBe(true);
        });

        it('is allowed when segregated=no, but cycleway:surface is set', () => {
            const uiField = makeField({ segregated: 'no', 'cycleway:surface': 'asphalt' });
            expect(uiField.isAllowed()).toBe(true);

            const fallbackField = makeFallbackField(uiField);
            expect(fallbackField.isAllowed()).toBe(false);
        });

        it('is not allowed when segregated is not set', () => {
            const uiField = makeField({});
            expect(uiField.isAllowed()).toBe(false);

            const fallbackField = makeFallbackField(uiField);
            expect(fallbackField.isAllowed()).toBe(true);
        });

        it('is not allowed when segregated is not set even if surface is set', () => {
            const uiField = makeField({ surface: 'asphalt' });
            expect(uiField.isAllowed()).toBe(false);

            const fallbackField = makeFallbackField(uiField);
            expect(fallbackField.isAllowed()).toBe(true);
        });

        it('is allowed when segregated is not set, but cycleway:surface is set', () => {
            const uiField = makeField({ 'cycleway:surface': 'asphalt' });
            expect(uiField.isAllowed()).toBe(true);

            const fallbackField = makeFallbackField(uiField);
            expect(fallbackField.isAllowed()).toBe(false);
        });

        it('is not allowed when segregated is an unknown values', () => {
            const uiField = makeField({ segregated: 'perhaps' });
            expect(uiField.isAllowed()).toBe(false);

            const fallbackField = makeFallbackField(uiField);
            expect(fallbackField.isAllowed()).toBe(true);
        });
    });
});
