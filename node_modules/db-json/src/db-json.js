/**
 * jsondb version 0.1.0
 * @author Steven Lariau
 */

(function (root, factory) {
    if(typeof define === "function" && define.amd) {
        // Now we're wrapping the factory and assigning the return
        // value to the root (window) and returning it as well to
        // the AMD loader.
        define([], function(){
            return (root.jdb = factory());
        });
    } else if(typeof module === "object" && module.exports) {
        // I've not encountered a need for this yet, since I haven't
        // run into a scenario where plain modules depend on CommonJS
        // *and* I happen to be loading in a CJS browser environment
        // but I'm including it for the sake of being thorough
        module.exports = (root.jdb = factory());
    } else {
        root.jdb = factory();
    }
}(this, function() {

    var _ = {};


    //Library definition

    //#constants


    var ID_LENGTH = 16;
    var DATA_TYPES = [
        "boolean",
        "number",
        "integer",
        "date",
        "string",
        "char",
        "id"
    ];

    var REGEX_TYPES = [
        "number",
        "integer",
        "string"
    ];

    var DATABASE_PROPERTIES = [
        "name",
        "version",
        "updated",
        "created",
        "tables"
    ];

    var TABLE_PROPERTIES = [
        "name",
        "created",
        "updated",
        "fields",
        "entries"
    ];

    var FIELD_PROPERTIES = [
        "name",
        "nullable",
        "unique",
        "type",
        "generated",
        "default",
        "regex",
        "regexFlags",
        "minValue",
        "maxValue",
        "minLength",
        "maxLength"
    ];


    //#utils

    /**
     * Generates a random integer
     * @param {int} min - minimum value (included)
     * @param {int} max - maximum value (excluded)
     * @return {int}
     */
    function randInt(min, max)
    {
        return Math.floor((max - min) * Math.random() + min);
    }

    /**
     * Returns if a litteral object contains a secific property
     * @param {Object} obj
     * @param {string} property
     * @return {bool}
     */
    function hasProp(obj, property)
    {
        return obj && Object.prototype.hasOwnProperty.call(obj, property);
    }

    /**
     * Polyfill for Object.Create, with the first argument only
     * @param {Object} obj
     * @return {Object}
     */
    function objectCreate(obj)
    {
        var F = function(){};
        F.prototype = obj;
        return new F();
    }

    /**
     * Tests if the object only has properties in the list
     * Returns the first invalid property, or null
     * @param {Object} obj
     * @param {string[]} list
     * @return {string}
     */
    function checkProps(obj, list)
    {
        for(var key in obj)
        {
            if(hasProp(obj, key) && list.indexOf(key) === -1)
                return key;
        }

        return null;
    }


    /**
     * Returns the current timestamp in ms
     * @return {int}
     */
    function time()
    {
        return new Date().getTime();
    }


    //#id field

    var __id_alpha = "012345789abcdefghijklmnopqrstuvwxyz";

    /**
     * Build a random id
     * @return {ID}
     */
    function generateId()
    {
        var id = "";
        for(var i = 0; i < ID_LENGTH; ++i)
            id += __id_alpha[randInt(0, __id_alpha.length)];

        return id;
    }
    _.generateId = generateId;



    //Field checkers

    /**
     * Indicates if a variable is of type boolean
     * @param {any} o - the variable to test type
     * @return {boolean}
     */
    function isBoolean(o)
    {
        return typeof(o) === "boolean";
    }

    /**
     * Indicates if a variable is of type number
     * @param {any} o - the variable to test type
     * @return {boolean}
     */
    function isNumber(o)
    {
        return typeof(o) === "number";
    }

    /**
     * Indicates if a variable is of type number and doesn't have a decimal part
     * @param {any} o - the variable to test type
     * @return {boolean}
     */
    function isInteger(o)
    {
        return isNumber(o) && parseInt(o) === parseFloat(o);
    }

    /**
     * Indicates if a variable is of type number and represents a timestamp
     * @param {any} o - the variable to test type
     * @return {boolean}
     */
    function isDate(o)
    {
        return isInteger(o) && o > 0;
    }

    /**
     * Indicates if a variable is of type string
     * @param {any} o - the variable to test type
     * @return {boolean}
     */
    function isString(o)
    {
        return Object.prototype.toString.call(o) === "[object String]";
    }

    /**
     * Indicates if a variable if of type string and has a length of 1
     * @param {any} o - the variable to test type
     * @return {boolean}
     */
    function isChar(o)
    {
        return isString(o) && o.length === 1;
    }

    /**
     * Indicates if a variable is of type id
     * @param {any} o - the variable to test type
     * @return {boolean}
     */
    function isId(o)
    {
        if(!isString(o) || o.length !== ID_LENGTH)
            return false;

        for(var i = 0; i < ID_LENGTH; ++i)
        {
            if(__id_alpha.indexOf(o[i]) === -1)
                return false;
        }

        return true;
    }
    _.isId = isId;

    /**
     * Indicates if a variable is of type array
     * @param {any} o - the variable to test type
     * @return {boolean}
     */
    function isArray(o)
    {
        return Object.prototype.toString.call(o) === '[object Array]';
    }

    /**
     * Indicates if a variable is of type litteral object
     * @param {any} o - the variable to test type
     * @return {boolean}
     */
    function isObjectLiteral(o)
    {
        return Object.prototype.toString.call(o) === "[object Object]";
    }

    /**
     * Indicates if a variable is null
     * @param {any} o - the variable to test type
     * @return {boolean}
     */
    function isNull(o)
    {
        return o === null;
    }

    /**
     * Indicates if a variable is undefined
     * @param {any} o - the variable to test type
     * @return {boolean}
     */
    function isUndefined(o)
    {
        return typeof o === "undefined";
    }


    var isTypeMap = {
        "boolean": isBoolean,
        "number": isNumber,
        "integer": isInteger,
        "date": isDate,
        "string": isString,
        "char": isChar,
        "id": isId
    };




    /**
     * Returns an error message if the value isn't a boolean
     * returns null otherwise
     * @param {any} o
     * @return {string}
     */
    function checkBoolean(o)
    {
        if(isBoolean(o))
            return null;
        else
            return "The value {" + o + "} isn't a boolean";
    }

    /**
     * Returns an error message if the value isn't a number
     * returns null otherwise
     * @param {any} o
     * @return {string}
     */
    function checkNumber(o)
    {
        if(isNumber(o))
            return null;
        else
            return "The value {" + o + "} isn't a number";
    }

    /**
     * Returns an error message if the value isn't an integer
     * returns null otherwise
     * @param {any} o
     * @return {string}
     */
    function checkInteger(o)
    {
        if(isInteger(o))
            return null;
        else
            return "The value {" + o + "} isn't an integer";
    }

    /**
     * Returns an error message if the value isn't a date
     * returns null otherwise
     * @param {any} o
     * @return {string}
     */
    function checkDate(o)
    {
        if(isDate(o))
            return null;
        else
            return "The value {" + o + "} isn't a date timestamp";
    }



    /**
     * Returns an error message if the value isn't a string
     * returns null otherwise
     * @param {any} o
     * @return {string}
     */
    function checkString(o)
    {
        if(isString(o))
            return null;
        else
            return "The value {" + o + "} isn't a string";
    }

    /**
     * Returns an error message if the value isn't a char
     * returns null otherwise
     * @param {any} o
     * @return {string}
     */
    function checkChar(o)
    {
        if(isChar(o))
            return null;
        else
            return "The value {" + o + "} isn't a char";
    }

    /**
     * Returns an error message if the value isn't an id
     * returns null otherwise
     * @param {any} o
     * @return {string}
     */
    function checkId(o)
    {
        if(isId(o))
            return null;
        else
            return "The value {" + o + "} isn't an id";
    }

    /**
     * Returns an error message if the value is null
     * returns null otherwise
     * @param {any} o
     * @return {string}
     */
    function checkNotNull(o)
    {
        if(!isNull(o))
            return null;
        else
            return "The value cannot be null";
    }

    var checkTypeMap = {
        "boolean": checkBoolean,
        "number": checkNumber,
        "integer": checkInteger,
        "date": checkDate,
        "string": checkString,
        "char": checkChar,
        "id": checkId
    };


    //#Filter

    /**
     * Returns the union of several arrays
     * @param {any...} arrs
     * @return {any[]}
     */
    function arraysOr()
    {
        var unique = [];

        for(var i = 0; i < arguments.length; ++i)
        {
            var arr = arguments[i];
            for(var j = 0; j < arr.length; ++j)
                if(unique.indexOf(arr[j]) === -1)
                    unique.push(arr[j]);
        }

        return unique;
    }

    /**
     * Returns the intersection of several arrays
     * @param {any...} arrs
     * @return {any[]}
     */
    function arraysAnd()
    {
        if(!arguments.length)
            return [];

        var inter = [];
        var arr1 =  arguments[0];

        for(var i = 0; i < arr1.length; ++i)
        {
            var value = arr1[i];
            for(var j = 1; j < arguments.length; ++j)
                if(arguments[j].indexOf(value) === -1)
                    break;

            if(j === arguments.length)
                inter.push(value);
        }

        return inter;
    }

    var filterExample = [

        /*
         * Field Filter : [$<field>, op1, args..s, op2, args..., ops...]
         * Possible ops :
         * =: value => test ===
         * !=: value => test !===
         * !: => test null
         * !!: => test not null
         * >: value => test >
         * >=: value => test >=
         * <: value => <
         * <=: value => test <=
         * len[: n => test length >= n (string only)
         * len]: n => test length <= n (string only)
         * len[]: l, h => test l <= length <= h (string only)
         * reg: regex => regex.test() (char / string only)
         * regf: regex, flags => regex.test() (char / string only)
         *
         * And filter : [and, filter1, filter2, ...]
         * Returns entries validated by each filter
         *
         * Or filter: [or, filter, filter2, ...]
         * Returns entries validated by any filter
         *
         * "*"
         * Returns all entries
         */

        "or",
        ["$type", ">", 3],
        ["$username", "reg", "[012]$"]

    ];

    /**
     * @param {Object | any[]} node
     * @return {(entries: Object[]): Object[]}
     */
    function buildFilter(table, node)
    {
        if(node === '*')
        {
            return function(entries) {return entries; }
        }

        if(!isArray(node))
            throw new Error("Filter: node must bust an array");
        if(!node.length)
            throw new Error("Filter: node is empty");

        var name = node[0];
        if(!isString(name))
            throw new Error("Filter: the node's name must be a string");

        if(name[0] === "$")
        {
            var field = name.substring(1);
            return buildFieldFilter(table, node, field);
        }

        if(name === "and")
            return buildAndFilter(table, node);
        else if(name === "or")
            return buildOrFilter(table, node);
        else
            throw new Error("Filter: unknown node '" + name + "'");
    }

    function buildAndFilter(table, node)
    {
        var filters = [];
        for(var i = 1; i < node.length; ++i)
            filters.push(buildFilter(table, node[i]));

        return function(entries)
        {
            for(var i = 0; i < filters.length; ++i)
                entries = filters[i](entries);
            return entries;
        }
    }

    function buildOrFilter(table, node)
    {
        var filters = [];
        for(var i = 1; i < node.length; ++i)
            filters.push(buildFilter(table, node[i]));

        return function(entries)
        {
            var res = [];
            for(var i = 0; i < filters.length; ++i)
                res[i] = filters[i](entries);

            return arraysOr.apply(null, res);
        }
    }

    function buildFieldFilter(table, node, field)
    {
        if(!hasProp(table._fieldsMap, field))
            throw new Error("Filter for '" + field + "': Unknown field in '"
                            + table.name + "'");
        var fieldObject = table._fieldsMap[field];

        var filters = [];
        var i = 1;


        while(i < node.length)
        {
            var op = node[i];
            if(!isString(op) || !hasProp(fieldFilters, op))
                throw new Error("Filter for '" + field + "': Unknown op {"
                                + op + "}");
            op = fieldFilters[op];

            var n = op[0];
            if(i + n >= node.length)
                throw new Error("Filter for '" + field +
                                "': Missing arguments");

            var args = [table, fieldObject].concat(node.slice(i+1, i+1+n));
            filters.push(op[1].apply(null, args));
            i += 1 + n;
        }


        return function(entries)
        {
            for(var i = 0; i < filters.length; ++i)
                entries = filters[i](entries);
            return entries;
        }
    }

    var fieldFilters = {

        "=": [1, function(table, field, arg)
              {
                  var type = field.type;
                  var unique = field.unique;
                  var name = field.name;
                  var typeError = checkTypeMap[type](arg);
                  if(typeError)
                      throw new Error("Filter '=': " + typeError);

                  return function(entries)
                  {
                      var res = [];
                      for(var i = 0; i < entries.length; ++i)
                          if(entries[i][name] === arg)
                              res.push(entries[i]);
                      return res;
                  }
              }],

        "!=": [1, function(table, field, arg)
              {
                  var type = field.type;
                  var unique = field.unique;
                  var name = field.name;
                  var typeError = checkTypeMap[type](arg);
                  if(typeError)
                      throw new Error("Filter '!=': " + typeError);

                  return function(entries)
                  {
                      var res = [];
                      for(var i = 0; i < entries.length; ++i)
                          if(entries[i][name] !== arg)
                              res.push(entries[i]);
                      return res;
                  }
              }],

        "!": [0, function(table, field)
              {
                  var type = field.type;
                  var unique = field.unique;
                  var name = field.name;
                  return function(entries)
                  {
                      var res = [];
                      for(var i = 0; i < entries.length; ++i)
                          if(isNull(entries[i][name]))
                              res.push(entries[i]);
                      return res;
                  }
              }],

        "!!": [0, function(table, field)
              {
                  var type = field.type;
                  var unique = field.unique;
                  var name = field.name;
                  return function(entries)
                  {
                      var res = [];
                      for(var i = 0; i < entries.length; ++i)
                          if(!isNull(entries[i][name]))
                              res.push(entries[i]);
                      return res;
                  }
              }],

        ">": [1, function(table, field, arg)
              {
                  var type = field.type;
                  var unique = field.unique;
                  var name = field.name;
                  var typeError = checkTypeMap[type](arg);
                  if(typeError)
                      throw new Error("Filter '>': " + typeError);

                  return function(entries)
                  {
                      var res = [];
                      for(var i = 0; i < entries.length; ++i)
                          if(entries[i][name] > arg)
                              res.push(entries[i]);
                      return res;
                  }
              }],

        ">=": [1, function(table, field, arg)
              {
                  var type = field.type;
                  var unique = field.unique;
                  var name = field.name;
                  var typeError = checkTypeMap[type](arg);
                  if(typeError)
                      throw new Error("Filter '>=': " + typeError);

                  return function(entries)
                  {
                      var res = [];
                      for(var i = 0; i < entries.length; ++i)
                          if(entries[i][name] >= arg)
                              res.push(entries[i]);
                      return res;
                  }
              }],

        "<": [1, function(table, field, arg)
              {
                  var type = field.type;
                  var unique = field.unique;
                  var name = field.name;
                  var typeError = checkTypeMap[type](arg);
                  if(typeError)
                      throw new Error("Filter '<': " + typeError);

                  return function(entries)
                  {
                      var res = [];
                      for(var i = 0; i < entries.length; ++i)
                          if(entries[i][name] < arg)
                              res.push(entries[i]);
                      return res;
                  }
              }],

        "<=": [1, function(table, field, arg)
              {
                  var type = field.type;
                  var unique = field.unique;
                  var name = field.name;
                  var typeError = checkTypeMap[type](arg);
                  if(typeError)
                      throw new Error("Filter '<=': " + typeError);

                  return function(entries)
                  {
                      var res = [];
                      for(var i = 0; i < entries.length; ++i)
                          if(entries[i][name] <= arg)
                              res.push(entries[i]);
                      return res;
                  }
              }],

        "len[": [1, function(table, field, arg)
        {
            var type = field.type;
            var unique = field.unique;
            var name = field.name;
            if(type !== "string")
                throw new Error("Filter 'len[': The field '" + name
                                + "'must be a string");

            if(!isInteger(arg) || arg < 0)
                throw new Error("Filter: 'len[': arg1 must be unsigned");

            return function(entries)
            {
                var res = [];
                for(var i = 0; i < entries.length; ++i)
                    if(entries[i][name].length >= arg)
                        res.push(entries[i]);
                return res;
            }
        }],

        "len]": [1, function(table, field, arg)
        {
            var type = field.type;
            var unique = field.unique;
            var name = field.name;
            if(type !== "string")
                throw new Error("Filter 'len]': The field '" + name
                                + "'must be a string");

            if(!isInteger(arg) || arg < 0)
                throw new Error("Filter: 'len]': arg1 must be unsigned");

            return function(entries)
            {
                var res = [];
                for(var i = 0; i < entries.length; ++i)
                    if(entries[i][name].length <= arg)
                        res.push(entries[i]);
                return res;
            }
        }],

        "len[]": [2, function(table, field, arg1, arg2)
        {
            var type = field.type;
            var unique = field.unique;
            var name = field.name;
            if(type !== "string")
                throw new Error("Filter 'len[]': The field '" + name
                                + "'must be a string");

            if(!isInteger(arg1) || arg1 < 0)
                throw new Error("Filter: 'len[]': arg1 must be unsigned");
            if(!isInteger(arg2) || arg2 < 0)
                throw new Error("Filter: 'len[]': arg2 must be unsigned");
            if(arg1 > arg2)
                throw new Error("Filter: 'len[]': arg1 must be <= arg2");

            return function(entries)
            {
                var res = [];
                for(var i = 0; i < entries.length; ++i)
                    if(entries[i][name].length >= arg1
                       && entries[i][name].length <= arg2)
                        res.push(entries[i]);
                return res;
            }
        }],

        "reg": [1, function(table, field, arg)
                {
                    var type = field.type;
                    var unique = field.unique;
                    var name = field.name;
                    if(type !== "string" && type !== "char")
                        throw new Error("Filter 'reg': The field '" + name
                                        + "'must be a string");

                    if(!isString(arg))
                        throw new Error("Filter 'reg': arg must be a string");

                    var regex = new RegExp(arg);

                    return function(entries)
                    {
                        var res = [];
                        for(var i = 0; i < entries.length; ++i)
                            if(regex.test(entries[i][name]))
                                res.push(entries[i]);
                        return res;
                    }
                }],

        "regf": [2, function(table, field, arg1, arg2)
                {
                    var type = field.type;
                    var unique = field.unique;
                    var name = field.name;
                    if(type !== "string" && type !== "char")
                        throw new Error("Filter 'regf': The field '" + name
                                        + "'must be a string");

                    if(!isString(arg1))
                        throw new Error("Filter 'reg': arg1 must be a string");
                    if(!isString(arg2))
                        throw new Error("Filter 'reg': arg1 must be a string");

                    var regex = new RegExp(arg1, arg2);

                    return function(entries)
                    {
                        var res = [];
                        for(var i = 0; i < entries.length; ++i)
                            if(regex.test(entries[i][name]))
                                res.push(entries[i]);
                        return res;
                    }
                }]


    };




    //#Orderer


    var ordererExample = [

        /*
         * Pattern : [field1, +/-<type1>, field2, ...]
         *
         * + means ascendant
         * - means descendant
         *
         * types:
         * - val: compare by value using <, > et = operators
         * - len: compare by length (string only)
         */

        "username", "+val", "password", "-len"
    ];

    /**
     * Creates an entries orderer for Array.prototype.sort
     * @param {Table} table
     * @param {string[]} fields
     * @return {(a: any, b:any): number}
     */
    function buildOrderer(table, fields)
    {
        if(!isArray(fields))
            throw new Error("Orderer: fields must be an array");
        if(fields.length % 2)
            throw new Error("Ordered: fields must have an even number of "
                            + "elements");

        var comparers = [];
        for(var i = 0; i < fields.length; i += 2)
            comparers.push(buildComparer(table, fields[i], fields[i+1]));

        return function(a, b)
        {
            for(var i = 0; i < comparers.length; ++i)
            {
                var val = comparers[i](a, b);
                if(val)
                    return val;
            }

            return 0;
        }
    }

    function buildComparer(table, field, arg)
    {
        if(!isString(field) || !hasProp(table._fieldsMap, field))
            throw new Error("Orderer: unknown field '" + field + "'");

        if(!isString(arg) || !arg.length)
            throw new Error("Orderer: type must be a non empty string");

        var sign = arg[0];
        if(sign !== "+" && sign !== "-")
            throw new Error("Orderer: type must start by + or -");
        var asc = sign === "+";
        var type = arg.substring(1);
        if(!hasProp(orderersMap, type))
            throw new Error("Orderer: unknown type '" + type + '"');

        var cmp = orderersMap[type](table, field);

        if(asc)
        {
            return cmp;
        }
        else
        {
            return function(a, b)
            {
                return cmp(b, a);
            }
        }
    }



    var orderersMap = {

        "val": function(table, field)
        {
            return function(a, b)
            {
                if(a[field] < b[field])
                    return -1;
                else if(a[field] > b[field])
                    return 1;
                else
                    return 0;
            }
        },

        "len": function(table, field)
        {
            if(table._fieldsMap[field].type !== "string")
                throw new Error("Ordered len: field '" + field
                                + "' must be a string");

            return function(a, b)
            {
                return a[field].length - b[field].length;
            }
        }

    };

    //#Table

    var tableExample = {

        /*
         * [string] name of the table
         * must be non empty
         * two tables cannot have the same name
         * required
         */
        name: "TableName",

        /*
         * [number] timestamp in ms
         * default: current timestamp
         */
        created: 123,

        /*
         * [number] timestamp in ms
         * default: current timestamp
         */
        updated: 123, //ms timestamp

        /*
         * [Field[]] array of fields (see below)
         * must be non empty
         * required
         */
        fields: [/*...*/],

        /*
         * [Object[]] all entries in the table
         * default: []
         */
        entries: []
    };

    var fieldExample = {
        /*
         * [string] Name of the field
         * unique string
         * required
         */
        name: "Field Name",

        /*
         * [boolean] If the field can be null
         * default: false
         */
        nullable: true,

        /*
         * [boolean] If two entries cannot have the same value for this field
         * default: false
         */
        unique: true,

        /*
         * [string] Type of the field
         * Possible values :
         * - string
         * - number
         * - integer
         * - boolean
         * - id
         * - date
         * required
         */
        type: "string",

        /*
         * [boolean] If the value is generated from it's type (when undefined)
         * Possible generators :
         * - string: ''
         * - number: 0
         * - integer: 0
         * - boolean: false
         * - id: random id
         * - date: current timestamp
         */
        generated: true,

        /*
         * [any] Default field value (when undefined)
         * cannot be used with generated property
         * default: null
         */
        default: "",

        /**
         * [string] Regex to test if a value is valid
         * Only available for strings, chars, numbers and integers
         * The value is converted to string first
         * optional
         */
        regex: "ab.",

        /**
         * [string] The flags of the regex
         * Sames rules than 'regex'
         */
        regexFlags: "i",

        /**
         * [int | number] value must be >= minValue
         * Only available for integers and numbers
         * If the type is integer, this property must also be an integer
         * optional
         */
        minValue: 0,

        /**
         * [int | number] value must be <= maxValue
         * Only available for integers and numbers
         * If the type is integer, this property must also be an integer
         * optional
         */
        maxValue: 0,

        /**
         * [positive int] minimum length for string value
         * Only available for strings
         * optional
         */
        minLength: 0,

        /**
         * [positive int] maximum length for string value
         * Only available for strings
         * optional
         */
        maxLength: 0

    };

    function cloneEntry(entry)
    {
        var clone = {}
        for(var key in entry)
            if(hasProp(entry, key))
                clone[key] = entry[key];
        return clone;
    }

    /**
     * @class
     * Represents a jsdondb table
     * @param {Object} json - See tableExample
     */
    function Table(json)
    {
        if(arguments.length !== 1)
            throw new Error("1 argument expected, got "
                            + arguments.length);

        if(!isObjectLiteral(json))
            throw new Error("First argument must be an object");

        var propError = checkProps(json, TABLE_PROPERTIES);
        if(propError)
            throw new Error("Unknown table property '" + propError + "'");



        if(!hasProp(json, "name"))
            throw new Error("Missing property name");
        if(!isString(json.name) || json.name === "")
            throw new Error("Property 'name' must be a non-empty string");
        this.name = json.name;

        if(!hasProp(json, "created"))
            json.created = time();
        if(!isDate(json.created))
            throw new Error("Property 'created' must be a date");
        this.created = json.created;

        if(!hasProp(json, "updated"))
            json.updated = time();
        if(!isDate(json.updated))
            throw new Error("Property 'updated' must be a date");
        this.updated = json.updated;

        if(!hasProp(json, "fields"))
            throw new Error("Missing property 'fields'");
        if(!isArray(json.fields) || json.fields.length === 0)
            throw new Error("Property 'fields' must be a non-empty array");
        this.fields = json.fields;
        this._initFields();

        if(!hasProp(json, "entries"))
            json.entries = [];
        if(!isArray(json.entries))
            throw new Error("Property 'entries' must be an array");
        this._initEntries(json.entries);

        this._saved = [];
    }

    /**
     * Returns a json representation of the table
     * References to the table are returned, no copy
     * @return {Object}
     */
    Table.prototype.toJSON = function()
    {
        return {
            name: this.name,
            created: this.created,
            updated: this.updated,
            fields: this.fields,
            entries: this.entries
        };
    };


    /**
     * Init and verify if all fields are valid
     * Called only during construction
     */
    Table.prototype._initFields = function()
    {
        this._regexs = {};
        this._fieldsMap = {};
        this._entriesMaps = {};

        for(var i = 0; i < this.fields.length; ++i)
        {
            var field = this.fields[i];
            if(!isObjectLiteral(field))
                throw new Error("Element " + i +
                                " of property 'fields' must be an object");

            this._initField(i, field);
        }
    };

    /**
     * Init and verify a field
     * Called only during contructing
     * @param {int} i - poitions in the 'fields' array
     * @param {Objcect} field - see fieldExample
     */
    Table.prototype._initField = function(i, field)
    {
        var propError = checkProps(field, FIELD_PROPERTIES);
        if(propError)
            throw new Error("Unknown field property '" + propError + "'");

        if(!hasProp(field, "name"))
            throw new Error("fields[" + i + "]: missing property 'name'");
        if(!isString(field.name) || field.name === "")
            throw new Error("fields[" + i +
                            "]: property 'name' must be a non-empty string");
        if(hasProp(this._fieldsMap, field.name))
            throw new Error("fields[" + i +
                            "]: Field '" + field.name + "' already exists");
        var name = field.name;

        if(!hasProp(field, "nullable"))
            field.nullable = false;
        if(!isBoolean(field.nullable))
            throw new Error("Field '" + name +
                            "': property 'nullable' must be a boolean");

        if(!hasProp(field, "unique"))
            field.unique = false;
        if(!isBoolean(field.unique))
            throw new Error("Field '" + name +
                            "': property 'unique' must be a boolean");
        if(field.unique)
            this._entriesMaps[field.name] = {};

        if(!hasProp(field, "type"))
            throw new Error("Field '" + name +
                            "': missing property 'type'");
        if(!isString(field.type))
            throw new Error("Field '" + name +
                            "': property 'type' must be a string");
        if(DATA_TYPES.indexOf(field.type) === -1)
            throw new Error("Field '" + name +
                            "': Unknown 'type': {" + field.type + "}");

        if(!hasProp(field, "generated"))
            field.generated = false;
        if(!isBoolean(field.generated))
            throw new Error("Field '" + name +
                            "': property 'generated' must be a boolean");
        if(field.generated)
        {
            if(hasProp(field, "regex"))
                throw new Error("Field '" + name +
                                "': Property 'regex' forbiden");
            if(hasProp(field, "regexFlags"))
                throw new Error("Field '" + name +
                                "': Property 'regexFlags' forbiden");
            if(hasProp(field, "minValue"))
                throw new Error("Field '" + name +
                                "': Property 'minValue' forbiden");
            if(hasProp(field, "maxValue"))
                throw new Error("Field '" + name +
                                "': Property 'maxValue' forbiden");
             if(hasProp(field, "minLength"))
                throw new Error("Field '" + name +
                                "': Property 'minLength' forbiden");
             if(hasProp(field, "maxLength"))
                throw new Error("Field '" + name +
                            "': Property 'maxLength' forbiden");
        }

        if(hasProp(field, "regex"))
        {
            if(REGEX_TYPES.indexOf(field.type) === -1)
                throw new Error("Field '" + name +
                                "': forbiden property 'regex'");
            if(!isString(field.regex))
                throw new Error("Field '" + name +
                                "': property 'regex' must be a string");
            if(hasProp(field, "regexFlags") && !isString(field.regexFlags))
                throw new Error("Field '" + name +
                                "': property 'regexFlags' must be a string");

            if(hasProp(field, "regexFlags"))
                this._regexs[name] = new RegExp(field.regex, field.regexFlags);
            else
                this._regexs[name] = new RegExp(field.regex);
        }
        else if(hasProp(field, "regexFlags"))
            throw new Error("Field '" + name +
                            "': forbiden property 'regexFlags'");

        if(hasProp(field, "minValue"))
        {
            if(field.type !== "number" && field.type !== "integer")
                throw new Error("Field '" + name +
                                "': forbiden property 'minValue'");

            if(field.type === "number" && !isNumber(field.minValue))
                throw new Error("Field '" + name +
                                "': property 'minValue' must be a number");

            if(field.type === "integer" && !isInteger(field.minValue))
                throw new Error("Field '" + name +
                            "': property 'minValue' must be an integer");
        }

        if(hasProp(field, "maxValue"))
        {
            if(field.type !== "number" && field.type !== "integer")
                throw new Error("Field '" + name +
                                "': forbiden property 'maxValue'");

            if(field.type === "number" && !isNumber(field.maxValue))
                throw new Error("Field '" + name +
                                "': property 'maxValue' must be a number");

            if(field.type === "integer" && !isInteger(field.maxValue))
                throw new Error("Field '" + name +
                                "': property 'maxValue' must be an integer");
            if(hasProp(field, "minValue") && field.maxValue < field.minValue)
                throw new Error("Field '" + name +
                                "': 'maxValue' must be >= 'minValue'");
        }

        if(hasProp(field, "minLength"))
        {
            if(!isInteger(field.minLength) || field.minLength < 0)
                throw new Error("Field '" + name +
                                "': property 'minLength' must be an unsigned");
            if(field.type !== "string")
                throw new Error("Field '" + name +
                                "': property 'minLength' forbiden");
        }

        if(hasProp(field, "maxLength"))
        {
            if(!isInteger(field.maxLength) || field.maxLength < 0)
                throw new Error("Field '" + name +
                                "': property 'maxLength' must be an unsigned");
            if(field.type !== "string")
                throw new Error("Field '" + name +
                                "': property 'maxLength' forbiden");
            if(hasProp(field, "minLength") && field.maxLength < field.minLength)
                throw new Error("Field '" + name +
                                "': 'maxLength' must be >= 'minLength'");
        }

        if(!hasProp(field, "default"))
            field.default = null;

        this._fieldsMap[name] = field;

        if(!isNull(field.default))
        {
            if(field.unique)
                throw new Error("Field '" + name +
                                "': 'default' and 'unique' are incompatible");
            if(field.generated)
                throw new Error("Field '" + name +
                                "': 'default' and 'generated are incompatible");

            var checkError = this._checkFieldValue(name, field.default);
            if(checkError)
                throw new Error("Default value: " + checkError);
        }
    };

    /**
     * Save the corrent state of the table
     */
    Table.prototype._saveState = function()
    {
        this._saved.push(this._cloneData());
    };

    /**
     * Restore the last saved state of the table
     */
    Table.prototype._restoreState = function()
    {
        if(!this._saved.length)
            throw new Error("Restore state: states stack is empty");

        var state = this._saved.pop();
        this._restoreData(state);
    };

    /**
     * Ignore the last saved state of the table
     */
    Table.prototype._ignoreState = function()
    {
        if(!this._saved.length)
            throw new Error("Ignore state: states stack is empty");

        this._saved.pop();
    };

    Table.prototype._cloneData = function()
    {
        var entriesMaps = {};
        for(var field in this._entriesMaps)
            if(hasProp(this._entriesMaps, field))
                entriesMaps[field] = {};

        var entries = [];
        for(var i = 0; i < this.entries.length; ++i)
        {
            var entry = cloneEntry(this.entries[i]);
            entries.push(entry);
            for(var field in entriesMaps)
                if(hasProp(entriesMaps, field))
                    entriesMaps[field][entry[field]] = entry;
        }

        return {
            name: this.name,
            created: this.created,
            updated: this.updated,
            entries: entries,
            entriesMaps: entriesMaps
        };
    };

    Table.prototype._restoreData = function(data)
    {
        this.name = data.name;
        this.created = data.created;
        this.updated = data.updated;
        this.entries = data.entries;
        this._entriesMaps = data.entriesMaps;
    };





    /**
     * Check if the value is valid
     * Returns an error message, or null if ok
     * @param {string} name
     * @param {any} value
1     * @return {string}
     */
    Table.prototype._checkFieldValue = function(name, value)
    {
        var field = this._fieldsMap[name];
        var type = field.type;

        if(isNull(value) && !field.nullable)
            return "field '" + name + "' cannot be null";

        var typeError = checkTypeMap[type](value);
        if(typeError)
            return "field '" + name + "': " + typeError;

        if(hasProp(this._regexs, name))
        {
            var regex = this._regexs[name];
            if(!regex.test(value.toString()))
                return "field '" + name + "': value {" + value +
                "} doesn't validate the regex " + regex;
        }

        if(hasProp(field, "minValue") && value < field.minValue)
            return "field '" + name + "': value {" + value +
                "} is less than {" + field.minValue + "}";

        if(hasProp(field, "maxValue") && value > field.maxValue)
            return "field '" + name + "': value {" + value +
            "} is greater than {" + field.maxValue + "}";

        if(hasProp(field, "minLength") && value.length < field.minLength)
            return "field '" + name + "': size of {" + value +
            "} is less than {" + field.minLength + "}";

        if(hasProp(field, "maxLength") && value.length > field.maxLength)
            return "field '" + name + "': size of {" + value +
            "} is greater than {" + field.maxLength + "}";

        return null;
    };

    /**
     * Check if the values in a partial entry are correct
     * Returns an error string, or null
     * @param {Object} entry
     * @return {string}
     */
    Table.prototype._checkPartialEntry = function(entry)
    {
        for(var field in entry)
        {
            if(hasProp(entry, field))
            {
                if(!hasProp(this._fieldsMap, field))
                    return "Field '" + field + "' doesn't exist";
                var checkError = this._checkFieldValue(field, entry[field]);
                if(checkError)
                    return checkError;
            }
        }

        return null;
    };

    /**
     * Check if entry has all fields, and if they are all valid
     * @param {Object} entry
     * Returns an error string, or null
     * @return {string}
     */
    Table.prototype._checkFullEntry = function(entry)
    {
        for(var i = 0; i < this.fields.length; ++i)
        {
            var field = this.fields[i].name;
            if(!hasProp(entry, field))
                return "Field '" + field + "' is missing";
        }

        return this._checkPartialEntry(entry);
    };

    /**
     * Init and verify if all entries all valid
     * Only called during construction
     */
    Table.prototype._initEntries = function(entries)
    {
        var updated  = this.updated;
        this.entries = [];
        for(var i = 0; i < entries.length; ++i)
        {
            if(!isObjectLiteral(entries[i]))
                throw new Error("Init entry[" + i + "]: Not an object");

            try
            {
                this._insertEntry(entries[i]);
            }
            catch(e)
            {
                throw new Error("Init entry[" + i + "]: " + e.message);
            }


        }

        this.updated = updated;
    };

    /**
     * {Table Operation}
     * Insert an entry into the table
     * Returns the inserted entry
     * @param {Object} entry
     * @return {Object}
     */
    Table.prototype._insertEntry = function(entry)
    {
        var checkError = this._checkPartialEntry(entry);
        if(checkError)
            throw new Error("Insert: " + checkError);

        for(var i= 0; i < this.fields.length; ++i)
        {
            var field = this.fields[i];
            var name = field.name;


            if(!hasProp(entry, name))
            {
                entry[name] = field.generated ? this._generateValue(field)
                    : field.default;
            }

            var valueError = this._checkFieldValue(name, entry[name]);
            if(valueError)
                throw new Error("Insert: " + valueError);

            if(field.unique && hasProp(this._entriesMaps[name], entry[name]))
                throw new Error("Insert: An entry with field '" + name
                                + "'= {" + entry[name] + "} already exists");
        }

        entry = cloneEntry(entry);
        this.entries.push(entry);

        for(var i = 0; i < this.fields.length; ++i)
        {
            var field = this.fields[i];
            var name = field.name;
            var value = entry[name];

            if(field.unique)
                this._entriesMaps[name][value] = entry;
        }

        this.updated = time();
        return entry;
    };

    /**
     * Remove an entry from the table
     * @param {Object} entry - The original entry in the table
     */
    Table.prototype._removeEntry = function(entry)
    {
        this.entries.splice(this.entries.indexOf(entry), 1);
        for(var i = 0; i < this.fields.length; ++i)
        {
            var field = this.fields[i];
            if(field.unique)
                delete this._entriesMaps[field.name][entry[field.name]];
        }
    };

    /**
     * Filter entries from a table using a filter
     * @param {Object} filter - the filter representation
     * @return {Object[]}
     */
    Table.prototype._filterEntries = function(filter)
    {
        return buildFilter(this, filter)(this.entries);
    };

    /**
     * {Table operation}
     * Select entries from the table
     * Return copies of the entries
     * @param {Object} filter - select the entries
     * @param {string[]} orderer = null - order the selected entries
     * If null, no ordering is done
     * @param {int} limit
     * @param {string[]} fields = null - select the returned fields
     * If null, all fields are returned
     * @param {int} offset = 0 - index of the first selected entry
     * @param {int} limit = -1 - maximum number of selected entries
     * If -1, all entries are selected
     * @return {Object[]}
     */
    Table.prototype._selectEntries = function(filter, orderer, fields,
                                              offset, limit)
    {
        if(isUndefined(orderer))
            orderer = null;
        if(isUndefined(fields))
            fields = null;

        if(isNull(fields))
        {
            fields = this._getFieldNames();
        }
        else
        {
            if(!isArray(fields))
                throw new Error("Select: fields must be an array");

            for(var i = 0; i < fields.length; ++i)
                if(!isString(fields[i])
                   || !hasProp(this._fieldsMap, fields[i]))
                    throw new Error("Select: unknown field '" + fields[i]
                                    + "'");
        }

        if(isUndefined(offset))
            offset = 0;
        if(!isInteger(offset) || offset < 0)
            throw new Error("Select: offset must be an integer >= 0");

        if(isUndefined(limit))
            limit = -1;
        if(!isInteger(limit) || limit < -1)
            throw new Error("Select: limit must be an integer >= -1");

        var entries = this._filterEntries(filter);

        if(!isNull(orderer))
            entries.sort(buildOrderer(this, orderer));

        var selected = [];
        for(var i = offset; i < entries.length && selected.length != limit; ++i)
            selected.push(this._createsPartialEntry(entries[i], fields));
        return selected;
    };

    /**
     * @return {string[]}
     */
    Table.prototype._getFieldNames = function()
    {
        var fields = [];
        for(var i = 0; i < this.fields.length; ++i)
            fields[i] = this.fields[i].name;
        return fields;
    };

    /**
     * Returns a new object with only selected fields
     * @param {Object} entry
     * @param {string[]} fields
     * @return {Object}
     */
    Table.prototype._createsPartialEntry = function(entry, fields)
    {
        var obj = {};
        for(var i = 0; i < fields.length; ++i)
            obj[fields[i]] = entry[fields[i]];
        return obj;
    };






    /**
     * {Table Operation}
     * Removes entries from the table
     * Returns the removed entries
     * @param {Object} filter - select the entries to remove
     * @return {Object[]}
     */
    Table.prototype._removeEntries = function(filter)
    {
        var entries = this._filterEntries(filter);
        if(!entries.length)
            return [];

        for(var i = 0; i < entries.length; ++i)
            this._removeEntry(entries[i]);

        this.updated = time();
        return entries;
    };

    /**
     * {Table Operation}
     * Update entries in the table
     * Return updated entries
     * @param {Object} filter - select the entries to update
     * @param {Object} modifs - partial entry extended to all selected entries
     * @return {Object[]}
     */
    Table.prototype._updateEntries = function(filter, modifs)
    {
        var checkError = this._checkPartialEntry(modifs);
        if(checkError)
            throw new Error("Update: " + checkError);
        if(this._setBreakUniques(modifs))
            throw new Error("Update: entries with identical values of unique"
                            + " fields already exists");

        var entries = this._filterEntries(filter);
        if(!entries.length)
            return [];

        if(entries.length > 1 && this._willSetUniques(modifs))
            throw new Error("Update: cannot update unique fields of several "
                            + "entries");

        for(var i = 0; i < entries.length; ++i)
            this._updateEntry(entries[i], modifs);

        this.updated = time();
        return entries;
    };

    /**
     * Tests if an entry update will edit unique fields
     * @param {Object} modifs
     * @return {boolean}
     */
    Table.prototype._willSetUniques = function(modifs)
    {
        for(var field in modifs)
            if(hasProp(modifs, field)
               && this._fieldsMap[field].unique)
                return true;

        return false;
    };

    /**
     * Test if some values of unique fields in modifs already exists
     * @param {Object} modifs
     * @return {boolean}
     */
    Table.prototype._setBreakUniques = function(modifs)
    {
        for(var field in modifs)
            if(hasProp(modifs, field)
               && this._fieldsMap[field].unique
               && hasProp(this._entriesMaps[field], modifs[field].toString()))
                return true;

        return false;
    };

    /**
     * Update an entry in the table
     * Returns an error message, or null
     * @param {Object} entry - The original entry in the table
     * @param {Object} modifs - The fields to modify (already checked)
     * @return {string}
     */
    Table.prototype._updateEntry = function(entry, modifs)
    {
        for(var field in modifs)
        {
            if(hasProp(modifs, field))
            {
                var oldValue = entry[field];
                var newValue = modifs[field];
                if(oldValue !== newValue)
                {
                    var fieldObject = this._fieldsMap[field];
                    entry[field] = newValue;
                    if(fieldObject.unique)
                    {
                        var entryMap = this._entriesMaps[field];
                        delete entryMap[oldValue];
                        entryMap[newValue] = entry;
                    }
                }

            }
        }
    };

    /**
     * {Table Operation}
     * Remove all entries from the table
     */
    Table.prototype._clearEntries = function()
    {
        if(!this.entries.length)
            return;

        this.entries.length = 0;
        for(var i  = 0; i < this.fields.length; ++i)
            if(this.fields[i].unique)
                this._entriesMaps[this.fields[i].name] = {};

        this.updated = time();
    };

    /**
     * Generates default value for a specific field
     * @param {Object} field
     * @return {any}
     */
    Table.prototype._generateValue = function(field)
    {
        var type = field.type;
        if(type === "boolean")
            return this._generateBoolean(field);
        else if(type === "number")
            return this._generateNumber(field);
        else if(type === "integer")
            return this._generateInteger(field);
        else if(type === "date")
            return this._generateDate(field);
        else if(type === "string")
            return this._generateString(field);
        else if(type === "char")
            return this._generateChar(field);
        else if(type === "id")
            return this._generateId(field);
    };

    Table.prototype._generateBoolean = function(field)
    {
        return false;
    }

    Table.prototype._generateNumber = function(field)
    {
        return this._generateInteger(field);
    }

    Table.prototype._generateInteger = function(field)
    {
        var name = field.name;
        var x = 0;
        if(!field.unique)
            return x;

        while(hasProp(this._entriesMaps[name], x.toString()))
            ++x;
        return x;
    };

    Table.prototype._generateDate = function(field)
    {
        var name = field.name;
        var x = time();
        if(!field.unique)
            return x;

        while(hasProp(this._entriesMaps[name], x.toString()))
            ++x;
        return x;
    };

    Table.prototype._generateString = function(field)
    {
        if(!field.unique)
            return "";
        else
            return this._generateInteger(field).toString();
    };

    Table.prototype._generateChar = function(field)
    {
        return '0';
    };

    Table.prototype._generateId = function(field)
    {
        if(!field.unique)
            return generateId();

        var name = field.name;
        do
        {
            var id = generateId();

        } while(hasProp(this._entriesMaps[name], id))

        return id;
    }





    _.Table = Table;




    //#Database

    var databaseExample = {

        /*
         * Name of the databse
         * non-empty string
         * required
         */
        name: "MyDb",

        /*
         * Version of the database
         * non-empty string (doesn't has to respect any versionning norm)
         * required
         */
        version: "1.0.0",

        /*
         * Timestamp of the creation of the database (ms)
         * timestamp
         * default = current timestamp
         */
        created: 123,

        /*
         * Timestamp of the last update of the database (ms)
         * timestamp
         * default = current timestamp
         */
        updated: 123,

        /*
         * Tables in the database
         * Array of json representation of tables
         * default = []
         */
        tables: []

    };

    /*
     * Query form: [<operation name>, arg1, arg2, ...]
     *
     * Database operations:
     * string getName() (Alias: name)
     * void setName(string name) (Alias: name=)
     * string getVersion() (Alias: v)
     * void setVersion(string version) (Alias: v=)
     * int getCreated() (Alias: ctime)
     * int getUpdated() (Alias: utime)
     * string[] listTables() (Alias: ls)
     * void createTable(JSON json) (Alias: tmk)
     * void removeTable(string name) (Alias: trm)
     * void renameTable(string oldName, string newName) (Alias: tmv)
     * void clearTables() (Alias: cl)
     * void removeTables() (Alias: rm*)
     * int tableGetCreated(string name) (Alias: tctime)
     * int tableGetUpdated(string name) (Alias: tutime)
     * Field[] tableGetFields(string name) (Alias: tfi)
     * Entry insert(string name, Entry entry) (Alias: tput)
     * Entry[] select(string name, JSON filter, JSON orderer,
     * string[] fields, int offset, int limit) (Alias: tget)
     * Entry[] remove(string name, JSON filter) (Alias: trm)
     * Entry[] update(string name, JSON filter), Entry modifs) (Alias: tset)
     * void clear(string name) (Alias: tcl)
     */
    var queryExample = [
        "select", "accounts",
        ["$type", ">", 2],
        null,
        ["username", "password"]
    ];




    /**
     * @class
     * Represents a jsondb database
     * @param {Object} json - json representation of the database
     */
    function Database(json)
    {
        if(arguments.length !== 1)
            throw new Error("1 argument expected, got "
                            + arguments.length);

        if(!isObjectLiteral(json))
            throw new Error("First argument must be an object");

        var propError = checkProps(json, DATABASE_PROPERTIES);
        if(propError)
            throw new Error("Unknown databse property '" + propError + "'");

        if(!hasProp(json, "name"))
            throw new Error("Missing property 'name'");
        if(!isString(json.name) || json.name === "")
            throw new Error("Property 'name' must be a non-empty string");
        this.name = json.name;

        if(!hasProp(json, "version"))
            throw new Error("Missing property 'version'");
        if(!isString(json.version) || json.version === "")
            throw new Error("Property 'name' must be a non-empty string");
        this.version = json.version;

        if(!hasProp(json, "created"))
            json.created = time();
        if(!isDate(json.created))
            throw new Error("Property 'created' must be a date");
        this.created = json.created;

        if(!hasProp(json, "updated"))
            json.updated = time();
        if(!isDate(json.updated))
            throw new Error("Property 'updated' must be a date");
        this.updated = json.updated;

        if(!hasProp(json, "tables"))
            json.tables = [];
        if(!isArray(json.tables))
            throw new Error("Property 'tables' must be an array");

        var updated = this.updated;
        this.tables = [];
        this._tablesMap = {};
        for(var i = 0; i < json.tables.length; ++i)
            this._createTable(json.tables[i]);
        this.updated = updated;

        this._saved = [];
    };

    /**
     * Returns the JSON representation of the database
     * References to the database are returned, not copies
     * @return {Object}
     */
    Database.prototype.toJSON = function()
    {
        var tables = [];
        for(var i = 0; i < this.tables.length; ++i)
            tables[i] = this.tables[i].toJSON();

        return {
            name: this.name,
            version: this.version,
            created: this.created,
            updated: this.updated,
            tables: tables
        };
    };

    /**
     * Returns the JSON representation of a table
     * @param {string} name
     * @return {Object}
     */
    Database.prototype.tableToJson = function(name)
    {
        return this._getTable(name).toJSON();
    };


    /**
     * Execute a query on the database
     * @throws {Error} throws an error when the query fails
     * If error, the database is exactly as before (in theory)
     * @param {any[]} query - json query
     * @return {Object} json result
     */
    Database.prototype.query = function(json)
    {
        if(arguments.length !== 1)
            throw new Error("Database.query must receive only one argument");
        if(!isArray(json))
            throw new Error("The query object must be an array");
        if(!isArray.length)
            throw new Error("The query object cannot be empty");

        var operation = json[0];
        if(!isString(operation))
            throw new Error("The query's operation name must be a string");
        if(!hasProp(databaseOperations, operation))
            throw new Error("Unknown query operation '" + operation + "'");

        var args = json.slice(1);
        var op = databaseOperations[operation];
        var minArgs = op[0];
        var maxArgs = op[1];
        var argsErr = minArgs === maxArgs
            ? minArgs.toString() : minArgs + " to " + maxArgs;

        if(args.length < minArgs || args.length > maxArgs)
            throw new Error("Invalid number of arguments for operation '"
                            + operation + "': got " + args.length
                            + ", but expected " + argsErr);

        try
        {
            return op[2].apply(this, args);
        }
        catch(e)
        {
            var message = "jsondb query faillure\n"
                + "Database: '" + this.name + "'\n"
                + "Operation: '" + operation + "'\n"
                + "Message: {" + e.message + "}\n\n"
                + "Query: '" + JSON.stringify(json) + "'";

            throw new Error(message);
        }
    };

    /**
     * Execute a query on the database
     * The database is saved and then restored if any errors happens
     * @throws {Error} throws an error when the query fails
     * @param {any[]} query - json query
     * @return {Object} json result
     */
    Database.prototype.squery = function(json)
    {
        if(arguments.length !== 1)
            throw new Error("Database.squery must receive only one argument");
        this._saveState();

        try
        {
            var res = this.query(json);
            this._ignoreState();
            return res;
        }

        catch(e)
        {
            this._restoreState();
            throw e;
        }
    };

    /**
     * Execute several queries on the database
     * Returns an array of results.
     * @throws {Error} throws an error when a query fails
     * If error, all changes by previous requests are preserved
     * @param {any[][]} json - json queries
     * @return {Object[]} json result
     */
    Database.prototype.queries = function(json)
    {
        if(arguments.length !== 1)
            throw new Error("Database.queries must receive only one argument");
        if(!isArray(json))
            throw new Error("Database.queries must receive a queries array");

        var i;

        try
        {
            var res = [];
            for(i = 0; i < json.length; ++i)
                res[i] = this.query(json[i]);
            return res;
        }
        catch(e)
        {
            throw new Error("Query [" + i + "]: " + e.message);
        }
    };

    /**
     * Execute several queries on the database
     * Returns an array of results.
     * The database is saved and then restored if any errors happens
     * @throws {Error} throws an error when a query fails
     * @param {any[][]} json - json queries
     * @return {Object[]} json result
     */
    Database.prototype.squeries = function(json)
    {
        if(arguments.length !== 1)
            throw new Error("Database.squeries must receive only one argument");
        if(!isArray(json))
            throw new Error("Database.squeries must receive a queries array");
        try
        {
            this._saveState();
            var res = this.queries(json);
            this._ignoreState();
            return res;
        }
        catch(e)
        {
            this._restoreState();
            throw e;
        }
    };


    /**
     * Save the corrent state of the database
     */
    Database.prototype._saveState = function()
    {
        this._saved.push(this._cloneData());
    };

    /**
     * Restore the last saved state of the database
     */
    Database.prototype._restoreState = function()
    {
        if(!this._saved.length)
            throw new Error("Restore state: states stack is empty");

        var state = this._saved.pop();
        this._restoreData(state);
    };

    /**
     * Ignore the last saved state of the database
     */
    Database.prototype._ignoreState = function()
    {
        if(!this._saved.length)
            throw new Error("Ignore state: states stack is empty");

        this._saved.pop();
    };

    Database.prototype._cloneData = function()
    {
        var tables = [];
        var tablesMap = {};

        for(var i = 0; i < this.tables.length; ++i)
        {
            var table = new Table(this.tables[i].toJSON());
            tables[i] = table;
            tablesMap[table.name] = table;
        }

        return {
            name: this.name,
            version: this.version,
            created: this.created,
            updated: this.updated,
            tables: tables,
            tablesMap: tablesMap
        };
    };

    Database.prototype._restoreData = function(data)
    {
        this.name = data.name;
        this.version = data.version;
        this.created = data.created;
        this.updated = data.updated;
        this.tables = data.tables;
        this._tablesMap = data.tablesMap;
    };

    /**
     * Returns the Table object of the correponding table
     * Throws an error if the table doesn't exist.
     * @param {string} name
     * @return {Table}
     */
    Database.prototype._getTable = function(name)
    {
        if(isUndefined(name))
            throw new Error("Table name is missing");
        if(!isString(name))
            throw new Error("Table name must be s string");
        if(!hasProp(this._tablesMap, name))
            throw new Error("The table '" + name + "' doesn't exist");
        return this._tablesMap[name];
    };

    /**
     * {Database Operation}
     * @eturn {string}
     */
    Database.prototype._getName = function()
    {
        return this.name;
    };

    /**
     * {Database Operation}
     * @param {string} name
     */
    Database.prototype._setName = function(name)
    {
        if(!isString(name) || !name)
            throw new Error("The new databse name must be a non-empty string");
        this.name = name;
        this.updated = time();
    };

    /**
     * {Database Operation}
     * @return {string}
     */
    Database.prototype._getVersion = function()
    {
        return this.version;
    };

    /**
     * {Database Operation}
     * @param {string} version
     */
    Database.prototype._setVersion = function(version)
    {
        if(!isString(version) || !version)
            throw new Error("The new databse version must be a " +
                            "non-empty string");
        this.version = version;
        this.updated = time();
    };

    /**
     * {Database Operation}
     * @return {int}
     */
    Database.prototype._getCreated = function()
    {
        return this.created;
    };

    /**
     * {Database Operation}
     * @return {int}
     */
    Database.prototype._getUpdated = function()
    {
        return this.updated;
    };

    /**
     * {Database Operation}
     * Return an array of table's name
     * @return {string[]}
     */
    Database.prototype._listTables = function()
    {
        var tables = [];
        for(var i = 0; i < this.tables.length; ++i)
            tables.push(this.tables[i].name);
        return tables;
    };



    /**
     * {Database Operation}
     * Creates a new table in the database
     * @param {Object} json - json representation of the table
     */
    Database.prototype._createTable = function(json)
    {
        var table = new Table(json);
        if(hasProp(this._tablesMap, table.name))
            throw new Error("Table '" + table.name + "' already exists");
        this.tables.push(table);
        this._tablesMap[table.name] = table;
        this.updated = time();
    };

    /**
     * {Database Operation}
     * Removes a table from the database
     * @param {string} name
     */
    Database.prototype._removeTable = function(name)
    {
        var table = this._getTable(name);
        this.tables.splice(this.tables.indexOf(table), 1);
        delete this._tablesMap[name];
        this.updated = time();
    };

    /**
     * {Database operation}
     * Renames a table from the databse
     * @param {string} oldName
     * @param {string} newName
     */
    Database.prototype._renameTable = function(oldName, newName)
    {
        if(!isString(oldName) || !isString(newName))
            throw new Error("Table name must be a string");
        if(!newName.length)
            throw new Error("Table name canot be empty");
        var table = this._getTable(oldName);

        if(hasProp(this._tablesMap, newName))
            throw new Error("The table '" + newName + "' already exists");

        delete this._tablesMap[oldName];
        this._tablesMap[newName] = table;
        table.name = newName;

        table.updated = time();
        this.updated = table.updated;
    };

    /**
     * {Database Operation}
     * Clear all tables of the database
     */
    Database.prototype._clearTables = function()
    {
        for(var i = 0; i < this.tables.length; ++i)
            this.tables[i]._clearEntries();
        this.updated = time();
    };

    /**
     * {Database Operation}
     * Remove all tables from the database
     */
    Database.prototype._removeTables = function()
    {
        this.tables = [];
        this._tablesMap = {};
        this.updated = time();
    };


    /**
     * {Database Operation}
     * Returns the date of creation of a table
     * @param {string} name - table name
     * @return {int} timestamp
     */
    Database.prototype._tableGetCreated = function(name)
    {
        return this._getTable(name).created;
    };

    /**
     * {Database Operation}
     * Returns the date of update of a table
     * @param {string} name - table name
     * @return {int} timestamp
     */
    Database.prototype._tableGetUpdated = function(name)
    {
        return this._getTable(name).updated;
    };

    /**
     * {Database Operation}
     * Returns a copy of the raw json fields object
     */
    Database.prototype._tableGetFields = function(name)
    {
        var fields = this._getTable(name).fields;
        return JSON.parse(JSON.stringify(fields));
    };

    /**
     * {Database Operation}
     * Insert an entry into a table
     * Returns the inserted entry
     * @param {string} name - table name
     * @param {Object} entry
     * @return {Object}
     */
    Database.prototype._tableInsertEntry = function(name, entry)
    {
        var table = this._getTable(name);
        var res = table._insertEntry(entry);
        this.updated = time();
        return res;
    };

    /**
     * {Database operation}
     * Select entries from a table
     * Return copies of the entries
     * @param {string} name - table name
     * @param {Object} filter - select the entries
     * @param {string[]} orderer - order the selected entries
     * If null, no ordering is done
     * @param {int} limit
     * @param {string[]} fields - select the retured fields
     * If null, all fields are returned
     * @param {int} offset = 0 - index of the first selected entry
     * @param {int} limit = -1 - maximum number of selected entries
     * If -1, all entries are selected
     * @return {Object[]}
     */
    Database.prototype._tableSelectEntries = function(name, filter, orderer,
                                                      fields, offset, limit)
    {
        var table = this._getTable(name);
        return table._selectEntries(filter, orderer, fields, offset, limit);
    };


    /**
     * {Database Operation}
     * Removes entries from a table
     * Returns the removed entries
     * @param {string} name - table name
     * @param {Object} filter - select the entries to remove
     * @return {Object[]}
     */
    Database.prototype._tableRemoveEntries = function(name, filter)
    {
        var table = this._getTable(name);
        var updated = table.updated;
        var res = table._removeEntries(filter);

        if(updated !== table.updated)
            this.updated = table.updated;
        return res;
    };

    /**
     * {Database Operation}
     * Update entries in a table
     * Return updated entries
     * @param {string} name - table name
     * @param {Object} filter - select the entries to update
     * @param {Object} modifs - partial entry extended to all selected entries
     * @return {Object[]}
     */
    Database.prototype._tableUpdateEntries = function(name, filter, modifs)
    {
        var table = this._getTable(name);
        var updated = table.updated;
        var res = table._updateEntries(filter, modifs);

        if(updated !== table.updated)
            this.updated = table.updated;
        return res;
    };

    /**
     * {Database Operation}
     * @param {string} name - table name
     * Remove all entries from a table
     */
    Database.prototype._tableClearEntries = function(name)
    {
        var table = this._getTable(name);
        var updated = table.updated;
        var res = table._clearEntries();

        if(updated !== table.updated)
            this.updated = table.updated;
        return res;
    };

    _.Database = Database;


    var databaseOperations = {
        "getName": [0, 0, Database.prototype._getName],
        "setName": [1, 1, Database.prototype._setName],
        "getVersion": [0, 0, Database.prototype._getVersion],
        "setVersion": [1, 1, Database.prototype._setVersion],
        "getCreated": [0, 0, Database.prototype._getCreated],
        "getUpdated": [0, 0, Database.prototype._getUpdated],
        "listTables": [0, 0, Database.prototype._listTables],
        "createTable": [1, 1, Database.prototype._createTable],
        "removeTable": [1, 1, Database.prototype._removeTable],
        "renameTable": [2, 2, Database.prototype._renameTable],
        "clearTables": [0, 0, Database.prototype._clearTables],
        "removeTables": [0, 0, Database.prototype._removeTables],
        "tableGetCreated": [1, 1, Database.prototype._tableGetCreated],
        "tableGetUpdated": [1, 1, Database.prototype._tableGetUpdated],
        "tableGetFields": [1, 1, Database.prototype._tableGetFields],
        "insert": [2, 2, Database.prototype._tableInsertEntry],
        "select": [2, 6, Database.prototype._tableSelectEntries],
        "remove": [2, 2, Database.prototype._tableRemoveEntries],
        "update": [3, 3, Database.prototype._tableUpdateEntries],
        "clear": [1, 1, Database.prototype._tableClearEntries],

        "name": "getName",
        "name=": "setName",
        "v": "getVersion",
        "v=": "setVersion",
        "ctime": "getCreated",
        "utime": "getUpdated",
        "ls": "listTables",
        "tmk": "createTable",
        "trm": "removeTable",
        "tmv": "renameTable",
        "cl": "clearTables",
        "rm*": "removeTables",
        "tctime": "tableGetCreated",
        "tutime": "tableGetUpdated",
        "tfi": "tableGetFields",
        "tput": "insert",
        "tget": "select",
        "trm": "remove",
        "tset": "update",
        "tcl": "clear"
    };

    (function() {
        for(var key in databaseOperations)
        {
            if(hasProp(databaseOperations, key)
               && isString(databaseOperations[key]))
                databaseOperations[key] =
                databaseOperations[databaseOperations[key]];
        }
    })();



    //#DatabaseHelper


    /**
     * @class
     * @abstract
     * Helper class to manage a database
     * @param {string} version - Current version of the application
     * Used to call an update function if it doesn't match the db version
     * @param {string} data - String representation of the database
     */
    function DatabaseHelper(version, data)
    {
        if(arguments.length !== 2)
            throw new Error("DatbaseHelper() expected 2 arguments, got "
                            + arguments.length);
        if(!version || !isString(version))
            throw new Error("DatabaseHelper version must be a nonempty string");

        if(!isString(data))
            throw new Error("DatabaseHelper data must be a string");
        try
        {
            data = JSON.parse(data);
        }
        catch(e)
        {
            throw new Error("DatabaseHelper data must be a json string");
        }


        this.version = version;
        this.db = new Database(data);
        this.saving = false;
        this.requestSaving = false;

        if(this.db.version !== version)
            this._update(this.db.version, version);
    }

    /**
     * Forces the saving of the database
     */
    DatabaseHelper.prototype.save = function()
    {
        if(this.saving)
            this.requestSaving = true;
        else
            this._saveDb();
    };

    /**
     * Database.query wrapper
     */
    DatabaseHelper.prototype.query = function(json)
    {
        var updated = this.db.updated;
        var res = this.db.query.apply(this.db, arguments);

        if(updated !== this.db.updated && this._shouldSave())
            this.save();
        return res;
    };

    /**
     * Database.squery wrapper
     */
    DatabaseHelper.prototype.squery = function(json)
    {
        var updated = this.db.updated;
        var res = this.db.squery.apply(this.db, arguments);

        if(updated !== this.db.updated && this._shouldSave())
            this.save();
        return res;
    };

    /**
     * Database.queries wrapper
     */
    DatabaseHelper.prototype.queries = function(json)
    {
        var updated = this.db.updated;
        var res = this.db.queries.apply(this.db, arguments);

        if(updated !== this.db.updated && this._shouldSave())
            this.save();
        return res;
    };

    /**
     * Database.squeries wrapper
     */
    DatabaseHelper.prototype.squeries = function()
    {
        var updated = this.db.updated;
        var res = this.db.squeries.apply(this.db, arguments);

        if(updated !== this.db.updated && this._shouldSave())
            this.save();
        return res;
    };

    /**
     * Called when the db version id is different of the appVersion
     * Should update the db
     * @param {string} dbVersion
     * @param {string} appVersion
     */
    DatabaseHelper.prototype._update = function(dbVersion, appVersion)
    {

    };

    /**
     * Called each time there is a modification to known if the database must
     * be saved
     * If true, the database is saved
     * @return {boolean}
     */
    DatabaseHelper.prototype._shouldSave = function()
    {
        return true;
    };

    /**
     * @abstract
     * Method called to save the database representation
     * @param {string} data
     * @param {(err: Error)} cb - callback function
     */
    DatabaseHelper.prototype._saveData = function(data)
    {
        throw new Error("DatabaseHelper._saveData is not implemented");
    };

    DatabaseHelper.prototype._saveDb = function()
    {
        var data = JSON.stringify(this.db, null, 2);
        this.requestSaving = false;
        this.saving = true;

        var self = this;

        this._saveData(data, function(err) {
            if(err)
                console.error(err);

            self.saving = false;
            if(self.requestSaving)
                self._saveDb();
        });
    };


    /**
     * Creates a subclass of DatabaseHelper
     * @param {Object} props - Subclass properties
     * @return {Class}
     */
    DatabaseHelper.extend = function(props)
    {
        var Child = function() { DatabaseHelper.apply(this, arguments); }
        Child.prototype = objectCreate(DatabaseHelper.prototype);

        for(var key in props)
            if(hasProp(props, key))
                Child.prototype[key] = props[key];

        return Child;
    };


    _.DatabaseHelper = DatabaseHelper;

    return _;
}));
