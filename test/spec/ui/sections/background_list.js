describe('iD.uiSectionBackgroundList', function () {
    let context, container;

    beforeEach(function () {
        container = d3.select('body').append('div').attr('class', 'id-container');
        context = iD.coreContext().assetPath('../dist/').init();
        context.container(container);
    });

    afterEach(function () {
        container.remove();
    });

    it('does not crash during initialization if custom source is missing', function () {
        const originalFindSource = context.background().findSource;
        context.background().findSource = (id) => {
            if (id === 'custom') return null;
            return originalFindSource(id);
        };

        try {
            expect(() => {
                iD.uiSectionBackgroundList(context);
            }).not.to.throw();
        } finally {
            context.background().findSource = originalFindSource;
        }
    });

    it('customChanged handles missing custom source gracefully', function () {
        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        // Find the browse button for the custom layer
        const browseButton = selection.selectAll('.layer-custom button.layer-browse');
        expect(browseButton.size()).to.equal(1);

        // Click it to open the settings modal
        iD.utilTriggerEvent(browseButton, 'click');

        // The modal should now be in the container
        const modal = container.select('.modal');
        expect(modal.size()).to.equal(1);

        // Mock findSource to return null right before we "save"
        const originalFindSource = context.background().findSource;
        context.background().findSource = (id) => {
            if (id === 'custom') return null;
            return originalFindSource(id);
        };

        try {
            // Find and click the "OK" (save) button in the modal
            const okButton = modal.select('.modal-section.buttons .ok-button');
            expect(okButton.size()).to.equal(1);

            expect(() => {
                iD.utilTriggerEvent(okButton, 'click');
            }).not.to.throw();

        } finally {
            context.background().findSource = originalFindSource;
        }
    });

    it('customChanged fallback to "none" handles missing "none" source gracefully', function () {
        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        // Find the browse button for the custom layer and click it
        const browseButton = selection.selectAll('.layer-custom button.layer-browse');
        iD.utilTriggerEvent(browseButton, 'click');

        const modal = container.select('.modal');
        expect(modal.size()).to.equal(1);

        // Clear the template field to simulate falling back to 'none'
        modal.select('textarea.field-template').property('value', '');

        // Mock findSource to return null for 'none'
        const originalFindSource = context.background().findSource;
        context.background().findSource = (id) => {
            if (id === 'none') return null;
            return originalFindSource(id);
        };

        try {
            const okButton = modal.select('.modal-section.buttons .ok-button');
            expect(okButton.size()).to.equal(1);

            expect(() => {
                iD.utilTriggerEvent(okButton, 'click');
            }).not.to.throw();
        } finally {
            context.background().findSource = originalFindSource;
        }
    });
});
