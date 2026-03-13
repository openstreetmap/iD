describe('iD.uiSectionBackgroundList', function () {
    let context, container;

    beforeEach(function () {
        container = d3.select('body').append('div').attr('class', 'id-container');
        context = iD.coreContext().assetPath('../dist/').init();
        context.container(container);
        // Clear custom background preferences between tests
        window.localStorage.removeItem('background-custom-templates');
        window.localStorage.removeItem('background-custom-template');
    });

    afterEach(function () {
        container.remove();
        // Clean up any modals attached to body
        d3.selectAll('.modal-wrap').remove();
    });

    it('does not crash during initialization', function() {
        expect(() => {
            iD.uiSectionBackgroundList(context);
        }).not.to.throw();
    });

    it('renders the background list UI with an empty custom row', function () {
        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        // Should render the main background list
        expect(selection.selectAll('.layer-background-list').size()).to.equal(1);

        // Should render a single empty custom row (Tags-style)
        expect(selection.selectAll('.layer-list-add-custom').size()).to.equal(1);
        expect(selection.selectAll('.layer-list-add-custom li').size()).to.equal(1);

        // Should NOT render the old dedicated sections
        expect(selection.selectAll('.custom-backgrounds-header').size()).to.equal(0);
        expect(selection.selectAll('.layer-custom-background-list').size()).to.equal(0);
        expect(selection.selectAll('.add-custom-background').size()).to.equal(0);
    });

    it('opens settings modal when the empty custom row is clicked', function () {
        const section = iD.uiSectionBackgroundList(context);
        container.append('div').call(section.render);

        // Find and click the empty custom row
        const addRow = container.select('.layer-list-add-custom li');
        expect(addRow.size()).to.equal(1);

        iD.utilTriggerEvent(addRow, 'click');

        // The modal should be rendered inside the container (context.container())
        const modal = container.select('.modal');
        expect(modal.size()).to.equal(1);

        // Clean up modal
        modal.remove();
    });

    it('shows custom sources in the main background list', function () {
        var customBgs = [
            { id: 'custom-1', name: 'My Custom Map', template: 'https://example.com/{z}/{x}/{y}.png' }
        ];
        customBgs.forEach(function (d) {
            context.background().addCustomSource(iD.rendererBackgroundSource.Custom(d.id, d.name, d.template));
        });

        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        // The main list should include the custom- prefixed source
        let found = false;
        selection.select('.layer-background-list').selectAll('li').each(function (d) {
            if (d && d.id === 'custom-1') found = true;
        });
        expect(found).to.be.true;
    });

    it('renders multiple custom backgrounds from preferences in the main list', function () {
        // Pre-populate prefs with custom backgrounds
        var customBgs = [
            { id: 'custom-1', name: 'My Custom Map', template: 'https://example.com/{z}/{x}/{y}.png' },
            { id: 'custom-2', name: 'Another Map', template: 'https://other.com/{z}/{x}/{y}.png' }
        ];
        customBgs.forEach(function (d) {
            context.background().addCustomSource(iD.rendererBackgroundSource.Custom(d.id, d.name, d.template));
        });

        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        // Both custom sources should appear in the main list
        let found1 = false, found2 = false;
        selection.select('.layer-background-list').selectAll('li').each(function (d) {
            if (d && d.id === 'custom-1') found1 = true;
            if (d && d.id === 'custom-2') found2 = true;
        });
        expect(found1).to.be.true;
        expect(found2).to.be.true;
    });
});
