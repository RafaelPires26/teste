/** 
 * @module dao/Transportadora
 * @description Possui os métodos responsaveis por criar, listar, atualizar e excluir grupos de transportadoras. Tabelas: G024, G014.
 * @author Rafael Barbaglia Lopes
 * @since 08.11.2021
 * @param {application} app - Configurações do app.
 * @return {JSON} Um array JSON.
*/
module.exports = function (app, cb) {
  var api        = {};
  api.controller = Controller;

  /**
   * @description Listar dados da tabela G024 e G014.
   * @async
   * @function api/listar
   * @param {Object} req Dados da requisição para a listagem
   * @param {Object} res Resposta gerada
   * @param {Object} next Caso haja erro na rota
   * @returns Um objeto com as informações a serem listadas
   * @throws Caso ocorra algum erro, o número do log de erro aparecerá no console.
   */
  api.listar = async function (req, res, next) {
    const user = utils.getUserLogged(req);
    const con = await api.controller.openDB({ con: null, user, tpcon: null });

    try {

      let acl1 = await acl.montar({
        ids001: req.UserId,
        dsmodulo: 'OFERECIMENTO',
        nmtabela: [{ G024: 'G024' }, { G014: 'G014' }],
        esoperad: ''
      });

      let userRelation = '';
  
      if (typeof acl1 == 'undefined') {
        acl1 = '';
      } else if (acl1 != '') {
        userRelation = ` join S001 S001x ON S001x.IDS001 = ${user} 
                         join S001 S001y ON S001y.IDS001 = NVL(S001x.IDS001RT, ${user} )`;
        acl1 = '  AND ( S001y.SNBRAVO = 1 OR (' + acl1 + ')) ';
      }

    if (req.body.method && req.body.method == 'GET') {
      var sqlWhere 	  = `WHERE G024.IDG024 = ${req.body.IDG024}`;
      var sqlOrder 	  = '';
      var sqlPaginate = '';
      var bindValues  = [];
    } else if (req.method == 'POST') {
      var [sqlWhere, sqlOrder, sqlPaginate, bindValues] = utils.retWherePagOrd(req.body, 'G024', true);
    }

      const sqlInn = (sqlWhere.includes('G014'))  ?
        `LEFT JOIN O009 ON O009.IDO009 = G024.IDG024 AND O009.SNDELETE = 0
          LEFT JOIN O008 ON O008.IDO008 = O009.IDO008
          LEFT JOIN G014 ON G014.IDG014 = O008.IDG014 ` : ``;

      const sql =` 
        SELECT
            G024.IDG024
          , G024.NMTRANSP
          , G024.NMABREVI
          , G024.RSTRANSP
          , CASE 
              WHEN G024.TPPESSOA = 'J' THEN 'Jurídica'
              WHEN G024.TPPESSOA = 'F' THEN 'Física'
              ELSE '' 
            END TPPESSOA
          , G024.CJTRANSP
          , G024.IETRANSP
          , G024.IMTRANSP
          , G024.NRLATITU
          , G024.NRLONGIT
          , G024.IDLOGOS
          , G024.PCPREFRE
          , CASE 
              WHEN G024.STCADAST = 'A' THEN 'Ativo'
              WHEN G024.STCADAST = 'I' THEN 'Inativo'
              ELSE '' 
            END STCADAST
          , G024.CPENDERE
          , G024.BIENDERE
          , G024.DSENDERE
          , G024.DSCOMEND
          , G024.NRENDERE
          , G024.SNROTEIR
          , G024.SNCALPRE
          , G003.IDG003
          , G003.NMCIDADE
          , G002.IDG002
          , G002.CDESTADO
          , G023.IDG023
          , G023.DSGRUTRA AS G023_DSGRUTRA
          , G023.DSGRUTRA
          , UPPER(G003.NMCIDADE) || '/' || G002.CDESTADO AS G003_NMCIDADE
          , COUNT(*) OVER() COUNT_LINHA

        FROM G024
          INNER JOIN G003 ON G003.IDG003 = G024.IDG003
          INNER JOIN G002 ON G002.IDG002 = G003.IDG002
          INNER JOIN G023 ON G023.IDG023 = G024.IDG023
          ${sqlInn}
          ${userRelation}
          ${sqlWhere}
      
        ${sqlWhere.includes('G014') ? acl1 : ''}

        GROUP BY
            G024.IDG024
          , G024.NMTRANSP
          , G024.NMABREVI
          , G024.RSTRANSP
          , G024.TPPESSOA
          , G024.CJTRANSP
          , G024.IETRANSP
          , G024.IMTRANSP
          , G024.NRLATITU
          , G024.NRLONGIT
          , G024.IDLOGOS
          , G024.PCPREFRE
          , G024.STCADAST
          , G024.CPENDERE
          , G024.BIENDERE
          , G024.DSENDERE
          , G024.DSCOMEND
          , G024.NRENDERE
          , G024.SNROTEIR
          , G024.SNCALPRE
          , G003.IDG003
          , G003.NMCIDADE
          , G002.IDG002
          , G002.CDESTADO
          , G023.IDG023
          , G023.DSGRUTRA

        ${sqlOrder}
        ${sqlPaginate}`;

      const result = await con.execute({ sql, param: bindValues }).then(result => utils.construirObjetoRetornoBD(result, req.body));

      await con.close();
      return result;

    } catch (err) { 
      if(con) await con.closeRollback(); 
      throw err; 
    }
  }

  /**
   * @description Lista porcentagem contratada da 3PL em cada Regra.
   * @async
   * @function api/listaPC
   * @param {Object} req Dados da requisição para a listagem
   * @param {Object} res Resposta gerada
   * @param {Object} next Caso haja erro na rota
   * @returns Um objeto com as informações a serem listadas
   * @throws Caso ocorra algum erro, o número do log de erro aparecerá no console.
   */
   api.listaPC = async function (req, res, next) {
    const user = utils.getUserLogged(req);
    const con = await api.controller.openDB({ con: null, user, tpcon: null });

    try {
      const [sqlWhere, bindValues] = utils.buildWhere({
        G024_IDG024: req.body.IDG024
      })
      
      const sql =
          `SELECT
                O008.IDO008,
                O008.DSREGRA,
                O009.PCATENDE
            FROM O008 -- REGRAS
            INNER JOIN O009 ON O009.IDO008 = O008.IDO008 -- REGRAS x 3PL
            INNER JOIN G024 ON G024.IDG024 = O009.IDG024 -- 3PL
            ${sqlWhere}
            AND O008.SNDELETE = 0
            AND O009.SNDELETE = 0
            AND O009.PCATENDE > 0
            ORDER BY O009.PCATENDE`;

      const result = await con.execute({ sql, param: bindValues })
      await con.close();
      return result;
    } catch (err) { 
      if(con) await con.closeRollback(); 
      throw err; 
    }
  }
  
  api.buscarTransportadora = async function (req, res, next) {

    const user = utils.getUserLogged(req);
    const con  = await api.controller.openDB({ con: null, user, tpcon: null });

    try {

      const sql = ` SELECT DISTINCT
                        G024.IDG024,
                        G024.NMTRANSP,
                        G024.CJTRANSP,
                        G024.IETRANSP,
                        G024.SNDELETE,
                        G024.SNCALPRE
                    FROM G024
                    WHERE G024.CJTRANSP = :CJTRANSP
                    AND   G024.IETRANSP = :IETRANSP `;

      const result = await con.execute({ sql, param: { CJTRANSP: req.body.CJTRANSP, IETRANSP: req.body.IETRANSP } }).then(result => result[0])

      await con.close();
      return result;

    } catch (err) {
      if(con) await con.closeRollback();
      throw err;

    }

  };

  /**
   * @description Salvar dados da tabela G023.
   * @async
   * @function api/salvar
   * @param {Object} req Dados da requisição para registrar
   * @param {Object} res Resposta gerada
   * @param {Object} next Caso haja erro na rota
   * @returns Um objeto com o resultado do registro
   * @throws Caso ocorra algum erro, o número do log de erro aparecerá no console
   */
  api.salvar = async function (req, res, next) {
    const user = utils.getUserLogged(req);
    const con = await api.controller.openDB({ con: null, user, tpcon: null });

    try {
      const colunas = {
          NMTRANSP: (req.body.NMTRANSP) ? req.body.NMTRANSP : null
        , RSTRANSP: (req.body.RSTRANSP) ? req.body.RSTRANSP : null
        , CJTRANSP: (req.body.CJTRANSP) ? req.body.CJTRANSP : null
        , IETRANSP: (req.body.IETRANSP) ? req.body.IETRANSP : null
        , IMTRANSP: (req.body.IMTRANSP) ? req.body.IMTRANSP : null
        , NRLATITU: (req.body.NRLATITU) ? req.body.NRLATITU : null
        , NRLONGIT: (req.body.NRLONGIT) ? req.body.NRLONGIT : null
        , IDLOGOS : (req.body.IDLOGOS ) ? req.body.IDLOGOS  : null
        , PCPREFRE: (req.body.PCPREFRE) ? req.body.PCPREFRE : null
        , CPENDERE: (req.body.CPENDERE) ? req.body.CPENDERE : null
        , BIENDERE: (req.body.BIENDERE) ? req.body.BIENDERE : null
        , DSENDERE: (req.body.DSENDERE) ? req.body.DSENDERE : null
        , NMABREVI: (req.body.NMABREVI) ? req.body.NMABREVI : null
        , DSCOMEND: (req.body.DSCOMEND) ? req.body.DSCOMEND : null
        , NRENDERE: (req.body.NRENDERE) ? req.body.NRENDERE : null
        , SNROTEIR: (req.body.SNROTEIR || req.body.SNROTEIR == 0) ? req.body.SNROTEIR : null
        , IDG003  : (req.body.IDG003  ) ? req.body.IDG003   : null
        , SNCALPRE: (req.body.SNCALPRE) ? req.body.SNCALPRE.id   : null
        , IDG023  :  req.body.IDG023
        , TPPESSOA:  req.body.TPPESSOA ? req.body.TPPESSOA : null
        , STCADAST:  req.body.STCADAST ? req.body.STCADAST : null
        , IDS001  :  req.body.IDS001
        , DTCADAST:  new Date()
        , SNDELETE:  0
      };

      const result = await con.insert({ tabela: 'G024', colunas, key: 'IDG024' });
      await con.close();
      return result;
    } catch (err) {
      if(con) await con.closeRollback(); 
      throw err; 
    }
  }

  /**
   * @description Atualizar dados da tabela G023, H016.
   * @asyncr
   * @function api/atualizar
   * @param {Object} req Dados da requisição para atualizar
   * @param {Object} res Resposta gerada
   * @param {Object} next Caso haja erro na rota
   * @returns Um objeto com o resultado da atualização
   * @throws Caso ocorra algum erro, o número do log de erro aparecerá no console
   */
  api.atualizar = async function (req, res, next) {
    const user = utils.getUserLogged(req);
    const con = await api.controller.openDB({ con: null, user, tpcon: null });

    try {
      const colunas = {
          NMTRANSP: (req.body.NMTRANSP) ? req.body.NMTRANSP      : null
        , NMABREVI: (req.body.NMABREVI) ? req.body.NMABREVI : null
        , STCADAST: (req.body.STCADAST) ? req.body.STCADAST : null
        , RSTRANSP: (req.body.RSTRANSP) ? req.body.RSTRANSP      : null
        , CJTRANSP: (req.body.CJTRANSP) ? req.body.CJTRANSP      : null
        , IETRANSP: (req.body.IETRANSP) ? req.body.IETRANSP      : null
        , IMTRANSP: (req.body.IMTRANSP) ? req.body.IMTRANSP      : null
        , NRLATITU: (req.body.NRLATITU) ? req.body.NRLATITU      : null
        , NRLONGIT: (req.body.NRLONGIT) ? req.body.NRLONGIT      : null
        , IDLOGOS : (req.body.IDLOGOS ) ? req.body.IDLOGOS       : null
        , PCPREFRE: (req.body.PCPREFRE) ? req.body.PCPREFRE      : null
        , CPENDERE: (req.body.CPENDERE) ? req.body.CPENDERE      : null
        , BIENDERE: (req.body.BIENDERE) ? req.body.BIENDERE      : null
        , DSENDERE: (req.body.DSENDERE) ? req.body.DSENDERE      : null
        , DSCOMEND: (req.body.DSCOMEND) ? req.body.DSCOMEND      : null
        , NRENDERE: (req.body.NRENDERE) ? req.body.NRENDERE      : null
        , SNROTEIR: (req.body.SNROTEIR || req.body.SNROTEIR == 0) ? req.body.SNROTEIR : null
        , IDG023  : (req.body.IDG023  ) ? req.body.IDG023        : null
        , IDG003  : (req.body.IDG003  ) ? req.body.IDG003        : null
        , SNCALPRE: (req.body.SNCALPRE) ? req.body.SNCALPRE.id   : null
        , SNDELETE: 0
      };

      const condicoes = `IDG024 = :IDG024`;
      const result = await con.update({ tabela: 'G024', colunas, condicoes, param: { IDG024 : req.body.IDG024 } });
      await con.close();
      return result;
    } catch (err) { 
      if(con) await con.closeRollback(); 
      throw err; }
  }

  /**
   * @description Excluir dados da tabela G024.
   * @async
   * @function api/excluir
   * @param {Object} req Dados da requisição para excluir
   * @param {Object} res Resposta gerada
   * @param {Object} next Caso haja erro na rota
   * @returns Um objeto com o resultado da exclusão
   * @throws Caso ocorra algum erro, o número do log de erro aparecerá no console
   */
  api.excluir = async function (req, res, next) {
    const user = utils.getUserLogged(req);
    const con = await api.controller.openDB({ con: null, user, tpcon: null });

    try {
      const [sqlWhere, bindValues] = utils.getBindValuesIn(((Array.isArray(req.body.IDG024)) ? req.body.IDG024 : [ req.body.IDG024 ]), 'IDG024');

      const colunas   = { SNDELETE: 1 };
      const condicoes = `IDG024 IN (${sqlWhere})`;

      const result = await con.update({ tabela: 'G024', colunas, condicoes, param: bindValues });
      await con.close();
      return result;
    } catch (err) { 
      if(con) await con.closeRollback(); 
      throw err; 
    }
  }

  return api;
}