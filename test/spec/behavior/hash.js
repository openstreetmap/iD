import { setTimeout } from 'node:timers/promises';
import { fn } from '@vitest/spy';

describe('iD.behaviorHash', function () {

    var hash, context;

    beforeEach(function () {
        window.location.hash = '#background=none';   // Try not to load imagery
        var container = d3.select(document.createElement('div'));
        context = iD.coreContext().assetPath('../dist/').init().container(container);
        container.call(context.map());
        hash = iD.behaviorHash(context);
    });

    afterEach(function () {
        hash.off();
        window.location.hash = '#background=none';   // Try not to load imagery
    });


    it('sets hadLocation if window.location.hash is present', function () {
        window.location.hash = '#background=none&map=20.00/38.87952/-77.02405';
        hash();
        expect(hash.hadLocation).toBe(true);
    });

    it('centerZooms map to requested coordinates', function () {
        window.location.hash = '#background=none&map=20.00/38.87952/-77.02405';
        hash();
        expect(context.map().center()[0]).toBeCloseTo(-77.02405, 1);
        expect(context.map().center()[1]).toBeCloseTo(38.87952, 1);
        expect(context.map().zoom()).toEqual(20.0);
    });

    it('centerZooms map at requested coordinates on hash change', async () => {
        hash();
        window.location.hash = '#background=none&map=20.00/38.87952/-77.02405';
        await new Promise(cb => { d3.select(window).on('hashchange', cb); });
        expect(context.map().center()[0]).toBeCloseTo(-77.02405, 1);
        expect(context.map().center()[1]).toBeCloseTo(38.87952, 1);
        expect(context.map().zoom()).toEqual(20.0);
        d3.select(window).on('hashchange', null);
    });

    it('sets hadLocation if map-location is in local storage', function () {
        iD.prefs('map-location', '19/43.80082/11.24567');
        hash();
        expect(hash.hadLocation).toBe(true);
        iD.prefs('map-location', null);
    });

    it('centerZooms map to previous map location', function () {
        iD.prefs('map-location', '19/43.80082/11.24567');
        hash();
        expect(context.map().center()[0]).toBeCloseTo(11.24567, 1);
        expect(context.map().center()[1]).toBeCloseTo(43.80082, 1);
        expect(context.map().zoom()).toEqual(19.0);
        iD.prefs('map-location', null);
    });

    it('centerZooms map to map hash if present previous map location', function () {
        iD.prefs('map-location', '19/43.80082/11.24567');
        window.location.hash = '#background=none&map=20.00/38.87952/-77.02405';
        hash();
        expect(context.map().center()[0]).toBeCloseTo(-77.02405, 1);
        expect(context.map().center()[1]).toBeCloseTo(38.87952, 1);
        expect(context.map().zoom()).toEqual(20.0);
        iD.prefs('map-location', null);
    });

    it('stores the current zoom and coordinates in window.location.hash on map move events', async () => {
        hash();
        context.map().center([-77.0, 38.9]);
        context.map().zoom(2.0);
        await setTimeout(600);
        // the hash might contain other things like `disable_features`
        expect(window.location.hash).toContain('background=none');
        expect(window.location.hash).toContain('map=2.00/38.9/-77.0');
    });

    it('accepts default changeset comment as hash parameter', function () {
        window.location.hash = '#comment=foo+bar%20%2B1';
        const container = d3.select(document.createElement('div'));
        const context = iD.coreContext().assetPath('../dist/').init().container(container);
        iD.behaviorHash(context);
        expect(context.defaultChangesetComment()).to.eql('foo bar +1');
        hash.off();
    });

    it('dispatches a (throttled) change event', async () => {
        await setTimeout(100); // wait a bit to let previous tests settle down
        const spy = fn();
        hash();
        hash.on('change', spy);
        context.map().center([45.98, 7.66]);
        await setTimeout(10);
        // too little time passed -> no event yet
        expect(spy).not.toHaveBeenCalled();
        await setTimeout(600);
        // enough time has passed -> event should have been triggered
        expect(spy).toHaveBeenCalled();
    });
});
