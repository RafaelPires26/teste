/**
 * @module controllers/Catalogo
 * @description Possui métodos responsáveis para criar, atualizar, listar e deletar um registro. 
 * @author Rafael Andrade Pires
 * @since 09.05.2024
 * @param {application} app - Configurações do app.
 * @return {JSON} Um array JSON.
 */
module.exports = function (app, cb) {
  const api   = {};
  const dao = CatalogoDAO;

  /**
   * @description Lista dados
   * @async
   * @function api/listar
   * @param {Object} req Dados da requisição
   * @param {Object} res Resposta gerada
   * @param {Object} next Caso haja erro na rota
   * @returns JSON com informações listadas
   */
  api.listar = async function (req, res, next) {
    await dao.listar(req, res, next)
      .then(result => res.json(result))
      .catch(err => next(err));
  }

  /**
   * @description Salva dados
   * @async
   * @function api/salvar
   * @param {Object} req Dados da requisição para registro
   * @param {Object} res Resposta gerada
   * @param {Object} next Caso haja erro na rota
   * @returns JSON com confirmação de sucesso na inserção dos dados
   */
  api.salvar = async function (req, res, next) {

    try {
      let blOk = true;
      let msg  = '';
    
      let transpExistente = await dao.buscarTransportadora(req, res, next);

      if(transpExistente != null) {
        
        if(transpExistente.SNDELETE == 1) {
          msg = 'Transportadora já cadastrada e desativada. Deseja atualizar os dados existentes e ativá-la?';
        } else {
          msg = 'Transportadora já cadastrada. Deseja atualizar os dados já existentes?';
        }
        
        transpExistente.msg = msg;
        blOk = false;
        
      } else {
        let IDG024 = await dao.salvar(req, res, next);
        blOk = !!IDG024;
        msg = blOk ? 'Cadastro de Transportadora realizado com sucesso!' : 'Erro ao cadastrar Transportadora. Por favor, tente novamente!';
      }
  
      res.status(blOk ? 200 : 400).send((blOk) ? { response: msg } : { error: msg, transpExistente }) 
    }
    catch(error) {
      res.status(500).send({ strErro: error.message });
      throw error;
    }

  };

  /**
   * @description Atualizar dados 
   * @async
   * @function api/atualizar
   * @param {Object} req Dados da requisição para atualização
   * @param {Object} res Resposta gerada
   * @param {Object} next Caso haja erro na rota
   * @returns JSON com informações sobre a atualização dos registros
   */
  api.atualizar = async function (req, res, next) {
    await dao.atualizar(req, res, next)
      .then(result => res.json(result))
      .catch(err => next(err));
  };

  /**
   * @description Exclui dados
   * @async
   * @function api/excluir
   * @param {Object} req Dados da requisição para exclusão
   * @param {Object} res Resposta gerada
   * @param {Object} next Caso haja erro na rota
   * @returns JSON com informações sobre a exclusão dos registros
   */
  api.excluir = async function (req, res, next) {
    await dao.excluir(req, res, next)
      .then(result => res.json(result))
      .catch(err => next(err));
  };

  return api;
}