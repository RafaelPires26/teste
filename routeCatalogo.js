module.exports = function (app) {

  const token         = app.src.modIntegrador.controllers.UsuarioController.tokenRoutes;

  //=-=-=-=-=-=-=-=-=-=-=-=-=-=-CATALOGO-=-=-=-=-=-=-=-=-==-=-=-=-=\\

  const catalogo = CatalogoController;

  app.post('/api/test/catalogo/listar'   , token, catalogo.listar   );
  app.post('/api/test/catalogo/buscar'   , token, catalogo.buscar   );
  app.post('/api/test/catalogo/salvar'   , token, catalogo.salvar   );
  app.post('/api/test/catalogo/atualizar', token, catalogo.atualizar);
  app.post('/api/test/catalogo/excluir'  , token, catalogo.excluir  );

  //=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\\

};