import { setTimeout } from 'node:timers/promises';

describe('iD.uiFieldLocalized', function() {
    var context, selection, field;

    before(function() {
        iD.fileFetcher.cache().languages = {
          de: { nativeName: 'Deutsch' },
          en: { nativeName: 'English' }
        };
        iD.fileFetcher.cache().territory_languages = {};
    });

    after(function() {
        delete iD.fileFetcher.cache().languages;
        delete iD.fileFetcher.cache().territory_languages;
    });

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
        selection = d3.select(document.createElement('div'));
        field = iD.presetField('name', { key: 'name', type: 'localized' });
        field.locked = function() { return false; };
    });


    it('adds a blank set of fields when the + button is clicked', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        happen.click(selection.selectAll('.localized-add').node());
        expect(selection.selectAll('.localized-lang').nodes().length).to.equal(1);
        expect(selection.selectAll('.localized-value').nodes().length).to.equal(1);
    });

    it('doesn\'t create a tag when the value is empty', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        happen.click(selection.selectAll('.localized-add').node());

        localized.on('change', function(tags) {
            expect(tags).to.eql({});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'Deutsch');
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'change'});
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'blur'});
    });

    it('doesn\'t create a tag when the name is empty', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        happen.click(selection.selectAll('.localized-add').node());

        localized.on('change', function(tags) {
            expect(tags).to.eql({});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Value');
        happen.once(selection.selectAll('.localized-value').node(), {type: 'change'});
        happen.once(selection.selectAll('.localized-value').node(), {type: 'blur'});
    });

    it('creates a tag after setting language then value', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        happen.click(selection.selectAll('.localized-add').node());

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'Deutsch');
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'change'});

        localized.on('change', function(tags) {
            expect(tags).to.eql({'name:de': 'Value'});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Value');
        happen.once(selection.selectAll('.localized-value').node(), {type: 'change'});
    });

    it('creates a tag after setting value then language', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        happen.click(selection.selectAll('.localized-add').node());

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Value');
        happen.once(selection.selectAll('.localized-value').node(), {type: 'change'});

        localized.on('change', function(tags) {
            expect(tags).to.eql({'name:de': 'Value'});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'Deutsch');
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'change'});
    });

    it('changes an existing language', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        localized.on('change', function(tags) {
            expect(tags).to.eql({
                'name:de': undefined,
                'name:en': 'Value'});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'English');
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'change'});
    });

    it('ignores similar keys like `old_name`', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'old_name:de': 'Value'});

        expect(selection.selectAll('.localized-lang').empty()).to.be.ok;
        expect(selection.selectAll('.localized-value').empty()).to.be.ok;
    });

    it('removes the tag when the language is emptied', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        localized.on('change', function(tags) {
            expect(tags).to.eql({'name:de': undefined});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), '');
        happen.once(selection.selectAll('.localized-lang').node(), {type: 'change'});
    });

    it('removes the tag when the value is emptied', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        localized.on('change', function(tags) {
            expect(tags).to.eql({'name:de': undefined});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-value'), '');
        happen.once(selection.selectAll('.localized-value').node(), {type: 'change'});
    });

    it('has a lang attribute on an existing multilingual name field', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        localized.tags({'name:de': 'Value'});
        await setTimeout(20);
        selection.call(localized);
        expect(selection.selectAll('.localized-value').attr('lang')).to.eql('de');
    });
});
