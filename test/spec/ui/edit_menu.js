import { select as d3_select } from 'd3-selection';
import { dispatch as d3_dispatch } from 'd3-dispatch';

describe('iD.uiEditMenu', function() {
    var container, context, map, menu;
    var viewport = { top: 100, bottom: 600, width: 800, height: 500 };
    var toolbarHeight = 40;
    var menuHeight = 8 + 3 * 34;

    beforeEach(function() {
        container = d3_select('body').append('div');
        container.append('div')
            .attr('class', 'top-toolbar-wrap')
            .property('__dimensions__', [800, toolbarHeight]);
        container.append('div').attr('class', 'over-map');

        map = d3_dispatch('move', 'drawn');
        var projection = loc => loc;
        projection.invert = loc => loc;
        projection.scale = () => 1;
        context = {
            container: () => container,
            map: () => map,
            projection: projection,
            surfaceRect: () => viewport
        };
        var operations = ['move', 'copy', 'delete'].map(id => ({
            id: id,
            title: id,
            tooltip: () => id,
            keys: [],
            disabled: () => false
        }));
        menu = iD.uiEditMenu(context).operations(operations).anchorLoc([400, 400]);
    });

    afterEach(function() {
        container.remove();
    });

    function menuBottom() {
        return viewport.top + toolbarHeight +
            parseFloat(container.select('.edit-menu').style('top')) + menuHeight;
    }

    it('keeps the normal bottom margin without walkthrough navigation', function() {
        container.select('.over-map').call(menu);
        expect(menuBottom()).to.equal(viewport.bottom - 45);
    });

    it('keeps the menu above the walkthrough navigation on a short viewport', function() {
        var footerTop = viewport.bottom - 90;
        container.append('div').attr('class', 'intro-nav-wrap')
            .node().getBoundingClientRect = () => ({ top: footerTop, height: 60 });

        container.select('.over-map').call(menu);

        expect(menuBottom()).to.be.at.most(footerTop);
    });

    it('updates the menu position when the walkthrough navigation changes height', function() {
        var footerTop = viewport.bottom - 90;
        container.append('div').attr('class', 'intro-nav-wrap')
            .node().getBoundingClientRect = () => ({ top: footerTop });
        container.select('.over-map').call(menu);

        footerTop -= 40;
        map.call('drawn', null, { full: true });

        expect(menuBottom()).to.be.at.most(footerTop);
    });

    it('does not move a menu already above the walkthrough navigation', function() {
        container.append('div').attr('class', 'intro-nav-wrap')
            .node().getBoundingClientRect = () => ({ top: viewport.bottom - 90 });
        menu.anchorLoc([400, 200]);

        container.select('.over-map').call(menu);

        expect(menuBottom()).to.equal(viewport.top + 200 + menuHeight);
    });
});
