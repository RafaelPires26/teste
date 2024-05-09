const oracledb4            = require('oracledb');
      oracledb4.maxRows    = 50000;
      oracledb4.autoCommit = false;
const log = require(process.cwd() + '/config/logger.js');

module.exports = class BD {

  constructor(connection) {

    this.connection = [];
    this.nivel      = 0;
    this.tpcon      = null;

    if (connection != null && connection != undefined) {
      this.connection = connection;
    }

  }

  async addNivel() {

    try {

      this.nivel = this.nivel + 1;
      log.debug("addNivel: " + this.nivel);

    } catch (error) {
      log.debug('Error addNivel');
    }

  }

  async setTpCon(tpcon) {

    try {

      this.tpcon = (tpcon) ? tpcon : null;
      log.debug("setTpCon: " + this.tpcon);

    } catch (error) {
      log.debug('Error setTpCon');
    }

  }

  async getConnection() {

    try {

      let objAutenticacao = {
          user         : process.env.DB_USERNAME
        , password     : process.env.DB_PASSWORD
        , connectString: process.env.DB_HOST + '/' + process.env.DB_DATABASE
        , poolTimeout  : 60
      }
      
      if (this.connection[0] == undefined || this.connection[0] == null) {
        this.connection[0] = await oracledb4.getConnection(objAutenticacao)
          .then(con => {
            log.debug("Conexão criada com sucesso!");
            return con;
          })
          .catch((err) => {
            log.debug("Erro ao criar conexão " + err.message);
            err.stack = new Error().stack;
            throw err;
          });
      }

      return this.connection;

    } catch (error) {
      log.debug('Error getConnection');
    }

  }

  async close() {

    try {

      if (this.nivel > 0) {

        let length = this.nivel;

        for (let i = 0; i < length; i++) {
          this.nivel = this.nivel - 1;
          log.debug('Abaixando o nível!');
        }

      }

      if (this.nivel == 0 && (this.connection[0] != undefined || this.connection[0] != null)) {

        log.debug('Init Close connection !');

        await this.connection[0].commit();
        await this.connection[0].close();

        this.connection[0] = null;

        log.debug('Connection Closed !');

      }

    } catch (error) {
      log.debug('Error close');
    }

  }

  async closeRollback() {

    try {

      if (this.connection[0] != undefined) {

        log.debug('Init Close Rollback!');

        await this.connection[0].rollback();
        await this.connection[0].close();

        this.connection[0] = undefined;
        this.connection[0] = undefined;

        log.debug('Fim Close Rollback!');
      }

    } catch (error) {
      log.debug('Error close');
    }

  }

  async execute(obParam) {

    try {

      await this.getConnection();

      obParam.properties = {
          outFormat : oracledb4.OBJECT
        , autoCommit: false
      };

      if (obParam.fetchInfo != null && obParam.fetchInfo != undefined) {

        obParam.properties.fetchInfo = {};

        if (typeof obParam.fetchInfo === 'object' && obParam.fetchInfo.type === "BLOB") {

          obParam.properties.fetchInfo[obParam.fetchInfo.column] = { type: oracledb4.BUFFER };

        } else {

          if (typeof obParam.fetchInfo === 'array' || typeof obParam.fetchInfo === 'object') {

            for (let item of obParam.fetchInfo) {

              if (typeof item === 'object' && item.type === "BLOB") {

                obParam.properties.fetchInfo[item.column] = { type: oracledb4.BUFFER };

              } else if (typeof item === 'object' && item.type === "SP") {

                obParam.param = Object.assign(obParam.param, { cursor: { type: oracledb4.CURSOR, dir: oracledb4.BIND_OUT } });;
                obParam.sql = obParam.sql.trim().replace(');', ',:cursor);').replace('(,', '(');
                obParam.type = 'SP';

              } else {

                obParam.properties.fetchInfo[item] = { type: oracledb4.STRING };

              }

            }

          } else {

            obParam.properties.fetchInfo[obParam.fetchInfo] = { type: oracledb4.STRING };

          }

        }

      }

      log.debug('Ini Execute!');

      if (obParam.debug) {

        let sql = obParam.sql;

        for (let param in obParam.param) {

          sql = sql.replace(new RegExp(':' + param, 'g'), "'" + obParam.param[param] + "'");

        }

        log.debug(sql);

      }

      return await this.connection[0].execute( obParam.sql, obParam.param, obParam.properties )
        .then(async (result) => {

          log.debug('Fim Execute!');

          if (obParam.type == 'INSERT_KEY') {

            return result.outBinds.idbv[0];

          } if (obParam.type == 'INSERT') {

            return undefined;

          } if (obParam.type == 'UPDATE') {

            return result.rowsAffected;

          } if (obParam.type == 'DELETE') {

            return result.rowsAffected;

          } if (obParam.type == 'SP') {

            let resultSet = result.outBinds.cursor;
            let rows = await resultSet.getRows(oracledb4.maxRows);
            return rows;

          } else {

            return result.rows;

          }
        })
        .catch(async (err) => {

          await this.closeRollback();
          log.debug('Fim Execute Error!');
          err.stack = new Error().stack;
          err.txsql = obParam.sql;

          if (obParam.param.isArray) {

            err.dsparame = obParam.param.join();

          } else if (typeof obParam.param === 'object') {

            err.dsparame = JSON.stringify(obParam.param).substr(0, 1000);

          } else {

            err.dsparame = '';

          }

          throw err;

        });

    } catch (err) {
      log.debug('Error Execute');
      throw err;
    }

  };

  async insert(obParam) {

    let arColunas     = [];
    let arColunasBind = [];
    let arValores     = {};
    let strSql        = "";

    for (let key in obParam.colunas) {
      arColunas.push(key);
      arColunasBind.push(':' + key);
      arValores[key] = (obParam.colunas[key]);
    }

    if (obParam.key != undefined) {

      arValores.idbv = { type: oracledb4.NUMBER, dir: oracledb4.BIND_OUT };

      strSql = `Insert Into ` + obParam.tabela + `(` + arColunas.join() + `) Values (` + arColunasBind.join() + `) /*v10*/
      RETURNING `+ obParam.key + ` INTO :idbv`;

    } else {

      strSql = `Insert Into ` + obParam.tabela + `(` + arColunas.join() + `) Values (` + arColunasBind.join() + `) /*v10*/`;

    }

    return await this.execute({
        sql  : strSql
      , param: arValores
      , type : (obParam.key != undefined ? 'INSERT_KEY' : 'INSERT')
    });
  };

  async update(obParam) {

    let arColunas     = [];
    let arColunasBind = [];
    let arValores     = [];
    let strSql = "";

    let missingParam = (!obParam.param || obParam.param.length == 0 || Object.keys(obParam.param).length == 0);
    let isLocalEnv   = (process.env.TOKEN == 0 && (process.env.APP_ENV == 'QAS' || process.env.APP_ENV == 'DEV'));

    if(missingParam && isLocalEnv) {
      log.info('Erro ao executar SQL. Obrigatório passar a propriedade "param"!');
      throw 'Erro ao executar SQL. Obrigatório passar a propriedade "param"!';
    }

    for (let key in obParam.colunas) {
      arColunas.push(key);
      arColunasBind.push(key + ' = :' + key);
      arValores.push(obParam.colunas[key]);
    }

    for (let key in obParam.param) {
      arValores.push(obParam.param[key]);
    }

    strSql = `/*v10*/ Update ` + obParam.tabela + ` Set ` + arColunasBind.join() + ` Where ` + obParam.condicoes;

    return await this.execute({
        sql  : strSql
      , param: arValores
      , type : 'UPDATE'
    });
  };

  async delete(obParam) {

    let arValores     = [];
    let strSql        = "";
    
    let missingParam = (!obParam.param || obParam.param.length == 0 || Object.keys(obParam.param).length == 0);
    let isLocalEnv   = (process.env.TOKEN == 0 && (process.env.APP_ENV == 'QAS' || process.env.APP_ENV == 'DEV'));

    if(missingParam && isLocalEnv) {
      log.info('Erro ao executar SQL. Obrigatório passar a propriedade "param"!');
      throw 'Erro ao executar SQL. Obrigatório passar a propriedade "param"!';
    }

    for (let key in obParam.param) {
      arValores.push(obParam.param[key]);
    }

    strSql = `/*v10*/ Delete From ` + obParam.tabela + ` Where ` + obParam.condicoes;

    return await this.execute({
        sql: strSql
      , param: arValores
      , type: 'DELETE'
    });

  };

};