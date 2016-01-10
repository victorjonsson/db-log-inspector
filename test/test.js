'use strict';

const
    normalizer = require('../lib/log/query-normalizer'),
    someSqlGibberish = 'UPDATE Shippers.ShipperName \nCOUNT(Orders.OrderID) AS \t\n\n'+
        "NumberOfOrders FROM Orders (SELECT gargamel FROM smurfarna WHERE a=     `sddsd`)"+
        ' AS groda FROM\nLEFT JOIN Shippers ON Orders.ShipperID=Shippers.ShipperID WHERE'+
        ' apa IN (32, "323", 12) AND testing IN (SELECT A FROM table) '+
        ' GROUP BY ShipperName ORDER BY sdkfp DESC LIMIT 0,20 LIMIT 10',
    someOtherSqlGibberish = 'UPDATE column \t\n\n'+
        "NumberOfOrders FROM Orders (SELECT gargamel FROM smurfarna WHERE a=     2323)"+
        ' AS groda FROM\nLEFT JOIN Shippers ON Orders.ShipperID=\`val\` WHERE'+
        ' apa IN (col.name) AND testing IN (SELECT A FROM table AS apa) '+
        ' GROUP BY ShipperName  LIMIT 10,1';

module.exports = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    /* */

    testNormalizedQueryCreation: function (test) {
        const
            expectedSql = 'UPDATE ? FROM Orders (SELECT ? FROM smurfarna WHERE a=?)' +
                ' FROM LEFT JOIN Shippers ON Orders.ShipperID=? WHERE apa IN ? ' +
                'AND testing IN (SELECT ? FROM table) GROUP BY ShipperName',
            normalizedA = normalizer.normalize(someSqlGibberish),
            normalizedB = normalizer.normalize(someOtherSqlGibberish);


        test.equals(
            expectedSql,
            normalizedA.sql,
            `Normalized sql not correct`
        );
        test.equals(
            normalizedB.sql,
            normalizedA.sql,
            `The two different sql statement does not generate the same normalized sql`
        );

        test.equals(true, normalizedA.hash ? true:false);
        test.equals(normalizedB.hash, normalizedA.hash);
        test.done();
    },

    testRemovingValues: function(test) {
        let strings = "arg=`groda1` AND arg2 = `gro\\`da2` AND arg3 != db.col AND arg4 ! = 89438",
            expected = "arg=? AND arg2 =? AND arg3 !=? AND arg4 !=?";

        test.equals(expected, normalizer.commands.removeValues(strings));

        strings = "arg>`groda1` AND arg2 < `gro\\`da2` AND arg3 <> db.col";
        expected = "arg=? AND arg2=? AND arg3=?";

        test.equals(expected, normalizer.commands.removeValues(strings));
        test.done();
    },

    testRemovingValuesWithAsStatement: function(test) {
        let str = 'WHERE col IN (SELECT gargamel FROM smurfarna WHERE a=     `sddsd`) AS kmsdk',
            expected = 'WHERE col IN (SELECT gargamel FROM smurfarna WHERE a=?) AS kmsdk';

  //      test.equals(expected, normalizer.commands.removeValues(str));

        str = 'WHERE col IN (SELECT gargamel FROM smurfarna WHERE a=     4394) AS kmsdk';
        expected = 'WHERE col IN (SELECT gargamel FROM smurfarna WHERE a=?) AS kmsdk';
        test.equals(expected, normalizer.commands.removeValues(str));

        test.done();
    }
};