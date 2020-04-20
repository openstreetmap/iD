describe('iD.utilCleanTags', function() {
    it('handles empty tags object', function() {
        var t = {};
        var result = iD.utilCleanTags(t);
        expect(result).to.eql({});
    });

    it('discards empty keys', function() {
        var t = { '': 'bar' };
        var result = iD.utilCleanTags(t);
        expect(result).to.eql({});
    });

    it('discards undefined values', function() {
        var t = { 'foo': undefined };
        var result = iD.utilCleanTags(t);
        expect(result).to.eql({});
    });

    it('trims whitespace', function() {
        var t = {
            'leading': '   value',
            'trailing': 'value  ',
            'both': '   value  '
        };
        var result = iD.utilCleanTags(t);
        expect(result).to.eql({
            'leading': 'value',
            'trailing': 'value',
            'both': 'value'
        });
    });

    it('trims semicolon delimited whitespace', function() {
        var t = {
            'leading': '   value1;  value2',
            'trailing': 'value1  ;value2  ',
            'both': '   value1  ;  value2  '
        };
        var result = iD.utilCleanTags(t);
        expect(result).to.eql({
            'leading': 'value1;value2',
            'trailing': 'value1;value2',
            'both': 'value1;value2'
        });
    });

    it('does not clean description, note, fixme', function() {
        var t = {
            'description': '   value',
            'note': 'value  ',
            'fixme': '   value  '
        };
        var result = iD.utilCleanTags(t);
        expect(result).to.eql(t);
    });

    it('uses semicolon-space delimiting for opening_hours, conditional: tags', function() {
        var t = {
            'opening_hours': ' Mo-Su 08:00-18:00    ;Apr 10-15 off;Jun 08:00-14:00  ;  Aug off; Dec 25 off ',
            'collection_times': '  Mo 10:00-12:00,12:30-15:00    ;Tu-Fr 08:00-12:00,12:30-15:00;Sa 08:00-12:00    ',
            'maxspeed:conditional': '    120 @ (06:00-20:00)   ;80 @ wet  ',
            'restriction:conditional': '  no_u_turn @ (Mo-Fr 09:00-10:00,15:00-16:00;SH off)  '
        };
        var result = iD.utilCleanTags(t);
        expect(result).to.eql({
            'opening_hours': 'Mo-Su 08:00-18:00; Apr 10-15 off; Jun 08:00-14:00; Aug off; Dec 25 off',
            'collection_times': 'Mo 10:00-12:00,12:30-15:00; Tu-Fr 08:00-12:00,12:30-15:00; Sa 08:00-12:00',
            'maxspeed:conditional': '120 @ (06:00-20:00); 80 @ wet',
            'restriction:conditional': 'no_u_turn @ (Mo-Fr 09:00-10:00,15:00-16:00; SH off)'
        });
    });

});

