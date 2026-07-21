import { setTimeout } from 'node:timers/promises';
import { select as d3_select } from 'd3-selection';
import { timerFlush as d3_timerFlush } from 'd3-timer';

describe('iD.uiModal', function () {
    var elem;

    beforeEach(function() {
        elem = d3_select('body')
            .append('div')
            .attr('class', 'modal-wrap');
    });

    afterEach(function() {
        d3_select('.modal-wrap')
            .remove();
    });

    it('can be instantiated', function() {
        var selection = iD.uiModal(elem);
        expect(selection).toBeTruthy();
    });

    it('has a content section', function () {
        var selection = iD.uiModal(elem);
        expect(selection.selectAll('div.content').size()).toEqual(1);
    });

    it('can be dismissed by calling close function', async () => {
        var selection = iD.uiModal(elem);
        selection.close();
        await setTimeout(275);
        d3_timerFlush();
        expect(selection.node().parentNode).toBeNull();
    });

    it('can be dismissed by clicking the close button', async () => {
        var selection = iD.uiModal(elem);
        selection.select('button.close').node().dispatchEvent(new MouseEvent('click'));
        await setTimeout(275);
        d3_timerFlush();
        expect(selection.node().parentNode).toBeNull();
    });

    it('can be dismissed by pressing escape', async () => {
        var selection = iD.uiModal(elem);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
        await setTimeout(275);
        d3_timerFlush();
        expect(selection.node().parentNode).toBeNull();
    });

    it('can be dismissed by pressing backspace', async () => {
        var selection = iD.uiModal(elem);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace' }));
        await setTimeout(275);
        d3_timerFlush();
        expect(selection.node().parentNode).toBeNull();
    });

});
