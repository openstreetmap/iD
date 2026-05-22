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
            instance.tags(undefined, [{ 'cycleway:left': 'lane' }]);

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('lane');
            expect(right.value).toBe('');
        });

        it('populates the left/right fields using :both', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{ 'cycleway:both': 'lane' }]);

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('lane');
            expect(right.value).toBe('lane');
        });

        it('populates the left/right fields using the unprefixed tag', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{ cycleway: 'lane' }]);

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('lane');
            expect(right.value).toBe('lane');
        });

        it(`setting left & right to the same value will use the ${commonKey}`, () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            const tags = { 'cycleway:left': 'lane', 'cycleway:right': 'shoulder' };
            instance.tags(undefined, [tags]);

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
            instance.tags(undefined, [tags]);

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

    describe('handle multiselection', function() {
        const field = iD.presetField('name', {
            key: 'cycleway:both',
            keys: ['cycleway:left', 'cycleway:right'],
        });

        it('populates the left/right fields using :left/:right and :both', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{ 'cycleway:left': 'lane', 'cycleway:right': 'lane' }, { 'cycleway:both': 'lane' }]);

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('lane');
            expect(right.value).toBe('lane');
        });

        it('missing explicit direction tag should be reported like a conflicting value', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{ 'cycleway:left': 'lane' }, { 'cycleway:both': 'lane' }]);

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('lane');
            expect(right.value).toBe('');
        });
    });

    describe('handle `[key]=left|right|both` schema', function() {
        const field = iD.presetField('name', {
            key: 'cycleway:both',
            keys: ['cycleway:left', 'cycleway:right'],
        });

        it('transforms `both` to yes/yes', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{ 'cycleway': 'both' }]);

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('yes');
            expect(right.value).toBe('yes');
        });

        it('transforms `left` to yes/no', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{ 'cycleway': 'left' }]);

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('yes');
            expect(right.value).toBe('no');
        });

        it('preserves other values', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            instance.tags(undefined, [{ 'cycleway': 'other' }]);

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('other');
            expect(right.value).toBe('other');
        });

        it('can read the value from key=left, but writes to key:left', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            let tags = { 'cycleway': 'left' };
            instance.tags(undefined, [tags]);

            const onChange = vi.fn();
            instance.on('change', v => onChange(tags = v(tags)));

            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('yes');
            expect(right.value).toBe('no');

            left.value = 'separate';
            d3.select(left).dispatch('change');

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenNthCalledWith(1, {
                'cycleway:left': 'separate', // left was updated
                'cycleway:right': 'no',
            });

            right.value = 'separate';
            d3.select(right).dispatch('change');

            expect(onChange).toHaveBeenCalledTimes(2);
            expect(onChange).toHaveBeenNthCalledWith(2, {
                'cycleway:both': 'separate', // now left & right have been updated
            });
        });
    });

    describe('directional combo indicator interaction', function() {
        const field = iD.presetField('name', {
            key: 'cycleway',
            keys: ['cycleway:left', 'cycleway:right'],
        });

        it('translates left/right row interaction to indicator sides', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            const onIndicator = vi.spyOn(context, 'setDirectionalComboIndicator');
            const a = iD.osmNode({ id: 'nA', loc: [0, 0] });
            const b = iD.osmNode({ id: 'nB', loc: [1, 1] });
            const way = iD.osmWay({ id: 'w1', nodes: [a.id, b.id] });
            vi.spyOn(context, 'selectedIDs').mockReturnValue([way.id]);
            vi.spyOn(context, 'graph').mockReturnValue(new iD.coreGraph([a, b, way]));
            selection.call(instance);

            const rows = selection.selectAll('li.labeled-input').nodes();
            expect(rows).toHaveLength(2);

            d3.select(rows[0]).dispatch('mouseenter');
            expect(onIndicator).toHaveBeenLastCalledWith(
                expect.objectContaining({ side: 'left' })
            );

            d3.select(rows[1]).dispatch('mouseenter');
            expect(onIndicator).toHaveBeenLastCalledWith(
                expect.objectContaining({ side: 'right' })
            );

            d3.select(rows[1]).dispatch('mouseleave');
            expect(onIndicator).toHaveBeenLastCalledWith(null);
        });

        it('ignores non-left/right directional keys', () => {
            const forwardBackwardField = iD.presetField('name', {
                key: 'cycleway',
                keys: ['cycleway:forward', 'cycleway:backward'],
            });
            const instance = iD.uiFieldDirectionalCombo(forwardBackwardField, context);
            const onIndicator = vi.spyOn(context, 'setDirectionalComboIndicator');
            const a = iD.osmNode({ id: 'nA2', loc: [0, 0] });
            const b = iD.osmNode({ id: 'nB2', loc: [1, 1] });
            const way = iD.osmWay({ id: 'w2', nodes: [a.id, b.id] });
            vi.spyOn(context, 'selectedIDs').mockReturnValue([way.id]);
            vi.spyOn(context, 'graph').mockReturnValue(new iD.coreGraph([a, b, way]));
            selection.call(instance);

            const rows = selection.selectAll('li.labeled-input').nodes();
            expect(rows).toHaveLength(2);

            d3.select(rows[0]).dispatch('mouseenter');
            expect(onIndicator).toHaveBeenLastCalledWith(null);
        });
    });
});
