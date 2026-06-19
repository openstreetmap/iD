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

        beforeEach(() => {
            context.projection
                .scale(256 * Math.pow(2, 19))
                .translate([100, 100])
                .clipExtent([[0, 0], [2000, 2000]]);
        });

        it('sets directional rotation metadata before hover', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            const a = iD.osmNode({ id: 'nA0', loc: [0, 0] });
            const b = iD.osmNode({ id: 'nB0', loc: [0.01, 0] });
            const way = iD.osmWay({ id: 'w0', nodes: [a.id, b.id] });
            vi.spyOn(context, 'selectedIDs').mockReturnValue([way.id]);
            vi.spyOn(context, 'graph').mockReturnValue(new iD.coreGraph([a, b, way]));
            selection.call(instance);

            const rows = selection.selectAll('li.labeled-input').nodes();
            expect(rows).toHaveLength(2);
            expect(rows[0].dataset.indicatorSide).toBe('left');
            expect(rows[1].dataset.indicatorSide).toBe('right');
            expect(rows[0].style.getPropertyValue('--indicator-rotation')).not.toBe('');
            expect(rows[1].style.getPropertyValue('--indicator-rotation')).not.toBe('');
        });

        it('translates left/right row interaction to indicator sides', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            const onIndicator = vi.spyOn(context, 'setDirectionalComboIndicator');
            const a = iD.osmNode({ id: 'nA', loc: [0, 0] });
            const b = iD.osmNode({ id: 'nB', loc: [0.01, 0] });
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
            expect(rows[0].classList.contains('is-active-indicator')).toBe(true);
            expect(rows[0].dataset.indicatorSide).toBe('left');
            expect(rows[0].style.getPropertyValue('--indicator-rotation')).not.toBe('');

            d3.select(rows[1]).dispatch('mouseenter');
            expect(onIndicator).toHaveBeenLastCalledWith(
                expect.objectContaining({ side: 'right' })
            );
            expect(rows[1].classList.contains('is-active-indicator')).toBe(true);
            expect(rows[1].dataset.indicatorSide).toBe('right');
            expect(rows[1].style.getPropertyValue('--indicator-rotation')).not.toBe('');

            d3.select(rows[1]).dispatch('mouseleave');
            expect(onIndicator).toHaveBeenLastCalledWith(null);
            expect(rows[1].classList.contains('is-active-indicator')).toBe(false);
            expect(rows[1].style.getPropertyValue('--indicator-rotation')).not.toBe('');
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
            expect(rows[0].classList.contains('is-active-indicator')).toBe(false);
            expect(rows[0].dataset.indicatorSide).toBe(undefined);
        });

        it('hides label arrows and suppresses map indicator on curved ways', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            const onIndicator = vi.spyOn(context, 'setDirectionalComboIndicator');
            const curveNodes = [];
            for (let i = 0; i <= 12; i++) {
                const t = (i / 12) * Math.PI;
                curveNodes.push(iD.osmNode({
                    id: 'nC4_' + i,
                    loc: [0.001 * Math.cos(t), 0.001 * Math.sin(t)]
                }));
            }
            const way = iD.osmWay({
                id: 'w4',
                nodes: curveNodes.map(n => n.id)
            });
            vi.spyOn(context, 'selectedIDs').mockReturnValue([way.id]);
            vi.spyOn(context, 'graph').mockReturnValue(new iD.coreGraph([...curveNodes, way]));
            selection.call(instance);

            const rows = selection.selectAll('li.labeled-input').nodes();
            expect(selection.selectAll('.directionalcombo-label-arrow-hidden').size()).toBe(2);

            d3.select(rows[0]).dispatch('mouseenter');
            expect(onIndicator).toHaveBeenLastCalledWith(null);
            expect(rows[0].classList.contains('is-active-indicator')).toBe(false);
        });

        it('keeps indicator active when moving pointer into open combobox', () => {
            const instance = iD.uiFieldDirectionalCombo(field, context);
            const onIndicator = vi.spyOn(context, 'setDirectionalComboIndicator');
            const a = iD.osmNode({ id: 'nA3', loc: [0, 0] });
            const b = iD.osmNode({ id: 'nB3', loc: [0.01, 0] });
            const way = iD.osmWay({ id: 'w3', nodes: [a.id, b.id] });
            vi.spyOn(context, 'selectedIDs').mockReturnValue([way.id]);
            vi.spyOn(context, 'graph').mockReturnValue(new iD.coreGraph([a, b, way]));

            const container = d3.select(document.createElement('div'));
            context.container(container);
            selection = container.append('div');
            selection.call(instance);

            const row = selection.selectAll('li.labeled-input').nodes()[0];
            d3.select(row).dispatch('mouseenter');
            const input = row.querySelector('input');

            const combobox = container.append('div')
                .attr('class', 'combobox')
                .datum(input);
            const option = combobox.append('div').node();

            row.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, relatedTarget: option }));
            expect(onIndicator).not.toHaveBeenLastCalledWith(null);
            expect(row.classList.contains('is-active-indicator')).toBe(true);
        });
    });
});
