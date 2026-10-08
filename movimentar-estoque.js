const fs       = require('node:fs');
const path     = require('node:path');
const readline = require('node:readline/promises');

const arquivoEstoque       = path.join(__dirname, 'estoque.json');
const arquivoMovimentacoes = path.join(__dirname, 'movimentacoes.json');
const dadosEstoque         = JSON.parse(fs.readFileSync(arquivoEstoque, 'utf8'));
const dadosMovimentacoes   = fs.existsSync(arquivoMovimentacoes) ? JSON.parse(fs.readFileSync(arquivoMovimentacoes, 'utf8')) : { movimentacoes: [] };

if (!Array.isArray(dadosEstoque.estoque) || !Array.isArray(dadosMovimentacoes.movimentacoes)) {
  console.error('Verifique as listas "estoque" e "movimentacoes" nos arquivos JSON.');
  return false;
}

const rl            = readline.createInterface({ input: process.stdin, output: process.stdout });
const produtos      = dadosEstoque.estoque;
const movimentacoes = dadosMovimentacoes.movimentacoes;
let proximoId       = movimentacoes.reduce((maiorId, item) => Math.max(maiorId, item.id), 0) + 1;

async function perguntarNumero(mensagem, validar) {
  while (true) {
    const valor = Number((await rl.question(mensagem)).trim());
    if (Number.isFinite(valor) && validar(valor)) return valor;
    console.log('Valor inválido. Tente novamente.');
  }
}

async function executar() {
  console.log('Produtos disponíveis:');
  for (const produto of produtos) {
    console.log(`${produto.codigoProduto} - ${produto.descricaoProduto} (estoque: ${produto.estoque})`);
  }

  while (true) {
    const codigo = await perguntarNumero('\nCódigo do produto (0 para sair): ', Number.isInteger);
    if (codigo === 0) break;

    const produto = produtos.find((item) => item.codigoProduto === codigo);
    if (!produto) {
      console.log('Produto n?o encontrado.');
      continue;
    }

    const tipoDigitado = (await rl.question('Tipo (entrada/saida): ')).trim().toLowerCase();
    const tipo = tipoDigitado === 'entrada' ? 'entrada' : tipoDigitado === 'saida' || tipoDigitado === 'saída' ? 'saida' : null;
    if (!tipo) {
      console.log('Tipo inválido. Informe entrada ou saida.');
      continue;
    }

    const quantidade = await perguntarNumero('Quantidade: ', (valor) => Number.isInteger(valor) && valor > 0);
    const descricao = (await rl.question('Descriç?o da movimentaç?o: ')).trim();
    if (!descricao) {
      console.log('A descriç?o é obrigatória; movimentaç?o n?o registrada.');
      continue;
    }

    if (tipo === 'saida' && quantidade > produto.estoque) {
      console.log(`Estoque insuficiente. Disponível: ${produto.estoque}.`);
      continue;
    }

    produto.estoque += tipo === 'entrada' ? quantidade : -quantidade;
    movimentacoes.push({
      id: proximoId++,
      codigoProduto: produto.codigoProduto,
      descricaoProduto: produto.descricaoProduto,
      tipo,
      descricao,
      quantidade,
      data: new Date().toISOString(),
    });

    fs.writeFileSync(arquivoEstoque, `${JSON.stringify(dadosEstoque, null, 2)}\n`);
    fs.writeFileSync(arquivoMovimentacoes, `${JSON.stringify({ movimentacoes }, null, 2)}\n`);
    console.log(`Movimentaç?o registrada. ID: ${proximoId - 1}. Estoque final de ${produto.descricaoProduto}: ${produto.estoque}.`);
  }
}

executar()
  .catch((erro) => {
    console.error(`Erro: ${erro.message}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());