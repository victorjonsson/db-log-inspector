# db-log-inspector :mag:
Command line tool used to analyze MySql log files (including Percona and MariaDB)

## Install

1. Install node (version >= 4.1.1)
  - **Windows or Mac:** [download from nodejs.org](https://nodejs.org/en/download/)
  - **Mac (homebrew)**: `$ brew update ; brew install node ; brew link --override node`. Call `upgrade` instead of `install` if you already have an older verison of node installed.
  - **Linux:** [apt-get](https://github.com/nodejs/node-v0.x-archive/wiki/Installing-Node.js-via-package-manager#debian-and-ubuntu-based-linux-distributions)

2. Install loginspect via npm
  - `$ npm install -g loginspect`

## Usage

You can inspect any sql log file that has entries formatted the following way:

```
# Query_time: %SECONDS%  Lock_time: %NUMBER% Rows_sent: %NUMBER%  Rows_examined: %NUMBER%
use %TABLE%;
SET timestamp=%NUMBER%;
%SQL_STATEMENT%;
``` 

*In a future version you will be able to define your own log format.*

#### Report summary

Get a report containing the following:
- Start and end date of the report
- The total amount of slow queries and average slow queries per day
- Top list with the ten slowest queries found (add `-c 50` to get the 50 slowest queries)
- Top list with most frequent [normalized queries](#inspecting-normalized-queries) and their average execution time

```
$ loginspect -l /var/log/mysql/slow.log

From:           Fri 09, Sep 2011
To:             Tue 05, Jan 2016
Entries:        140789  (2 unknown entries)
Average:        89.1 entries per day
Execution time: 17 seconds

 SLOWEST QUERIES:
┌────┬──────────────────┬────────────────────────────────────────────────────┬──────────┐
│ #  │ Date             │ SQL                                                │ Time     │
├────┼──────────────────┼────────────────────────────────────────────────────┼──────────┤
│ 1  │ Tue 03, Dec 2013 │ SELECT * FROM applies WHERE name LIKE `%antwerp%`  │ 16 hours │
├────┼──────────────────┼────────────────────────────────────────────────────┼──────────┤
│ 2  │ Wed 18, Sep 2013 │ select cs.id, cu.id AS customerId, cu              │ 12 hours │
│    │                  │ .companyName, cu.ssn, c.ssn cus                    │          │
│    │                  │ tomerSsn, s.service, cu.balance, cs.service        │          │
│    │                  │ ... (run -q 2 to view entire SQL statement)        │          │
├────┼──────────────────┼────────────────────────────────────────────────────┼──────────┤
│ 3  │ Mon 05, May 2014 │ select cs.id, cu.id AS customerId, cu              │ 6 hours  │
│    │                  │ eId, se.name as serviceName, comp.name as companyN │          │
│    │                  │ ame, comp.orgNr as orgNr,cu.name as sellerName,    │          │
│    │                  │ ... (run -q 3 to view entire SQL statement)        │          │
├────┼──────────────────┼────────────────────────────────────────────────────┼──────────┤


 NORMALIZED QUERIES:
┌──────────────────────────────────┬────────────┬──────────────┐
│ ID                               │ Executions │ Average time │
├──────────────────────────────────┼────────────┼──────────────┤
│ 45f60cd9e6f35ccf6a3f61b96b5d99eb │ 15082      │ 2 minutes    │
├──────────────────────────────────┼────────────┼──────────────┤
│ d542e82e23f71354ff542ab27676b766 │ 9262       │ 3 minutes    │
├──────────────────────────────────┼────────────┼──────────────┤
│ 3ae4bb208afa5627c303dd9f7b6e6257 │ 8627       │ 2 minutes    │
├──────────────────────────────────┼────────────┼──────────────┤
│ 4fdb7c80840f59eac83c2ca31d8d0a62 │ 8626       │ 1 minute     │
├──────────────────────────────────┼────────────┼──────────────┤
...
Showing 30 of 2053 normalized queries (use "-n [ID]" to inspect a specific normalized query)
```

#### Report summary for a specified date

```bash
# Get a report summary of all slow queries since first jan 2016
$ loginspect -l /var/log/mysql/slow.log -f 2016-01-01

# Get a report summary of all slow queries during 2015
$ loginspect -l /var/log/mysql/slow.log -f 2015-01-01 -t 2015-12-31
```

#### Export data

By adding the argument `-v json` the console program will output the result as valid json.

#### Get a larger top list of slow queries

You can increase the size of the top list of slow queries by using the argument `-c [NUMBER]` 

#### Inspecting normalized queries

The normalization of queries turns a statement like this `SELECT col FROM table WHERE x=1 AND y=0` into this
`SELECT ? FROM table WHERE x=? AND y=?`. This can be really useful when trying to find which type of statements
causing you most trouble.

When generating a report you will get a list of the most frequent normalized queries.

```
$ loginspect -f 2015-12-00 -t 2015-12-31
...

NORMALIZED QUERIES:
| ID                                | Executions    | Avg time  |
| --------------------------------- |:-------------:| ---------:|
| 4dd91307399ff040a579b83cb9cdd798  |  921          | 2 minutes |
| m3l91307399ff040am31283cb9cdlmq1  |  701          | 22 sec    |
| l32oe307399ff040ame2l83cb9cd4mp0  |  645          | 1 minute  |
...
```

To view the details of a normalized query, such as the normalized sql and an example statement, you use the flag `-n`.

```
$ loginspect -f 2015-12-00 -t 2015-12-31 -n m3l91307399ff040am31283cb9cdlmq1
Average time: 22 seconds
Executions: 645

NORMALIZED QUERY:
SELECT ? FROM table WHERE x IN (SELECT ? FROM other_table WHERE y=?)

EXAMPLE:
SELECT x, id, name FROM table WHERE name IN (SELECT name FROM other_table WHERE y=321)
```

## Troubleshooting 

The report summary will give you information about how many log entries that couldn't become parsed. Add the flag `-u` to get hold of the raw data of these log entries.



