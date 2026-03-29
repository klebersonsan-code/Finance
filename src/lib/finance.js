export const categoryMap = {
  receita: [
    { value: 'salario', label: 'Salario', icon: '\u{1F4BC}' },
    { value: 'freelance', label: 'Freelance', icon: '\u{1F9D1}\u200D\u{1F4BB}' },
    { value: 'investimentos', label: 'Investimentos', icon: '\u{1F4C8}' },
    { value: 'resgate_investimento', label: 'Resgate de investimento', icon: '\u{1F4B8}' },
    { value: 'vendas', label: 'Vendas', icon: '\u{1F6CD}\uFE0F' },
    { value: 'comercial', label: 'Comercial', icon: '\u{1F91D}' },
    { value: 'prestacao_servicos', label: 'Prestacao de servicos', icon: '\u{1F9D1}\u200D\u{1F527}' },
    { value: 'consultoria', label: 'Consultoria', icon: '\u{1F4CB}' },
    { value: 'servico_prestado', label: 'Servico prestado', icon: '\u{1F6E0}\uFE0F' },
    { value: 'recebimento_cliente', label: 'Recebimento de cliente', icon: '\u{1F4E5}' },
    { value: 'comissao_vendas', label: 'Comissao de vendas', icon: '\u{1F4B0}' },
    { value: 'bonus', label: 'Bonus', icon: '\u{1F381}' },
    { value: 'comissoes', label: 'Comissoes', icon: '\u{1F4B0}' },
    { value: 'hora_extra', label: 'Hora extra', icon: '\u23F1\uFE0F' },
    { value: 'decimo_terceiro', label: 'Decimo terceiro', icon: '\u{1F4C5}' },
    { value: 'participacao_lucros', label: 'Participacao nos lucros', icon: '\u{1F4B9}' },
    { value: 'aposentadoria', label: 'Aposentadoria', icon: '\u{1F468}\u200D\u{1F9B3}' },
    { value: 'pensao', label: 'Pensao', icon: '\u{1F91D}' },
    { value: 'renda_extra', label: 'Renda extra', icon: '\u{2728}' },
    { value: 'juros', label: 'Juros', icon: '\u{1F4B5}' },
    { value: 'dividendos', label: 'Dividendos', icon: '\u{1F4B8}' },
    { value: 'renda_fixa', label: 'Renda fixa', icon: '\u{1F4C9}' },
    { value: 'renda_variavel', label: 'Renda variavel', icon: '\u{1F4C8}' },
    { value: 'juros_aplicacoes', label: 'Juros de aplicacoes', icon: '\u{1F4B5}' },
    { value: 'aluguem_temporada', label: 'Locacao por temporada', icon: '\u{1F3D6}\uFE0F' },
    { value: 'pro_labore', label: 'Pro labore', icon: '\u{1F9D1}\u200D\u{1F4BC}' },
    { value: 'royalties', label: 'Royalties', icon: '\u{1F3BC}' },
    { value: 'aluguel', label: 'Aluguel recebido', icon: '\u{1F3E1}' },
    { value: 'cashback', label: 'Cashback', icon: '\u{1F4B3}' },
    { value: 'restituicao', label: 'Restituicao', icon: '\u{1F9FE}' },
    { value: 'auxilio', label: 'Auxilio', icon: '\u{1FAF6}' },
    { value: 'bolsa', label: 'Bolsa', icon: '\u{1F393}' },
    { value: 'bolsa_estagio', label: 'Bolsa estagio', icon: '\u{1F4DA}' },
    { value: 'licenca', label: 'Licenca ou direitos', icon: '\u{1F4DC}' },
    { value: 'vale_refeicao', label: 'Vale refeicao', icon: '\u{1F37D}\uFE0F' },
    { value: 'vale_transporte', label: 'Vale transporte', icon: '\u{1F68C}' },
    { value: 'beneficio', label: 'Beneficio', icon: '\u{1F4E6}' },
    { value: 'mesada', label: 'Mesada', icon: '\u{1FA99}' },
    { value: 'premio', label: 'Premio', icon: '\u{1F947}' },
    { value: 'bicos', label: 'Bicos', icon: '\u{1F528}' },
    { value: 'plataformas_digitais', label: 'Plataformas digitais', icon: '\u{1F4F1}' },
    { value: 'reembolso_saude', label: 'Reembolso de saude', icon: '\u{1FA79}' },
    { value: 'heranca', label: 'Heranca', icon: '\u{1F4DC}' },
    { value: 'venda_online', label: 'Venda online', icon: '\u{1F6D2}' },
    { value: 'venda_produtos', label: 'Venda de produtos', icon: '\u{1F6CD}\uFE0F' },
    { value: 'venda_usados', label: 'Venda de usados', icon: '\u{1F4E6}' },
    { value: 'reembolso', label: 'Reembolso', icon: '\u{1F4B8}' },
    { value: 'estorno', label: 'Estorno', icon: '\u{21A9}\uFE0F' },
    { value: 'transferencia_recebida', label: 'Transferencia recebida', icon: '\u{1F4E5}' },
    { value: 'pix_recebido', label: 'Pix recebido', icon: '\u{1F4F2}' },
    { value: 'ajuda_familiar', label: 'Ajuda familiar', icon: '\u{1F46A}' },
    { value: 'presente', label: 'Presente', icon: '\u{1F381}' },
    { value: 'outros', label: 'Outros', icon: '\u{1F4DD}' },
  ],
  despesa: [
    { value: 'moradia', label: 'Moradia', icon: '\u{1F3E0}' },
    { value: 'alimentacao', label: 'Alimentacao', icon: '\u{1F354}' },
    { value: 'transporte', label: 'Transporte', icon: '\u{1F697}' },
    { value: 'lazer', label: 'Lazer', icon: '\u{1F3AC}' },
    { value: 'saude', label: 'Saude', icon: '\u{1F48A}' },
    { value: 'plano_saude', label: 'Plano de saude', icon: '\u{1F3E5}' },
    { value: 'odontologia', label: 'Odontologia', icon: '\u{1F9B7}' },
    { value: 'contas', label: 'Contas', icon: '\u{1F4A1}' },
    { value: 'agua', label: 'Agua', icon: '\u{1F4A7}' },
    { value: 'energia', label: 'Energia', icon: '\u{26A1}' },
    { value: 'gas', label: 'Gas', icon: '\u{1F525}' },
    { value: 'internet', label: 'Internet', icon: '\u{1F310}' },
    { value: 'telefone', label: 'Telefone', icon: '\u{1F4DE}' },
    { value: 'educacao', label: 'Educacao', icon: '\u{1F393}' },
    { value: 'mercado', label: 'Mercado', icon: '\u{1F6D2}' },
    { value: 'supermercado', label: 'Supermercado', icon: '\u{1F6D2}' },
    { value: 'feira', label: 'Feira', icon: '\u{1F34E}' },
    { value: 'assinaturas', label: 'Assinaturas', icon: '\u{1F4F1}' },
    { value: 'restaurantes', label: 'Restaurantes', icon: '\u{1F37D}\uFE0F' },
    { value: 'padaria', label: 'Padaria', icon: '\u{1F35E}' },
    { value: 'cafe', label: 'Cafe e lanches', icon: '\u2615' },
    { value: 'combustivel', label: 'Combustivel', icon: '\u{26FD}' },
    { value: 'uber_taxi', label: 'Uber e taxi', icon: '\u{1F695}' },
    { value: 'onibus_metro', label: 'Onibus e metro', icon: '\u{1F687}' },
    { value: 'bicicleta', label: 'Bicicleta', icon: '\u{1F6B2}' },
    { value: 'passagens', label: 'Passagens', icon: '\u{1F5FA}\uFE0F' },
    { value: 'farmacia', label: 'Farmacia', icon: '\u{1F3E5}' },
    { value: 'consultas', label: 'Consultas', icon: '\u{1FA7A}' },
    { value: 'exames', label: 'Exames', icon: '\u{1F9EA}' },
    { value: 'terapia', label: 'Terapia', icon: '\u{1F9E0}' },
    { value: 'academia', label: 'Academia', icon: '\u{1F4AA}' },
    { value: 'pets', label: 'Pets', icon: '\u{1F436}' },
    { value: 'impostos', label: 'Impostos', icon: '\u{1F9FE}' },
    { value: 'iptu', label: 'IPTU', icon: '\u{1F3DB}\uFE0F' },
    { value: 'ipva', label: 'IPVA', icon: '\u{1F697}' },
    { value: 'roupas', label: 'Roupas', icon: '\u{1F455}' },
    { value: 'calcados', label: 'Calcados', icon: '\u{1F45F}' },
    { value: 'viagem', label: 'Viagem', icon: '\u{2708}\uFE0F' },
    { value: 'presentes', label: 'Presentes', icon: '\u{1F381}' },
    { value: 'manutencao', label: 'Manutencao', icon: '\u{1F527}' },
    { value: 'manutencao_carro', label: 'Manutencao do carro', icon: '\u{1F698}' },
    { value: 'seguros', label: 'Seguros', icon: '\u{1F6E1}\uFE0F' },
    { value: 'taxas', label: 'Taxas bancarias', icon: '\u{1F4B3}' },
    { value: 'juros_multas', label: 'Juros e multas', icon: '\u{1F4C9}' },
    { value: 'aluguel', label: 'Aluguel', icon: '\u{1F3E1}' },
    { value: 'condominio', label: 'Condominio', icon: '\u{1F3E2}' },
    { value: 'cartao_credito', label: 'Cartao de credito', icon: '\u{1F4B3}' },
    { value: 'cartao_debito', label: 'Cartao de debito', icon: '\u{1F4B3}' },
    { value: 'fatura_cartao', label: 'Fatura do cartao', icon: '\u{1F4B3}' },
    { value: 'financiamento', label: 'Financiamento', icon: '\u{1F3E6}' },
    { value: 'emprestimo', label: 'Emprestimo', icon: '\u{1F4B8}' },
    { value: 'parcelas', label: 'Parcelas', icon: '\u{1F4C6}' },
    { value: 'delivery', label: 'Delivery', icon: '\u{1F6F5}' },
    { value: 'streaming', label: 'Streaming', icon: '\u{1F4FA}' },
    { value: 'estacionamento', label: 'Estacionamento', icon: '\u{1F17F}\uFE0F' },
    { value: 'pedagio', label: 'Pedagio', icon: '\u{1F6E3}\uFE0F' },
    { value: 'cuidados_pessoais', label: 'Cuidados pessoais', icon: '\u{1F9FC}' },
    { value: 'beleza', label: 'Beleza', icon: '\u{1F485}' },
    { value: 'cabeleireiro', label: 'Cabeleireiro', icon: '\u2702\uFE0F' },
    { value: 'filhos', label: 'Filhos', icon: '\u{1F9D2}' },
    { value: 'creche', label: 'Creche', icon: '\u{1F476}' },
    { value: 'material_escolar', label: 'Material escolar', icon: '\u{1F4DA}' },
    { value: 'faculdade', label: 'Faculdade', icon: '\u{1F393}' },
    { value: 'curso', label: 'Cursos', icon: '\u{1F4D6}' },
    { value: 'livros', label: 'Livros', icon: '\u{1F4DA}' },
    { value: 'servicos', label: 'Servicos', icon: '\u{1F9D1}\u200D\u{1F527}' },
    { value: 'servicos_domesticos', label: 'Servicos domesticos', icon: '\u{1F9F9}' },
    { value: 'contabilidade', label: 'Contabilidade', icon: '\u{1F4C4}' },
    { value: 'reparos', label: 'Reparos', icon: '\u{1F6E0}\uFE0F' },
    { value: 'salario_funcionarios', label: 'Salario de funcionarios', icon: '\u{1F465}' },
    { value: 'material_trabalho', label: 'Material de trabalho', icon: '\u{1F4BC}' },
    { value: 'software', label: 'Software e apps', icon: '\u{1F4BB}' },
    { value: 'reforma', label: 'Reforma', icon: '\u{1FA9A}' },
    { value: 'lavanderia', label: 'Lavanderia', icon: '\u{1F9FA}' },
    { value: 'higiene', label: 'Higiene', icon: '\u{1F9FC}' },
    { value: 'pet_shop', label: 'Pet shop', icon: '\u{1F43E}' },
    { value: 'veterinario', label: 'Veterinario', icon: '\u{1FA7A}' },
    { value: 'doacao', label: 'Doacao', icon: '\u{1F90D}' },
    { value: 'doacoes', label: 'Doacoes', icon: '\u{1FAF1}' },
    { value: 'pix', label: 'Pix e transferencias', icon: '\u{1F4F2}' },
    { value: 'saque', label: 'Saque', icon: '\u{1F3E7}' },
    { value: 'parcelamentos', label: 'Parcelamentos', icon: '\u{1F4C6}' },
    { value: 'outros', label: 'Outros', icon: '\u{1F4DD}' },
  ],
}

export const chartPalette = [
  '#38bdf8',
  '#34d399',
  '#f59e0b',
  '#fb7185',
  '#a78bfa',
  '#f87171',
]

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function getDefaultCategory(type) {
  return categoryMap[type][0].value
}

export function createFormInitialState() {
  return {
    description: '',
    amount: '',
    type: 'receita',
    category: getDefaultCategory('receita'),
    customCategory: '',
    date: new Date().toISOString().slice(0, 10),
  }
}

export function getCategoryMeta(type, categoryValue) {
  const matchedCategory = categoryMap[type].find((category) => category.value === categoryValue)

  if (matchedCategory) return matchedCategory

  return {
    value: categoryValue,
    label: categoryValue || 'Outros',
    icon: '\u{1F4CC}',
  }
}

export function getMonthKey(date) {
  return date.slice(0, 7)
}

export function formatMonthLabel(monthKey) {
  return monthFormatter.format(new Date(`${monthKey}-01T00:00:00Z`))
}

export function formatShortDate(date) {
  return shortDateFormatter.format(new Date(`${date}T00:00:00Z`))
}

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0)
}
