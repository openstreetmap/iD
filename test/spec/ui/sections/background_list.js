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

    it('renders the background list UI with custom section', function () {
        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        // Should render the main background list
        expect(selection.selectAll('.layer-background-list').size()).to.equal(1);

        // Should render the custom backgrounds header
        expect(selection.selectAll('.custom-backgrounds-header').size()).to.equal(1);

        // Should render the custom background list
        expect(selection.selectAll('.layer-custom-background-list').size()).to.equal(1);

        // Should render the "Add Custom" button
        expect(selection.selectAll('.add-custom-background').size()).to.equal(1);
    });

    it('opens settings modal when "Add Custom" button is clicked', function () {
        const section = iD.uiSectionBackgroundList(context);
        container.append('div').call(section.render);

        // Find and click the "Add Custom" button
        const addButton = container.select('.add-custom-background');
        expect(addButton.size()).to.equal(1);

        iD.utilTriggerEvent(addButton, 'click');

        // The modal should be rendered inside the container (context.container())
        const modal = container.select('.modal');
        expect(modal.size()).to.equal(1);

        // Clean up modal
        modal.remove();
    });

    it('filters custom- prefixed sources from the main background list', function () {
        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        // The main list should not show sources whose id starts with 'custom-'
        const mainListItems = selection.select('.layer-background-list').selectAll('li');
        mainListItems.each(function (d) {
            if (d && d.id) {
                expect(d.id.startsWith('custom-')).to.be.false;
            }
        });
    });

    it('renders custom backgrounds from preferences', function () {
        // Pre-populate prefs with custom backgrounds
        var customBgs = [
            { id: 'custom-1', name: 'My Custom Map', template: 'https://example.com/{z}/{x}/{y}.png' },
            { id: 'custom-2', name: 'Another Map', template: 'https://other.com/{z}/{x}/{y}.png' }
        ];
        window.localStorage.setItem('background-custom-templates', JSON.stringify(customBgs));

        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        var customListItems = selection.select('.layer-custom-background-list').selectAll('li');
        expect(customListItems.size()).to.equal(2);
    });

    it('shows edit and delete buttons for each custom background', function () {
        var customBgs = [
            { id: 'custom-1', name: 'My Custom Map', template: 'https://example.com/{z}/{x}/{y}.png' }
        ];
        window.localStorage.setItem('background-custom-templates', JSON.stringify(customBgs));

        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        var customLi = selection.select('.layer-custom-background-list').select('li');
        expect(customLi.select('.layer-browse').size()).to.equal(1);
        expect(customLi.select('.layer-delete').size()).to.equal(1);
    });

    it('opens delete confirmation with cancel button when delete is clicked', function () {
        var customBgs = [
            { id: 'custom-1', name: 'My Custom Map', template: 'https://example.com/{z}/{x}/{y}.png' }
        ];
        window.localStorage.setItem('background-custom-templates', JSON.stringify(customBgs));

        const section = iD.uiSectionBackgroundList(context);
        container.append('div').call(section.render);

        var deleteButton = container.select('.layer-custom-background-list .layer-delete');
        iD.utilTriggerEvent(deleteButton, 'click');

        var modal = container.select('.modal');
        expect(modal.size()).to.equal(1);

        // Should have both cancel and ok buttons
        expect(modal.select('.cancel-button').size()).to.equal(1);
        expect(modal.select('.ok-button').size()).to.equal(1);

        modal.remove();
    });
});
