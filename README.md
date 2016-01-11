# db-log-inspector
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
# Query_time: %NUMBER%  Lock_time: %NUMBER% Rows_sent: %NUMBER%  Rows_examined: %NUMBER%
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

#### Report summary for a specified date

Lorem...

#### Export data

Lorem...

#### Get a larger top list of slow queries

Lorem te ipsum...

#### Inspecting normalized queries

Lorem te ipsum...

## Troubleshooting 

Lorem te ipsum



