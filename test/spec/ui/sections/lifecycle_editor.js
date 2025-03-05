describe('iD.uiSectionLifecycleEditor', () => {
    var context, lifecycle, dispatchMock;

    before(() => {
        dispatchMock = vi.fn();
        context = iD.coreContext().assetPath('../dist/').init();
        lifecycle = iD.uiSectionLifecycleEditor(context);
        lifecycle.on('change', dispatchMock);
    });

    it('should initialize correctly', () => {
        expect(lifecycle).toBeDefined();
        expect(typeof lifecycle.shouldDisplay).toBe('function');
        expect(typeof lifecycle.label).toBe('function');
    });

    it('should set and get entityIDs', () => {
        lifecycle.entityIDs(['entity1']);
        expect(lifecycle.entityIDs()).toEqual(['entity1']);
    });

    it('should set and get tags', () => {
        const tags = { highway: 'construction' };
        lifecycle.tags(tags);
        expect(lifecycle.tags()).toEqual(tags);
    });

    it('should set and get presets', () => {
        const presets = [{ tags: { highway: 'primary' } }];
        lifecycle.presets(presets);
        expect(lifecycle.presets()).toEqual(presets);
    });

    /*
    it('should reset construction lifecycle on makeFunctional', () => {
        const selection = d3.select(document.createElement('div'));
        lifecycle.tags({ building: 'yes' });
        lifecycle.presets([{ tags: { building: 'yes' }, getLifecycle: vi.fn(() => 'functional') }]);
        lifecycle.disclosureContent(selection);

        const radio = d3.select('input[value="construction"]');
        radio.trigger('click');
        radio.on('change')();
        expect(dispatch.call).toHaveBeenCalled();
    });

    it('should reset prefix lifecycle on makeFunctional', () => {
        lifecycle.tags({ 'disused:highway' : 'residential'});
        happen.click(lifecycle.makeFunctionalButton);
        let tags =  { 'highway' : 'residential' };
        expect(lifecycle.tags()).toEqual(tags);
    });

    it('should add construction=yes to tags when construction is selected', () => {
        lifecycle.tags({ highway: 'residential' });
        lifecycle.presets([{ tags: { highway: 'residential' } }]);

        const input = d3.select(document.body).append('input')
            .attr('type', 'radio')
            .attr('value', 'construction');

        input.on('change', lifecycle.changeLifecycle);
        input.node().dispatchEvent(new Event('change'));

        let tags = { 'highway' : 'residential', 'construction' : 'yes' };
        expect(lifecycle.tags()).toEqual(tags);
    });

    test('should add lifecycle prefix to tag when other lifecycle is selected', () => {
        lifecycle.tags({ highway: 'residential' });
        lifecycle.presets([{ tags: { highway: 'residential' } }]);

        const input = d3.select(document.body).append('input')
            .attr('type', 'radio')
            .attr('value', 'disused');

        input.on('change', lifecycle.changeLifecycle);
        input.node().dispatchEvent(new Event('change'));
        let tags =  {'disused:highway' : 'residential'};
        expect(lifecycle.tags()).toEqual(tags);
    });

    test('should handle lifecycle changes', () => {
        lifecycle.on('change', dispatchMock);

        const input = d3.select(document.body).append('input')
            .attr('type', 'radio')
            .attr('value', 'disused');

        lifecycle.tags({ highway: 'road' });
        lifecycle.presets([{ tags: { highway: 'road' } }]);

        input.on('change', lifecycle.changeLifecycle);
        input.node().dispatchEvent(new Event('change'));

        expect(dispatchMock).toHaveBeenCalled();
    });
    */
});