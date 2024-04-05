var prompt = require('prompt-sync')({
    history: require('prompt-sync-history')() //open history file
});

var jdb = require("../src/jsondb");

var DATA_TYPES = [
    "boolean",
    "number",
    "integer",
    "date",
    "string",
    "char",
    "id"
];

function promptDefault(question, value)
{
    var res = prompt(question + "[" + value + "]");
    return res || value;
}

function generateIdField(name)
{
    return {
        name: name,
        nullable: false,
        unique: true,
        type: "id",
        generated: true,
    };
}

function generateBool(message, defaultValue)
{
    defaultValue = defaultValue ? "y" : "n";

    while(true)
    {
        var res = promptDefault(message + " (y/n): ", defaultValue);
        if(res === "y")
            return true;
        else if(res === "n")
            return false;
        console.log("Invalid boolean");
    }
}





function generateType()
{
    while(true)
    {
        var type = prompt("Type: ");
        if(DATA_TYPES.indexOf(type) !== -1)
            return type;
        console.log("Invalid type");
    }
}


function generateField()
{
    var field = {};
    console.log("Generating field...");
    field.name = prompt("Name: ");
    if(!field.name)
        return null;

    field.type = generateType();
    field.nullable = generateBool("Nullable", false);
    field.unique = generateBool("Unique", false);
    field.generated = generateBool("Generated", false);

    return field;
}

function generateTableName(tables)
{
    while(true)
    {
        var name = prompt("Name: ");
        if(!name)
            return null;

        if(tables.indexOf(name) === -1)
            return name;

        console.log("A table with this name already exists");
    }
}

function generateTable(tables)
{
    console.log("Generating table...");
    var table = {};
    table.name = generateTableName(tables);
    if(!table.name)
        return null;

    table.created = new Date().getTime();
    table.updated = table.created;
    table.fields = [];
    table.entries = [];

    var id = prompt("Name of the id field: ");
    if(id)
        table.fields.push(generateIdField(id));

    while(true)
    {
        var field = generateField();
        if(!field)
            return table;
        table.fields.push(field);
    }
}

function generateDatabase()
{
    console.log("Generate database...");
    var db = {};
    db.name = promptDefault("Name: ", "db");
    db.version = promptDefault("Version: ", "1.0.0");
    db.created = new Date().getTime();
    db.updated = db.created;
    db.tables = [];

    var names = [];
    while(true)
    {
        var table = generateTable(names);
        if(!table)
            return db;
        db.tables.push(table);
        names.push(table.name);
    }
}

module.exports = {
    generateField: generateField,
    generateTable: generateTable,
    generateDatabase: generateDatabase
};
