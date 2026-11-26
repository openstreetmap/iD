describe('iD.uiFieldDirectionalCombo', () => {
    /** @type {iD.Context} */
    let context;
    /** @type {import("d3-selection").Selection} */
    let selection;

    beforeEach(() => {
        context = iD.coreContext().assetPath('../dist/').init();
        selection = d3.select(document.createElement('div'));
    });

    describe.each(['cycleway', 'cycleway:both'])('preset uses %s', (commonKey) => {
        /** if commonKey ends with :both, this is the key without :both. and vice-verca */
        const otherCommonKey = commonKey.endsWith(':both')
            ? commonKey.replace(/:both$/, '')
            : `${commonKey}:both`;

        const field = iD.presetField('name', {
            key: commonKey,
            keys: ['cycleway:left', 'cycleway:right'],
        });

        it('populates the left/right fields using :left & :right', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            instance.tags({ 'cycleway:left': 'lane' });

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('lane');
            expect(right.value).toBe('');
        });

        it('populates the left/right fields using :both', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            instance.tags({ 'cycleway:both': 'lane' });

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('lane');
            expect(right.value).toBe('lane');
        });

        it('populates the left/right fields using the unprefixed tag', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            instance.tags({ cycleway: 'lane' });

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('lane');
            expect(right.value).toBe('lane');
        });

        it(`setting left & right to the same value will use the ${commonKey}`, () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            const tags = { 'cycleway:left': 'lane', 'cycleway:right': 'shoulder' };
            instance.tags(tags);

            const onChange = vi.fn();
            instance.on('change', v => onChange(v(tags)));

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('lane');
            expect(right.value).toBe('shoulder');


            left.value = 'shoulder';
            d3.select(left).dispatch('change');

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith({ [commonKey]: 'shoulder' });
        });

        it(`can read the value from ${otherCommonKey}, but writes to ${commonKey}`, () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            let tags = { [otherCommonKey]: 'lane' };
            instance.tags(tags);

            const onChange = vi.fn();
            instance.on('change', v => onChange(tags = v(tags)));

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('lane');
            expect(right.value).toBe('lane');


            left.value = 'shoulder';
            d3.select(left).dispatch('change');

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenNthCalledWith(1, {
                'cycleway:left': 'shoulder', // left was updated
                'cycleway:right': 'lane',
            });

            right.value = 'shoulder';
            d3.select(right).dispatch('change');

            expect(onChange).toHaveBeenCalledTimes(2);
            expect(onChange).toHaveBeenNthCalledWith(2, {
                [commonKey]: 'shoulder', // now left & right have been updated
            });
        });
    });
});
