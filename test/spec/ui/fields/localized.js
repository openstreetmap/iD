import { setTimeout } from 'node:timers/promises';
import { select as d3_select } from 'd3-selection';

describe('iD.uiFieldLocalized', function() {
    var context, selection, field;

    beforeEach(() => {
        iD.fileFetcher.cache().languages = {
          de: { nativeName: 'Deutsch' },
          en: { nativeName: 'English' },
          'sr-Latn': { nativeName: 'srpski (latinica)' }
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

    function collectTags(localized, initialTags) {
        var entityTags = initialTags || {};
        localized.on('change', function(tags) {
            Object.keys(tags).forEach(function(k) {
                if (tags[k] === undefined) delete entityTags[k];
                else entityTags[k] = tags[k];
            });
            localized.tags(entityTags);
        });
        return entityTags;
    }

    it('keeps the row when the entered language is not recognized', async () => {
        // #13019: an unrecognized language produced a `name:<lang>` tag that
        // the field itself cannot display, so the whole row disappeared and
        // the typed value was lost
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));

        var entityTags = collectTags(localized);

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'NotALanguage');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Qapla');
        selection.selectAll('.localized-value').node().dispatchEvent(new Event('change'));

        // no hidden tag was written, and the row (with its value) stays
        expect(entityTags['name:notalanguage']).toBeUndefined();
        expect(iD.utilGetSetValue(selection.selectAll('.localized-lang'))).toEqual('');
        expect(iD.utilGetSetValue(selection.selectAll('.localized-value'))).toEqual('Qapla');
    });

    it('does not dispatch a change when the entered language is not recognized', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));

        var calls = 0;
        localized.on('change', function() { calls++; });

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'NotALanguage');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        expect(calls).toEqual(0);
    });

    it('commits the pending value when a valid language is entered after an unrecognized one', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));

        var entityTags = collectTags(localized);

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'NotALanguage');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Qapla');
        selection.selectAll('.localized-value').node().dispatchEvent(new Event('change'));

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'Deutsch');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        expect(entityTags).toEqual({'name:de': 'Qapla'});
    });

    it('keeps an existing row and tag when the new language is not recognized', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        var entityTags = collectTags(localized, {'name:de': 'Value'});

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'NotALanguage');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        // the existing tag is untouched and the input reverts to the language label
        expect(entityTags).toEqual({'name:de': 'Value'});
        expect(iD.utilGetSetValue(selection.selectAll('.localized-lang'))).toEqual('German');
        expect(iD.utilGetSetValue(selection.selectAll('.localized-value'))).toEqual('Value');
    });

    it('keeps an existing row and tag when the language reverts on blur', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        var entityTags = collectTags(localized, {'name:de': 'Value'});

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'NotALanguage');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('blur'));

        // blur re-runs changeLang on the reverted label, resolving back to 'de'
        expect(entityTags).toEqual({'name:de': 'Value'});
        expect(iD.utilGetSetValue(selection.selectAll('.localized-lang'))).toEqual('German');
    });

    it('reverts to the raw code when the previous language is not in the list', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'name:tlh': 'Value'});

        var entityTags = collectTags(localized, {'name:tlh': 'Value'});

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'NotALanguage');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        expect(entityTags).toEqual({'name:tlh': 'Value'});
        expect(iD.utilGetSetValue(selection.selectAll('.localized-lang'))).toEqual('tlh');
    });

    it('changes an existing tag to a language code not in the list', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'name:de': 'Value'});

        var entityTags = collectTags(localized, {'name:de': 'Value'});

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'tlh');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        expect(entityTags).toEqual({'name:tlh': 'Value'});
    });

    it('rejects a language that cannot form a tag suffix', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({name: 'Main'});
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));

        var entityTags = collectTags(localized, {name: 'Main'});

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'NotMain');
        selection.selectAll('.localized-value').node().dispatchEvent(new Event('change'));

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), '!!!');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        // '!!!' cannot form a valid name:<lang> tag, so the junk key and its
        // value must not be written
        expect(entityTags).toEqual({name: 'Main'});
        expect(entityTags['name:!!!']).toBeUndefined();
    });

    it('accepts a language code with a script subtag', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));

        var entityTags = collectTags(localized);

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'sr-latn');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Beograd');
        selection.selectAll('.localized-value').node().dispatchEvent(new Event('change'));

        expect(entityTags).toEqual({'name:sr-Latn': 'Beograd'});
    });

    it('accepts an uppercase language code input', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));

        var entityTags = collectTags(localized);

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'SR-LATN');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Beograd');
        selection.selectAll('.localized-value').node().dispatchEvent(new Event('change'));

        expect(entityTags).toEqual({'name:sr-Latn': 'Beograd'});
    });

    it('accepts a valid language code not present in the language list', async () => {
        var localized = iD.uiFieldLocalized(field, context);
        await setTimeout(20);
        selection.call(localized);
        selection.selectAll('.localized-add').node().dispatchEvent(new MouseEvent('click'));

        var entityTags = collectTags(localized);

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'tlh');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        iD.utilGetSetValue(selection.selectAll('.localized-value'), 'Qapla');
        selection.selectAll('.localized-value').node().dispatchEvent(new Event('change'));

        expect(entityTags).toEqual({'name:tlh': 'Qapla'});
        expect(iD.utilGetSetValue(selection.selectAll('.localized-lang'))).toEqual('tlh');
    });

    it('accepts a language change on a field key that contains a colon', async () => {
        var bridgeField = iD.presetField('bridge:name', { key: 'bridge:name', type: 'localized' });
        bridgeField.locked = function() { return false; };
        var localized = iD.uiFieldLocalized(bridgeField, context);
        await setTimeout(20);
        selection.call(localized);
        localized.tags({'bridge:name:de': 'Value'});

        var entityTags = collectTags(localized, {'bridge:name:de': 'Value'});

        iD.utilGetSetValue(selection.selectAll('.localized-lang'), 'tlh');
        selection.selectAll('.localized-lang').node().dispatchEvent(new Event('change'));

        expect(entityTags).toEqual({'bridge:name:tlh': 'Value'});
    });
});
