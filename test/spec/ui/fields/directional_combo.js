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

    describe('handle `[key]=left|right|both` schema', function() {
        it('transform `left` to yes/no', () => {
            const field = iD.presetField('name', {
                key: 'cycleway:both',
                keys: ['cycleway:left', 'cycleway:right'],
            });
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            let tags = { 'cycleway': 'left' };
            instance.tags(tags);
            const onChange = vi.fn();
            instance.on('change', v => onChange(tags = v(tags)));

            // Check the initial data that is invisible in the UI
            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('left');
            expect(right.value).toBe('left');

            // Check the result of the initial transformation that transform `cycleway=left` to `yes` and `no` in the UI
            d3.select(left).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenNthCalledWith(1, {
                'cycleway:left': 'left', // we can ignore this
                'cycleway:right': 'no',
            });
            d3.select(right).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(2);
            expect(onChange).toHaveBeenNthCalledWith(2, {
                'cycleway:left': 'yes',
                'cycleway:right': 'left', // we can ignore this
            });

            // Check regular changes by a user on one side
            left.value = 'track';
            d3.select(left).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(3);
            expect(onChange).toHaveBeenNthCalledWith(3, {
                'cycleway:left': 'track', // left was updated
                'cycleway:right': 'no',
            });

            // Check regular changes by a user on the other side which makes it the `both` case
            right.value = 'track';
            d3.select(right).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(4);
            expect(onChange).toHaveBeenNthCalledWith(4, {
                'cycleway:both': 'track', // now left & right have been updated
            });
        });

        it('transform `right` to no/yes', () => {
            const field = iD.presetField('name', {
                key: 'cycleway:both',
                keys: ['cycleway:left', 'cycleway:right'],
            });
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            let tags = { 'cycleway': 'right' };
            instance.tags(tags);
            const onChange = vi.fn();
            instance.on('change', v => onChange(tags = v(tags)));

            // Check the initial data that is invisible in the UI
            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('right');
            expect(right.value).toBe('right');

            // Check the result of the initial transformation that transform `cycleway=left` to `yes` and `no` in the UI
            d3.select(left).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenNthCalledWith(1, {
                'cycleway:left': 'right', // we can ignore this
                'cycleway:right': 'yes',
            });
            d3.select(right).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(2);
            expect(onChange).toHaveBeenNthCalledWith(2, {
                'cycleway:left': 'no',
                'cycleway:right': 'right', // we can ignore this
            });

            // Check regular changes by a user on one side
            right.value = 'separate';
            d3.select(right).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(3);
            expect(onChange).toHaveBeenNthCalledWith(3, {
                'cycleway:left': 'no',
                'cycleway:right': 'separate', // left was updated
            });

            // Check regular changes by a user on the other side which makes it the `both` case
            left.value = 'track';
            d3.select(left).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(4);
            expect(onChange).toHaveBeenNthCalledWith(4, {
                'cycleway:left': 'track', // left was updated
                'cycleway:right': 'separate',
            });
        });

        it('transform `both` to yes/yes', () => {
            const field = iD.presetField('name', {
                key: 'cycleway:both',
                keys: ['cycleway:left', 'cycleway:right'],
            });
            const instance = iD.uiFieldDirectionalCombo(field, context);
            selection.call(instance);
            let tags = { 'cycleway': 'both' };
            instance.tags(tags);
            const onChange = vi.fn();
            instance.on('change', v => onChange(tags = v(tags)));

            // Check the initial data that is invisible in the UI
            expect(selection.selectAll('input').nodes()).toHaveLength(2);
            const [left, right] = selection.selectAll('input').nodes();
            expect(left.value).toBe('both');
            expect(right.value).toBe('both');

            // Check the result of the initial transformation that transform `cycleway=left` to `yes` and `no` in the UI
            d3.select(left).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenNthCalledWith(1, {
                'cycleway:left': 'both', // we can ignore this
                'cycleway:right': 'yes',
            });
            d3.select(right).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(2);
            expect(onChange).toHaveBeenNthCalledWith(2, {
                'cycleway:left': 'yes',
                'cycleway:right': 'both', // we can ignore this
            });

            // Check regular changes by a user on one side
            left.value = 'track';
            d3.select(left).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(3);
            expect(onChange).toHaveBeenNthCalledWith(3, {
                'cycleway:left': 'track', // left was updated
                'cycleway:right': 'yes',
            });

            // Check regular changes by a user on the other side which makes it the `both` case
            right.value = 'track';
            d3.select(right).dispatch('change');
            expect(onChange).toHaveBeenCalledTimes(4);
            expect(onChange).toHaveBeenNthCalledWith(4, {
                'cycleway:both': 'track', // now left & right have been updated
            });
        });
    });
});
