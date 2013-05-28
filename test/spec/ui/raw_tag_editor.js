describe('iD.ui.RawTagEditor', function() {
    var taglist, element,
        entity, context;

    function render(tags) {
        taglist = iD.ui.RawTagEditor(context)
            .entityID(entity.id)
            .preset({isFallback: function() { return false; }})
            .tags(tags);

        element = d3.select('body')
            .append('div')
            .call(taglist);
    }

    beforeEach(function () {
        entity = iD.Node({id: "n12345"});
        context = iD();
        context.history().merge({n12345: entity});
        render({highway: 'residential'});
    });

    afterEach(function () {
        element.remove();
    });

    it("creates input elements for each key-value pair", function () {
        expect(element.selectAll("input[value=highway]")).not.to.be.empty;
        expect(element.selectAll("input[value=residential]")).not.to.be.empty;
    });

    it("creates a pair of empty input elements if the entity has no tags", function () {
        element.remove();
        render({});
        expect(element.select('.tag-list').selectAll("input.value").property('value')).to.be.empty;
        expect(element.select('.tag-list').selectAll("input.key").property('value')).to.be.empty;
    });

    it("adds tags when clicking the add button", function () {
        element.selectAll("button.add-tag").trigger('click');
        expect(element.select('.tag-list').selectAll("input")[0][2].value).to.be.empty;
        expect(element.select('.tag-list').selectAll("input")[0][3].value).to.be.empty;
    });

    it("removes tags when clicking the remove button", function (done) {
        taglist.on('change', function(tags) {
            expect(tags).to.eql({highway: undefined});
            done();
        });
        element.selectAll("button.remove").trigger('click');
    });

    it("adds tags when pressing the TAB key on last input.value", function () {
        expect(element.selectAll('.tag-list li')[0].length).to.eql(1);
        var input = d3.select('.tag-list li:last-child input.value')[0][0];
        happen.keydown(d3.select(input).node(), {keyCode: 9});
        expect(element.selectAll('.tag-list li')[0].length).to.eql(2);
        expect(element.select('.tag-list').selectAll("input")[0][2].value).to.be.empty;
        expect(element.select('.tag-list').selectAll("input")[0][3].value).to.be.empty;
    });

    it("does not add a tag when pressing TAB while shift is pressed", function () {
        expect(element.selectAll('.tag-list li')[0].length).to.eql(1);
        var input = d3.select('.tag-list li:last-child input.value')[0][0];
        happen.keydown(d3.select(input).node(), {keyCode: 9, shiftKey: true});
        expect(element.selectAll('.tag-list li')[0].length).to.eql(1);
    });
});
