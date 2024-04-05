# db-json

db-json is a database completely in json. The database, queries and results are all json data.  
It works both on client-side and server side.  
The databse is structured, with tables composed of typed fields, with optional verifications (pattern, length, range)  
The library works both on browser and node.

The json code of the dabase is human-readable, and can be easily edited at hand.  
If any errors are made, they will be detected when instancing a new Database object with that json code.

## Queries

Query form: `[<operation name>, arg1, arg2, ...]`


### Operations

+ string getName() (Alias: name)  
Return the database name

+ void setName(string name) (Alias: name=)  
Change the name of the database (must be a non-empty string)

+ string getVersion() (Alias: v)  
Return the version of the database

+ void setVersion(string version) (Alias: v=)  
Change the name of the database (must be a non-empty string, no versionning convention to respect)


+ int getCreated() (Alias: ctime)  
Return the timestamp of creation of the dabase in ms

+ int getUpdated() (Alias: utime)  
Return the timestamp of the last modification of the database in ms

+ string[] listTables() (Alias: ls)  
Return the names of the tables in the database

+ void createTable(JSON json) (Alias: tmk)  
Add a new table to the database (See table representation for more info)

+ void removeTable(string name) (Alias: trm)  
Remove a table from the database

+ void renameTable(string oldName, string newName) (Alias: tmv)  
Change the name of a table in the database (the new name bust me a non-empty string)

+ void clearTables() (Alias: cl) 
Remove all entries from all the tables in the database

+ void removeTables() (Alias: rm*)  
Remove all the tables of the database

+ int tableGetCreated(string name) (Alias: tctime)  
Return the timestamp of creation of a table in ms  
name: table name

+ int tableGetUpdated(string name) (Alias: tutime)  
Return the timestamp of the last modification of a table in ms  
name: table name

+ Field[] tableGetFields(string name) (Alias: tfi)  
Return a copy of the raw fields object (See table representation for more info)  
name: table name

+ Entry insert(string name, Entry entry) (Alias: tput)  
Insert an entry into a table and returns the inserted entry (with all fields)  
name: table name  
entry: litteral object of the form `{field: value, field:value, ...}`

+ Entry[] select(string name, JSON filter, JSON orderer, string[] fields, int offset, int limit) (Alias: tget)  
Find and return entries from a table  
name: table name  
filter: select the entries (See filters for more info)  
orderer (default: null): order the select entries (See orderers for more info)  
fields (default: null): list of returned fields. If null, all fields are returned  
offset (default: 0): index of the first entry selected  
limit (default: -1): maximum number of selected entries. If -1, all entries are selected

+ Entry[] remove(string name, JSON filter) (Alias: trm)  
Find and remove entries from a table. Removed entries are returned.  
name: table name  
filter: select the entries

+ Entry[] update(string name, JSON filter), Entry modifs) (Alias: tset)  
Find and updates entries in a table. Updated entries are returned.  
name: table name
filter: select the entries
modifs: modifications applied to the selected entries. Litteral object of the form `{field:value, field: value, ..}`

+ void clear(string name) (Alias: tcl)  
Removes all entries in a table  
name: table name

### Filters

+ Field Filter : [$<field>, op1, args..s, op2, args..., ops...]  
Select entries that validates all the ops.  
Possible ops :  
=: value => test ===  
!=: value => test !===  
!: => test null  
!!: => test not null  
\>: value => test \>  
\>=: value => test \>=  
<: value => <  
<=: value => test <=  
len[: n => test length >= n (string only)  
len]: n => test length <= n (string only)  
len[]: l, h => test l <= length <= h (string only)  
reg: regex => regex.test() (char / string only)  
regf: regex, flags => regex.test() (char / string only)  

+ And filter : [and, filter1, filter2, ...]  
Select entries validated by each filter

+ Or filter: [or, filter, filter2, ...]  
Select entries validated by any filter

+ "*"  
Select all entries

### Orderers

An orderer is an array of string with the following pattern :  
[field1, +/-<type1>, field2, ...]

field is the field to compare.  
The prefix before the type can be a + to sort by ascending order, or a - to sort by descending order.  
The type is the type of comparaison on the field:  

+ val: compare by value using javascript operators
+ len: compare by length (string only)

## Methods

```javascript
var jdb = require("db-json");
var db = new jdb.Database(/*json content*/); //See database representation

var res = db.query(/*json query*/) //Executes the query and returns the result or throws an error
var res = db.queries(/*array of json queries*/) //Executes the queries and returns an array of results or throws an error
var res = db.squeries(...) //Same as before, but the database isn't edited at all if any error occurs.
```

## JSON representation


### Database representation

It's a litteral object with several properties :

+ name: Name of the database  
non-empty string  
required

+ version: Version of the database  
non-empty string (no versionning convention to respect)  
required

+ created: Timestamp of creation of the database in ms  
int  
default: current timestamp

+ updated: Timestamp of the last modification of the database in ms  
int  
default: current timestamp

+ tables: Tables in the database  
Array of json representation of tables  
default: []

### Table representation

+ name: Name of the table  
non-empty string  
required

+ created: Timestamp of creation of the table in ms  
int  
default: current timestamp

+ updated: Timestamp of the last modification of the table in ms  
int  
default: current timestamp

+ fields: Fields of the table  
Non empty array of json representation of fields  
Required

+ entries: All entries in the table  
Array of objects `{field: value, field: value, ...}`  
default: []

### Field representation

+ name: Name of the field  
Non-empty string (Two fields cannot have the same name)  
required

+ nullable: If the field can be null  
boolean  
default: false

+ unique: If two values cannot have the same value for this field  
boolean  
default: false

+ type: Type of the field  
string  
Possible types are: string, char, number, integer, boolean, id, or date (timestamp)  
required

+ generated: If the value is automatically generated when omitted  
boolean  
No test property can be used when generated is true (regex, minValue, ...)
default: false

+ default: The default field value  
same type as the field  
Cannot be used with generated and unique fields

+ regex: Regex to test if a value is valid  
string
available for types string, char, number and integer
optional

+ regexFlags: the flags of the regex  
string  
can only be used with regex  
optional

+ minValue: value of the field must be >= minValue  
same type as the field  
available for integer and number  
optional

+ maxValue: value of the field must be <= maxValue  
same type as the field  
available for integer and number  
optional

+ minLength: minimum length of the value  
int >= 0  
available for string  
optional

+ maxLength: maximum length of the value  
int >= 0  
available for string  
optional



