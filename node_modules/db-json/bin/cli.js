var fs = require("fs");

var prompt = require('prompt-sync')({
    history: require('prompt-sync-history')() //open history file
});

var jdb = require("../src/jsondb");

module.exports = function(args)
{

    if(args.length !== 1)
        throw new Error("Except 1 argument, got " + args.length);

    var path = args[0];
    var data = JSON.parse(fs.readFileSync(path));
    var db = new jdb.Database(data);

    console.log("Database '" + db.name + "' oppened");

    function execQuery()
    {

        var query = prompt("> ");
        if(query === null)
            return true;

        var updated = db.updated;

        try
        {
            query = JSON.parse(query);
        }
        catch(e)
        {
            console.error("Unable to parse query: invalid json");
            return false;
        }

        try
        {
            var res = db.query(query);
        }
        catch(e)
        {
            console.log(e.message);
            return false;
        }

        if(updated !== db.updated)
            fs.writeFileSync(path, JSON.stringify(db, null, 2));

        console.log(JSON.stringify(res, null, 2));
        return false;
    }

    do
    {
        var stop = execQuery();
    }
    while (!stop);


};
