import { setTimeout } from 'node:timers/promises';

describe('iD.uiSectionRawTagEditor', function() {
    var taglist, element, entity, context;

    function render(tags) {
        taglist = iD.uiSectionRawTagEditor('raw-tag-editor', context)
            .entityIDs([entity.id])
            .presets([{isFallback: function() { return false; }}])
            .tags(tags)
            .expandedByDefault(true);

        element = d3.select('body')
            .append('div')
            .attr('class', 'ui-wrap')
            .call(taglist.render);
    }

    beforeEach(function () {
        entity = iD.osmNode({id: 'n12345'});
        context = iD.coreContext().assetPath('../dist/').init();
        context.history().merge([entity]);
        render({highway: 'residential'});
    });

    afterEach(function () {
        d3.selectAll('.ui-wrap')
            .remove();
    });


    it('creates input elements for each key-value pair', function () {
        expect(element.selectAll('input[value=highway]')).not.to.be.empty;
        expect(element.selectAll('input[value=residential]')).not.to.be.empty;
    });

    it('creates a pair of empty input elements if the entity has no tags', function () {
        element.remove();
        render({});
        expect(element.select('.tag-list').selectAll('input.value').property('value')).to.be.empty;
        expect(element.select('.tag-list').selectAll('input.key').property('value')).to.be.empty;
    });

    it('adds tags when clicking the add button', async () => {
        happen.click(element.selectAll('button.add-tag').node());
        await setTimeout(20);
        expect(element.select('.tag-list').selectAll('input').nodes()[2].value).to.be.empty;
        expect(element.select('.tag-list').selectAll('input').nodes()[3].value).to.be.empty;
    });

    it('removes tags when clicking the remove button', async () => {
        iD.utilTriggerEvent(element.selectAll('button.remove'), 'mousedown', { button: 0 });
        const tags = await new Promise(cb => {
            taglist.on('change', (_, tags) => cb(tags));
        });
        expect(tags).to.eql({highway: undefined});
    });

    it('adds tags when pressing the TAB key on last input.value', async () => {
        expect(element.selectAll('.tag-list li').nodes().length).to.eql(1);
        var input = d3.select('.tag-list li:last-child input.value').nodes()[0];
        happen.keydown(d3.select(input).node(), {keyCode: 9});
        await setTimeout(20);
        expect(element.selectAll('.tag-list li').nodes().length).to.eql(2);
        expect(element.select('.tag-list').selectAll('input').nodes()[2].value).to.be.empty;
        expect(element.select('.tag-list').selectAll('input').nodes()[3].value).to.be.empty;
    });

    it('does not add a tag when pressing TAB while shift is pressed', async () => {
        expect(element.selectAll('.tag-list li').nodes().length).to.eql(1);
        var input = d3.select('.tag-list li:last-child input.value').nodes()[0];
        happen.keydown(d3.select(input).node(), {keyCode: 9, shiftKey: true});
        await setTimeout(20);
        expect(element.selectAll('.tag-list li').nodes().length).to.eql(1);
    });
});
