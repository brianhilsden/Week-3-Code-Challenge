var jdb = require("../src/db-json");
var fs = require("fs");
var Table = jdb.Table;
var Database = jdb.Database;

var DB_URL = __dirname + "/db.json";
var data = fs.readFileSync(DB_URL).toString();

var MyHelper = jdb.DatabaseHelper.extend({

    _saveData: function(data, cb)
    {
        fs.writeFile(DB_URL, data, cb);
    }

});

var helper = new MyHelper("1.0.0", data);

var res = helper.query(["tget", "accounts", "*"]);
console.log(res);
