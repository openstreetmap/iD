describe('iD.uiCmd', function () {
    var orig;
    var ua = navigator.userAgent;
    var uaMock = function () { return ua; };

    beforeEach(function() {
        /* mock userAgent */
        orig = navigator.__lookupGetter__('userAgent');
        navigator.__defineGetter__('userAgent', uaMock);
    });

    afterEach(function() {
        /* restore userAgent */
        navigator.__defineGetter__('userAgent', orig);
    });

    it('does not overwrite mac keybindings', function () {
        ua = 'Mac';
        iD.utilDetect(true);  // force redetection
        expect(iD.uiCmd('⌘A')).toEqual('⌘A');
    });

    it('changes keys to linux versions', function () {
        ua = 'Linux';
        iD.utilDetect(true);  // force redetection
        expect(iD.uiCmd('⌘⌫')).toEqual('Ctrl+Backspace');
        expect(iD.uiCmd('⌘A')).toEqual('Ctrl+A');
        expect(iD.uiCmd('⇧A')).toEqual('Shift+A');
        expect(iD.uiCmd('⌘⇧A')).toEqual('Ctrl+Shift+A');
        expect(iD.uiCmd('⌘⇧Z')).toEqual('Ctrl+Shift+Z');
    });

    it('changes keys to win versions', function () {
        ua = 'Win';
        iD.utilDetect(true);  // force redetection
        expect(iD.uiCmd('⌘⌫')).toEqual('Ctrl+Backspace');
        expect(iD.uiCmd('⌘A')).toEqual('Ctrl+A');
        expect(iD.uiCmd('⇧A')).toEqual('Shift+A');
        expect(iD.uiCmd('⌘⇧A')).toEqual('Ctrl+Shift+A');
        expect(iD.uiCmd('⌘⇧Z')).toEqual('Ctrl+Y');  // special case
    });

    it('handles multi-character keys', function () {
        ua = 'Win';
        iD.utilDetect(true);  // force redetection
        expect(iD.uiCmd('f11')).toEqual('f11');
        expect(iD.uiCmd('⌘plus')).toEqual('Ctrl+plus');
    });

});
