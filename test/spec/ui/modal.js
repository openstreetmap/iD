import { setTimeout } from 'node:timers/promises';

describe('iD.uiModal', function () {
    var elem;

    beforeEach(function() {
        elem = d3.select('body')
            .append('div')
            .attr('class', 'modal-wrap');
    });

    afterEach(function() {
        d3.select('.modal-wrap')
            .remove();
    });

    it('can be instantiated', function() {
        var selection = iD.uiModal(elem);
        expect(selection).to.be.ok;
    });

    it('has a content section', function () {
        var selection = iD.uiModal(elem);
        expect(selection.selectAll('div.content').size()).to.equal(1);
    });

    it('can be dismissed by calling close function', async () => {
        var selection = iD.uiModal(elem);
        selection.close();
        await setTimeout(275);
        d3.timerFlush();
        expect(selection.node().parentNode).to.be.null;
    });

    it('can be dismissed by clicking the close button', async () => {
        var selection = iD.uiModal(elem);
        happen.click(selection.select('button.close').node());
        await setTimeout(275);
        d3.timerFlush();
        expect(selection.node().parentNode).to.be.null;
    });

    it('can be dismissed by pressing escape', async () => {
        var selection = iD.uiModal(elem);
        happen.keydown(document, {keyCode: 27});
        happen.keyup(document, {keyCode: 27});
        await setTimeout(275);
        d3.timerFlush();
        expect(selection.node().parentNode).to.be.null;
    });

    it('can be dismissed by pressing backspace', async () => {
        var selection = iD.uiModal(elem);
        happen.keydown(document, {keyCode: 8});
        happen.keyup(document, {keyCode: 8});
        await setTimeout(275);
        d3.timerFlush();
        expect(selection.node().parentNode).to.be.null;
    });

});
