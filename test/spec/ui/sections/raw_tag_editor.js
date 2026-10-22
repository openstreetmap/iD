import { select as d3_select, selectAll as d3_selectAll } from 'd3-selection';

describe('iD.uiSectionRawTagEditor', function() {
    var taglist, element, entity, context;

    function render(tags) {
        taglist = iD.uiSectionRawTagEditor('raw-tag-editor', context)
            .entityIDs([entity.id])
            .presets([{isFallback: function() { return false; }}])
            .tags(tags)
            .expandedByDefault(true);

        element = d3_select('body')
            .append('div')
            .attr('class', 'ui-wrap')
            .call(taglist.render);
    }

    beforeEach(function () {
        entity = new iD.osmNode({id: 'n12345'});
        context = iD.coreContext().assetPath('../dist/').init();
        context.history().merge([entity]);
        render({highway: 'residential'});
    });

    afterEach(function () {
        d3_selectAll('.ui-wrap')
            .remove();
    });


    it('creates input elements for each key-value pair', function () {
        expect(element.selectAll('input[title=highway]').size()).toBeGreaterThan(0);
        expect(element.selectAll('input[title=residential]').size()).toBeGreaterThan(0);
    });

    it('creates a pair of empty input elements if the entity has no tags', function () {
        element.remove();
        render({});
        expect(element.selectAll('.tag-list li').nodes().length).toEqual(1);
        expect(element.select('.tag-list').selectAll('input.value').property('value')).toBe('');
        expect(element.select('.tag-list').selectAll('input.key').property('value')).toBe('');
    });

    it('adds pair of empty input elements at end of list', () => {
        expect(element.selectAll('.tag-list li').nodes().length).toEqual(2);
        expect(element.select('.tag-list').selectAll('input').nodes()[2].value).toBe('');
        expect(element.select('.tag-list').selectAll('input').nodes()[3].value).toBe('');
    });

    it('moves focus to the value input when pressing equals in the key input', function() {
        element.remove();
        render({});
        var key = element.select('.tag-list input.key');
        var value = element.select('.tag-list input.value');
        iD.utilTriggerEvent(key,'keydown', { key: '=' });
        expect(document.activeElement).toBe(value.node());
    });

    it('removes tags when clicking the remove button', async () => {
        const tags = new Promise(cb => {
            taglist.on('change', (_, tags) => cb(tags));
        });
        iD.utilTriggerEvent(element.selectAll('button.remove'), 'mousedown', { button: 0 });
        expect(await tags).toEqual({highway: undefined});
    });

    describe('text view', function() {
        it('keeps an incomplete line when the window loses focus', function() {
            var textarea = element.select('textarea.tag-text').node();
            textarea.focus();
            textarea.value = 'highway=residential\nname';

            // switching to another browser tab blurs the textarea, but it stays the active element
            textarea.dispatchEvent(new FocusEvent('blur'));

            expect(document.activeElement).toBe(textarea);
            expect(element.select('textarea.tag-text').property('value')).toBe('highway=residential\nname');
        });

        it('applies changes when focus moves elsewhere', async () => {
            const tags = new Promise(cb => {
                taglist.on('change', (_, tags) => cb(tags));
            });
            var textarea = element.select('textarea.tag-text').node();
            textarea.focus();
            textarea.value = 'highway=residential\nname=Main Street';
            textarea.blur();

            expect(await tags).toEqual({name: 'Main Street'});
        });

        it('shows double quotes and backslashes without escaping them', function() {
            element.remove();
            render({ old_name: 'Viaduto "Zé Cocada"', note: 'C:\\path' });
            expect(element.select('textarea.tag-text').property('value'))
                .toBe('note=C:\\path\nold_name=Viaduto "Zé Cocada"\n');
        });

        it('still quotes values which need it to be read back correctly', function() {
            element.remove();
            render({ a: '"quoted"', b: 'two\nlines', c: 'x=y', d: '"x" ' });
            expect(element.select('textarea.tag-text').property('value'))
                .toBe('a="\\"quoted\\""\nb="two\\nlines"\nc="x=y"\nd="\\"x\\" "\n');
        });

        it('reads back unescaped double quotes and backslashes unchanged', async () => {
            const tags = new Promise(cb => {
                taglist.on('change', (_, tags) => cb(tags));
            });
            var textarea = element.select('textarea.tag-text').node();
            textarea.focus();
            textarea.value = 'highway=residential\nold_name=Viaduto "Zé Cocada"\nnote=C:\\path';
            textarea.blur();

            expect(await tags).toEqual({ old_name: 'Viaduto "Zé Cocada"', note: 'C:\\path' });
        });
    });
});
