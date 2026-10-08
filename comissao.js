const fs   = require('node:fs');
const path = require('node:path');

const arquivoVendas = path.join(__dirname, 'vendas.json');
const dados = JSON.parse(fs.readFileSync(arquivoVendas, 'utf8'));

if (!Array.isArray(dados.vendas)) {
  console.error('O arquivo vendas.json precisa conter uma lista "vendas".');
  return false;
}

const vendedores = new Map();

for (const venda of dados.vendas) {
  const valor = Number(venda.valor);
  if (!venda.vendedor || !Number.isFinite(valor) || valor < 0) {
      console.error('Cada venda precisa ter vendedor e valor válido.');
      return false;
  }

  const valorCentavos    = Math.round(valor * 100);
  const taxa             = valorCentavos < 10000 ? 0 : valorCentavos < 50000 ? 0.01 : 0.05;
  const comissaoCentavos = Math.round(valorCentavos * taxa);
  
  const resumo = vendedores.get(venda.vendedor) ?? {
    quantidade    : 0,
    totalVendido  : 0,
    totalComissao : 0,
  };

  resumo.quantidade    += 1;
  resumo.totalVendido  += valorCentavos;
  resumo.totalComissao += comissaoCentavos;
  vendedores.set(venda.vendedor, resumo);
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

for (const [vendedor, resumo] of vendedores) {
  console.log(`${vendedor}: ${resumo.quantidade} vendas | vendido: ${moeda.format(resumo.totalVendido / 100)} | comiss?o: ${moeda.format(resumo.totalComissao / 100)}`);
}