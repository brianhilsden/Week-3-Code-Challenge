var fs = require("fs");
var generatator = require("./generator");
var jdb = require("../src/jsondb");


module.exports = function(args)
{

    if(args.length > 1)
        throw new Error("Exept 1 argument max, got " + args.length);

    var path = args.length ? args[0] : "db.json";

    var db = new jdb.Database(generatator.generateDatabase());
    var code = JSON.stringify(db, null, 2);
    console.log("Database code generated");
    fs.writeFileSync(path, code);
    console.log("Database saved at " + path);
};
