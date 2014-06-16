describe("iD.countryCode", function() {
    var server, countryCode, savewgrid;

    beforeEach(function() {
        savewgrid = iD.data.worldGrid;
        iD.data.worldGrid = testwgrid;

        // id.countryCode to re-create grid object
        iD.countryCode.grid = null;
        context = iD();
        countryCode = iD.countryCode(context);
        server = sinon.fakeServer.create();
    });

    afterEach(function() {
        server.restore();
        iD.data.worldGrid = savewgrid;
    });

    function query(url) {
        return iD.util.stringQs(url.substring(url.indexOf('?') + 1));
    }
    function tilespath(url) {
        var i = url.lastIndexOf("tiles");
        return url.substring(i);
    }
    function setresponse () {
        server.respondWith("GET", /.*tiles\/17\/11.json/, 
                [200, {"Content-Type": "application/json"},
                    JSON.stringify(json1711)]);
        server.respond();
    }

    describe("#search", function() {
        it("should return country code from world grid where possible.", function() {
            var callback = sinon.spy();
            countryCode.search([16, 48], callback);
            expect(callback).to.have.been.calledWith(null, "at");

            var callback = sinon.spy();
            countryCode.search([17, 49], callback);
            expect(callback).to.have.been.calledWith(null, "cz");
        });

        it("should return country code after fetching json file as needed.", function() {
            var callback = sinon.spy();
            countryCode.search([16.6383, 48.7935], callback);
            setresponse();
            expect(tilespath(server.requests[0].url))
                .to.eql("tiles/17/11.json");
            expect(callback).to.have.been.calledWith(null, "cz");
        });
 
        it("should wrap around longitude and return the same result.", function() {
            var callback = sinon.spy();
            countryCode.search([360+16.6383, 48.7935], callback);
            setresponse();
            expect(callback).to.have.been.calledWith(null, "cz");
        });

        it("should be able to cache nearby places.", function() {
            var callback = sinon.spy();
            countryCode.search([16.6405, 48.7785], callback);
            setresponse();
            expect(callback).to.have.been.calledWith(null, "at");

            var callback = sinon.spy();      
            countryCode.search([16.6383-720, 48.7935], callback);
            expect(callback).to.have.been.calledWith(null, "cz");
        });

        it("should return error with out-of-range parameters.", function() {
            var callback = sinon.spy();
            countryCode.search([1000, 1000], callback);
            expect(callback).to.have.been.calledWith("Error in input coordinates: out of range");
        });

    });

    // Test return data
    var json1711 = {
    "9":
        {"279":
            {"176":
                {"keys": [118, 1, 97],
                 "grid": [" ", " ", " ", " '!! !!! (", " '!' %", " &!##%!! %",
                          "!'#&!$ #", "#.!$", "#", "#", "#", "#", "#", "#", "#", "#0!!"]}
            }
        },
    "13":
        {"4474":
            {"2820":
                {"keys": [118, 97],
                 "grid": [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", 
                          " ", " )!( !", " (!*", "!' !!*", "!"]}
            }
        }
    };

    var testwgrid = {
        "keys": [
            "", 21, 7, 1, 2, 246, 3, 91, 112, 90, 254, 265, 77, 116, 92, 114, 115, 78, 146, 119, 93, 183, 82, 32, 196,
            121, 202, 94, 80, 118, 79, 120, 97, 122, 148, 98, 130, 40, 96, 123, 224, 128, 147, 124, 185, 68, 132, 165,
            195, 149, 127, 126, 129, 184, 223, 83, 167, 131, 166, 171, 193, 225, 84, 103, 192, 170, 136, 168, 194, 67,
            150, 198, 175, 102, 9, 236, 169, 151, 172, 188, 203, 12, 205, 207, 69, 190, 219, 186, 204, 70, 187, 23, 66,
            104, 138, 31, 137, 215, 209, 221, 22, 25, 258, 237, 208, 26, 48, 177, 15, 54, 242, 176, 10, 13, 55, 46, 42,
            71, 264, 14, 86, 11, 17, 255, 155, 216, 248, 45, 105, 41, 73, 179, 24, 60, 72, 178, 257, 106, 108, 16, 19, 88,
            139, 152, 206, 260, 75, 87, 58, 89, 226, 76, 256, 211, 210, 59, 65, 266, 35, 140, 109, 180, 111, 154, 18, 241,
            110, 228, 262, 20, 157, 240, 252, 239, 141, 229, 263, 268, 144, 214, 36, 158, 161, 181, 250, 234, 182, 259,
            253, 231, 6, 5, 251, 162, 142, 232, 243, 37, 143, 235, 61, 261, 267, 39, 145, 238, 244, 164, 62, 249, 247, 245
        ],
        "data": {
            "1": {
                "code": "*"
            },
            "118": {
                "code": "cz"
            },
            "97": {
                "code": "at"
            }},
        "grid": []};

    for (var i = 0; i < 512; i++) {
        testwgrid.grid[i] = " ";
    }
    testwgrid.grid[175] = " m#&$K#] f=#$$=,$$5'$#>!$#>#$#@!$&:8$#%)$!6Y$$;=$';&$!92$$%6 +%% D";
    testwgrid.grid[176] = " n##$!#!$#'H$%#Z d=%$#=.$!5($(@$$$:($!:1$#%)$!6X$%;G$#94$!%6 +%% D";
    testwgrid.grid[177] = " p$$'L$)#S d=3$#5'$#A$$#@!$):$$&:/$!%*$#6V$#9#$$;E$!9#$#91$#%!$%%) !%$ !%# +%$ E";

});
