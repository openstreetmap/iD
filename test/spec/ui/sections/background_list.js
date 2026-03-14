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

    it('renders the background list UI with an add custom background button', function () {
        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        // Should render the main background list
        expect(selection.selectAll('.layer-background-list').size()).to.equal(1);

        // Should render the add custom background button
        expect(selection.selectAll('.layer-list-add-custom').size()).to.equal(1);
        expect(selection.selectAll('.add-custom-background').size()).to.equal(1);

        // Should NOT render the old dedicated sections
        expect(selection.selectAll('.custom-backgrounds-header').size()).to.equal(0);
        expect(selection.selectAll('.layer-custom-background-list').size()).to.equal(0);
    });

    it('opens settings modal when the add custom background button is clicked', function () {
        const section = iD.uiSectionBackgroundList(context);
        container.append('div').call(section.render);

        // Find and click the add custom background button
        const addButton = container.select('.add-custom-background');
        expect(addButton.size()).to.equal(1);

        iD.utilTriggerEvent(addButton, 'click');

        // The modal should be rendered inside the container (context.container())
        const modal = container.select('.modal');
        expect(modal.size()).to.equal(1);

        // Clean up modal
        modal.remove();
    });

    it('saves a new custom TMS template and adds a usable custom source', function () {
        const section = iD.uiSectionBackgroundList(context);
        container.append('div').call(section.render);

        iD.utilTriggerEvent(container.select('.add-custom-background'), 'click');

        const modal = container.select('.modal');
        expect(modal.size()).to.equal(1);

        const template = 'https://mapproxy.codefor.de/tiles/1.0/alkis_sw/mercator/{z}/{x}/{y}.png?locale=en&id=v4a045f6025';
        const templateField = modal.select('.field-template');
        templateField.property('value', template);
        iD.utilTriggerEvent(templateField, 'input');

        const nameField = modal.select('.field-name');
        nameField.property('value', 'Alkis Test');

        const okButton = modal.select('.ok-button');
        expect(okButton.attr('disabled')).to.equal(null);
        iD.utilTriggerEvent(okButton, 'click');

        const source = context.background().findSource('custom-1');
        expect(source).to.exist;
        expect(source.template()).to.equal(template);

        const listItems = container.select('.layer-background-list').selectAll('li');
        let found = false;
        listItems.each(function (d) {
            if (d && d.id === 'custom-1') found = true;
        });
        expect(found).to.be.true;
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
