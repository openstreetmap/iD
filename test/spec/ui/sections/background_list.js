import { select as d3_select } from 'd3-selection';

describe('iD.uiSectionBackgroundList', function () {
    let context, container;

    function clearCustomPrefs() {
        iD.prefs('background-custom-templates', null);
        iD.prefs('background-custom-template', null);
        iD.prefs('background-custom-next-id', null);
    }

    beforeEach(function () {
        clearCustomPrefs();
        container = d3_select('body').append('div').attr('class', 'id-container');
        context = iD.coreContext().assetPath('../dist/').init();
        context.container(container);
    });

    afterEach(function () {
        container.remove();
    });

    it('does not crash during initialization', function () {
        expect(function () {
            iD.uiSectionBackgroundList(context);
        }).to.not.throw();
    });

    it('renders an "Add custom background" button on the heading line that opens the settings modal', function () {
        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        const addButton = selection.selectAll('.disclosure-header-options button.add-custom-background');
        expect(addButton.size()).to.equal(1);

        iD.utilTriggerEvent(addButton, 'click');

        const modal = container.select('.modal');
        expect(modal.size()).to.equal(1);
        // the Add/Edit modal has both an optional name and a URL template field
        expect(modal.select('input.field-name').size()).to.equal(1);
        expect(modal.select('textarea.field-template').size()).to.equal(1);
    });

    it('renders a row with edit and delete buttons for each saved custom background', async function () {
        await context.background().ensureLoaded();
        context.background().addOrGetCustomSource('https://render-test/{z}/{x}/{y}.png', 'Render test');

        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        expect(selection.selectAll('li.layer-custom').size()).to.be.at.least(1);
        expect(selection.selectAll('li.layer-custom button.layer-edit-custom').size()).to.be.at.least(1);
        expect(selection.selectAll('li.layer-custom button.layer-delete-custom').size()).to.be.at.least(1);

        // custom backgrounds always sort to the top of the list
        expect(selection.select('.layer-background-list li').classed('layer-custom')).toBe(true);
    });

    it('does not create an entry when the Add modal is saved with an empty URL', async function () {
        await context.background().ensureLoaded();
        const before = context.background().customTemplates().length;

        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);
        iD.utilTriggerEvent(selection.selectAll('.disclosure-header-options button.add-custom-background'), 'click');

        const modal = container.select('.modal');
        modal.select('textarea.field-template').property('value', '   ');
        iD.utilTriggerEvent(modal.select('textarea.field-template'), 'input');

        // the Save button is disabled while the URL is empty, and even a forced
        // click must not create an entry
        expect(modal.select('.modal-section.buttons .ok-button').attr('disabled')).toBeTruthy();
        iD.utilTriggerEvent(modal.select('.modal-section.buttons .ok-button'), 'click');

        expect(context.background().customTemplates().length).to.equal(before);
    });

    it('opens a confirmation dialog when deleting a custom background', async function () {
        await context.background().ensureLoaded();
        context.background().addOrGetCustomSource('https://delete-test/{z}/{x}/{y}.png', 'Delete test');

        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);

        const deleteButton = selection.selectAll('li.layer-custom button.layer-delete-custom');
        expect(deleteButton.size()).to.be.at.least(1);

        iD.utilTriggerEvent(deleteButton, 'click');

        const modal = container.select('.modal');
        expect(modal.size()).to.equal(1);
    });

    it('updates the row label when a custom background is renamed', async function () {
        await context.background().ensureLoaded();
        const src = context.background().addOrGetCustomSource('https://rename-test/{z}/{x}/{y}.png');

        const section = iD.uiSectionBackgroundList(context);
        const wrap = container.append('div');
        wrap.call(section.render);

        // rename via the same helper the modal uses, then re-render the section
        context.background().updateCustomSource(src.id, { name: 'My Renamed Layer' });
        wrap.call(section.render);

        const labels = selection => selection.selectAll('li.layer-custom label > span').nodes().map(n => n.textContent);
        expect(labels(wrap).some(text => /My Renamed Layer/.test(text))).toBe(true);
    });

    it('always attaches a tooltip with the full template URL for custom rows', async function () {
        await context.background().ensureLoaded();
        const tmpl = 'https://tooltip-test.example/{z}/{x}/{y}.png';
        const src = context.background().addOrGetCustomSource(tmpl, 'Short Name');

        const section = iD.uiSectionBackgroundList(context);
        const selection = container.append('div').call(section.render);
        const label = selection.selectAll('li.layer-custom')
            .filter(d => d.id === src.id)
            .select('label');

        // uiTooltip also shows on focus (more reliable than synthesizing pointerenter)
        label.node().dispatchEvent(new Event('focus'));
        const code = label.select('.tooltip-text code');
        expect(code.size()).to.equal(1);
        expect(code.text()).to.equal(tmpl);
    });
});
