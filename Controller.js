

module.exports = function (app) {
  const   api = {};
  const BD  = require('Database.js');

  api.openDB = async function (obj) {

    try {

      let { con, user, tpcon } = obj;

      if (con == null || con == undefined) {
        con = new BD();
        await con.setTpCon(tpcon);
      }

      if (user != null && user != undefined) {
        await con.execute(
          {
            sql: `Insert Into TEMP Values ( :IDS001 ) /*v10*/`,
            param: { IDS001: user },
            tpcon: tpcon
          });
      }

      return con;

    } catch (error) {
      log.debug('Error openDB');
    }

  }

  return api;

}