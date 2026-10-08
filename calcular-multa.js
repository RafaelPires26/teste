const valor          = Number(process.argv[2]?.replace(',', '.'));
const dataVencimento = process.argv[3];

const [ano, mes, dia] = dataVencimento.split('-').map(Number);
const vencimento = new Date(Date.UTC(ano, mes - 1, dia));
if (vencimento.getUTCFullYear() !== ano || vencimento.getUTCMonth() !== mes - 1 || vencimento.getUTCDate() !== dia) {
  console.error('Data inválida. Informe uma data existente no formato AAAA-MM-DD.');
  return false;
}

const hoje       = new Date();
const hojeUtc    = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
const diasAtraso = Math.max(0, Math.floor((hojeUtc - vencimento.getTime()) / 86400000));
const multa = Math.round(valor * 100 * 0.025 * diasAtraso) / 100;
const total = Math.round((valor + multa) * 100) / 100;
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

console.log(`Dias de atraso: ${diasAtraso}`);
console.log(`Multa (2,5% ao dia, cálculo simples): ${moeda.format(multa)}`);
console.log(`Valor total: ${moeda.format(total)}`);