import { setTimeout } from 'node:timers/promises';
import { select as d3_select } from 'd3-selection';

describe('iD.uiFieldLocalized', function() {
    var context, selection, field;

    beforeEach(() => {
        iD.fileFetcher.cache().languages = {
          de: { nativeName: 'Deutsch' },
          en: { nativeName: 'English' }
        };
        iD.fileFetcher.cache().territory_languages = {};
    });

    afterEach(() => {
        delete iD.fileFetcher.cache().languages;
        delete iD.fileFetcher.cache().territory_languages;
    });

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
        selection = d3_select(document.createElement('div'));
        field = iD.presetField('name', { key: 'name', type: 'localized' });
        field.locked = function() { return false; };
    });


    it('adds a blank set of fields when the + button is clicked', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));
        expect(selection.selectAll('.localized-lang').nodes().length).toEqual(1);
        expect(selection.selectAll('.localized-value').nodes().length).toEqual(1);
    });

    it('doesn\'t create a tag when the value is empty', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));

        localized.on('change', function(tags) {
            expect(tags).toEqual({});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'Deutsch');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('blur'));
    });

    it('doesn\'t create a tag when the name is empty', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));

        localized.on('change', function(tags) {
            expect(tags).toEqual({});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Value');
        selection.selectAll('.localized-value').node().dispatchEvent(new Event('change'));
        selection.selectAll('.localized-value').node().dispatchEvent(new Event('blur'));
    });

    it('creates a tag after setting language then value', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'Deutsch');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        localized.on('change', function(tags) {
            expect(tags).toEqual({'name:de': 'Value'});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Value');
        selection.selectAll('.localized-value').node().dispatchEvent(new Event('change'));
    });

    it('creates a tag after setting value then language', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Value');
        selection.selectAll('.localized-value').node().dispatchEvent(new Event('change'));

        localized.on('change', function(tags) {
            expect(tags).toEqual({'name:de': 'Value'});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'Deutsch');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));
    });

    it('changes an existing language', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        localized.on('change', function(tags) {
            expect(tags).toEqual({
                'name:de': undefined,
                'name:en': 'Value'});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'English');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));
    });

    it('ignores similar keys like `old_name`', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'old_name:de': 'Value'});

        expect(selection.selectAll('.localized-lang').empty()).toBeTruthy();
        expect(selection.selectAll('.localized-value').empty()).toBeTruthy();
    });

    it('removes the tag when the language is emptied', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        localized.on('change', function(tags) {
            expect(tags).toEqual({'name:de': undefined});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), '');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));
    });

    it('removes the tag when the value is emptied', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        localized.on('change', function(tags) {
            expect(tags).toEqual({'name:de': undefined});
        });

        iD.utilGetSetValue(selection.selectAll('.localized-value'), '');
        selection.selectAll('.localized-value').node().dispatchEvent(new Event('change'));
    });

    it('has a lang attribute on an existing multilingual name field', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        localized.tags({'name:de': 'Value'});
        await setTimeout(20);
        selection.call(localized);
        expect(selection.selectAll('.localized-value').attr('lang')).toEqual('de');
    });

    it('preserves the name when an unknown language is entered', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);

        selection.selectAll('.localized-add').node()
            .dispatchEvent(new MouseEvent('click'));

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'Unknown Language');
        selection.selectAll('.localized-lang').node()
            .dispatchEvent(new Event('change'));

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Test Name');
        selection.selectAll('.localized-value').node()
            .dispatchEvent(new Event('change'));

        localized.tags({});

        expect(selection.selectAll('.localized-lang').property('value'))
            .toEqual('Unknown Language');
        expect(selection.selectAll('.localized-value').property('value'))
            .toEqual('Test Name');

        var changes = [];
        localized.on('change', tags => changes.push(tags));

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'Deutsch');
        selection.selectAll('.localized-lang').node()
            .dispatchEvent(new Event('change'));

        expect(changes).toContainEqual({'name:de': 'Test Name'});
    });


    it('preserves unfinished language and name inputs during rerender', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);

        selection.selectAll('.localized-add').node()
            .dispatchEvent(new MouseEvent('click'));

        var lang = selection.select('.localized-lang');
        var value = selection.select('.localized-value');

        iD.utilGetSetValue(lang, 'Unknown Language');
        lang.node().dispatchEvent(new Event('input'));

        iD.utilGetSetValue(value, 'Test Name');
        value.node().dispatchEvent(new Event('input'));

        localized.tags({});

        expect(selection.select('.localized-lang').property('value'))
            .toBe('Unknown Language');
        expect(selection.select('.localized-value').property('value'))
            .toBe('Test Name');
    });

    it('saves an unlisted but valid language code', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);

        selection.select('.localized-add').node()
            .dispatchEvent(new MouseEvent('click'));

        var changes = [];
        localized.on('change', tags => changes.push(tags));

        iD.utilGetSetValue(selection.select('.localized-lang'), 'qaa');
        selection.select('.localized-lang').node()
            .dispatchEvent(new Event('change'));

        iD.utilGetSetValue(selection.select('.localized-value'), 'Test Name');
        selection.select('.localized-value').node()
            .dispatchEvent(new Event('change'));

        expect(changes).toContainEqual({'name:qaa': 'Test Name'});
    });


    it('keeps an unknown language and its name after losing focus', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);

        selection.select('.localized-add').node()
            .dispatchEvent(new MouseEvent('click'));

        var changes = [];
        localized.on('change', tags => changes.push(tags));

        var lang = selection.select('.localized-lang');
        var value = selection.select('.localized-value');

        iD.utilGetSetValue(lang, 'Unknown Language');
        lang.node().dispatchEvent(new Event('input'));
        lang.node().dispatchEvent(new Event('blur'));

        iD.utilGetSetValue(value, 'Test Name');
        value.node().dispatchEvent(new Event('input'));
        value.node().dispatchEvent(new Event('blur'));

        localized.tags({});

        expect(lang.property('value')).toBe('Unknown Language');
        expect(value.property('value')).toBe('Test Name');
        expect(changes).toEqual([]);

        iD.utilGetSetValue(lang, 'Deutsch');
        lang.node().dispatchEvent(new Event('change'));

        expect(changes).toContainEqual({'name:de': 'Test Name'});
    });

});
