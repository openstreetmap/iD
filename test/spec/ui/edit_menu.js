import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

describe('iD.uiEditMenu', function() {
    var container;
    var map;
    var menu;
    var operation;
    var reason;

    beforeEach(function() {
        container = d3_select('body').append('div');
        container.append('div').attr('class', 'over-map');
        map = d3_dispatch('move', 'drawn');
        var projection = loc => loc;
        projection.invert = loc => loc;
        projection.scale = () => 1;
        var context = {
            container: () => container,
            map: () => map,
            projection: projection,
            surfaceRect: () => ({ width: 800, height: 600 }),
            surface: () => container
        };
        reason = false;
        operation = vi.fn();
        operation.id = 'delete';
        operation.title = 'Delete';
        operation.tooltip = () => 'Delete';
        operation.keys = ['Delete'];
        operation.disabled = () => reason;
        menu = iD.uiEditMenu(context).anchorLoc([100, 100]).operations([operation]);
    });

    afterEach(function() {
        menu.close();
        container.remove();
    });

    it('disables an open menu item after a full map redraw', function() {
        container.call(menu);
        expect(container.select('button').classed('disabled')).toBe(false);
        reason = 'connected_to_hidden';
        map.call('drawn', null, { full: true });
        expect(container.select('button').classed('disabled')).toBe(true);
        container.select('button').dispatch('click');
        expect(operation).not.toHaveBeenCalled();
    });

    it('enables an open menu item after a full map redraw', function() {
        reason = 'connected_to_hidden';
        container.call(menu);
        expect(container.select('button').classed('disabled')).toBe(true);
        reason = false;
        map.call('drawn', null, { full: true });
        expect(container.select('button').classed('disabled')).toBe(false);
        container.select('button').dispatch('click');
        expect(operation).toHaveBeenCalledOnce();
    });

    it('keeps interruptible operations enabled after a redraw', function() {
        var interrupt = vi.fn();
        operation.interrupts = { confirm: interrupt };
        container.call(menu);
        reason = 'confirm';
        map.call('drawn', null, { full: true });
        expect(container.select('button').classed('disabled')).toBe(false);
        container.select('button').dispatch('click');
        expect(interrupt).toHaveBeenCalledOnce();
        expect(operation).not.toHaveBeenCalled();
    });

    it('removes the redraw listener when closed', function() {
        container.call(menu);
        menu.close();
        expect(map.on('drawn.edit-menu')).toBeUndefined();
        expect(container.select('.edit-menu').empty()).toBe(true);
    });
});
