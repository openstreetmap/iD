import { setTimeout } from 'node:timers/promises';

describe('iD.uiConfirm', function () {
    var elem;

    beforeEach(function() {
        elem = d3.select('body')
            .append('div')
            .attr('class', 'confirm-wrap');
    });

    afterEach(function() {
        d3.select('.confirm-wrap')
            .remove();
    });

    it('can be instantiated', function () {
        var selection = iD.uiConfirm(elem);
        expect(selection).to.be.ok;
    });

    it('has a header section', function () {
        var selection = iD.uiConfirm(elem);
        expect(selection.selectAll('div.content div.header').size()).to.equal(1);
    });

    it('has a message section', function () {
        var selection = iD.uiConfirm(elem);
        expect(selection.selectAll('div.content div.message-text').size()).to.equal(1);
    });

    it('has a buttons section', function () {
        var selection = iD.uiConfirm(elem);
        expect(selection.selectAll('div.content div.buttons').size()).to.equal(1);
    });

    it('can have an ok button added to it', function () {
        var selection = iD.uiConfirm(elem).okButton();
        expect(selection.selectAll('div.content div.buttons button.action').size()).to.equal(1);
    });

    it('can be dismissed by calling close function', async () => {
        var selection = iD.uiConfirm(elem);
        selection.close();
        await setTimeout(275);
        d3.timerFlush();
        expect(selection.node().parentNode).to.be.null;
    });

    it('can be dismissed by clicking the close button', async () => {
        var selection = iD.uiConfirm(elem);
        happen.click(selection.select('button.close').node());
        await setTimeout(275);
        d3.timerFlush();
        expect(selection.node().parentNode).to.be.null;
    });

    it('can be dismissed by pressing escape', async () => {
        var selection = iD.uiConfirm(elem);
        happen.keydown(document, {keyCode: 27});
        happen.keyup(document, {keyCode: 27});
        await setTimeout(275);
        d3.timerFlush();
        expect(selection.node().parentNode).to.be.null;
    });

    it('can be dismissed by pressing backspace', async () => {
        var selection = iD.uiConfirm(elem);
        happen.keydown(document, {keyCode: 8});
        happen.keyup(document, {keyCode: 8});
        await setTimeout(275);
        d3.timerFlush();
        expect(selection.node().parentNode).to.be.null;
    });

    it('can be dismissed by clicking the ok button', async () => {
        var selection = iD.uiConfirm(elem).okButton();
        happen.click(selection.select('div.content div.buttons button.action').node());
        await setTimeout(275);
        d3.timerFlush();
        expect(selection.node().parentNode).to.be.null;
    });
});
