describe('iD.uiFieldRadio', () => {
    describe('structureRadio', () => {
        let context: iD.Context;
        let selection: d3.Selection;

        beforeEach(() => {
            context = iD.coreContext().assetPath('../dist/').init();
            selection = d3.select(document.createElement('div'));
        });

        it.each<[fromTags: Tags, optionToClick: string, toTags: Tags]>([
            [
                // if no tags, it should add layer=1
                {},
                'bridge',
                { bridge: 'yes', layer: '1' }
            ],
            [
                // existing positive layer should be respected
                { layer: '2' },
                'bridge',
                { bridge: 'yes', layer: '2' }
            ],
            [
                // negative layers are overridden with layer=1
                { layer: '-3' },
                'bridge',
                { bridge: 'yes', layer: '1' }
            ],
            [
                // changing a tunnel to a bridge should change layer
                { layer: '-1', tunnel: 'yes' },
                'bridge',
                { bridge: 'yes', layer: '1' }
            ],
            [
                // opposite direction: changing to a tunnel:
                { layer: '-3' },
                'tunnel',
                { tunnel: 'yes', layer: '-3' }
            ],
        ])('given %s, after clicking on ‘%s’, changes tags to %s', (fromTags, optionToClick, toTags) => {
            const field = iD.presetField('a', {
                type: 'structureRadio',
                keys: ['bridge', 'tunnel'],
                options: ['bridge', 'tunnel'],
            });
            const instance = iD.uiFieldRadio(field, context);
            const onChange = vi.fn();

            selection.call(instance);
            instance.on('change', onChange);
            instance.tags(fromTags);

            // confirm that bridge+tunnel buttons are displayed
            const options = selection.selectAll<HTMLLabelElement, unknown>('label').nodes();
            expect(options).toHaveLength(2);
            expect(options[0].querySelector('.localized-text')?.innerHTML).toBe('bridge');
            expect(options[1].querySelector('.localized-text')?.innerHTML).toBe('tunnel');

            // click one of the radio button
            const index = field.keys.indexOf(optionToClick);
            const radioToClick = options[index].querySelector('input')!;
            radioToClick.checked = true;
            d3.select(radioToClick).dispatch('change');

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenNthCalledWith(1, toTags);
        });
    });
});
