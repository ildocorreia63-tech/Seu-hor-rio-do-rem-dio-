/**
 * Motor Inteligente Farmacêutico & Médico de Saúde
 * Funciona 100% offline e estático (GitHub Pages), com suporte adicional à API do Google Gemini.
 */

export interface AiKnowledgeAnswer {
  keywords: string[];
  answer: string;
}

export const KNOWLEDGE_BASE: AiKnowledgeAnswer[] = [
  {
    keywords: ['antibiótico', 'estômago', 'agredir', 'proteger', 'azia', 'dor de estômago', 'queimação'],
    answer: `🩺 **Como tomar antibióticos sem agredir o estômago:**

1. 🍽️ **Tome junto ou após uma refeição leve:** A maioria dos antibióticos (como Amoxicilina, Cefalexina, Claritromicina) é melhor tolerada quando tomada logo após comer (uma fruta, torrada ou refeição principal).
2. 🥛 **Atenção aos laticínios:** Alguns antibióticos (como Azitromicina ou Tetraciclinas) NÃO devem ser ingeridos junto com leite ou derivados, pois o cálcio reduz a absorção. Tome com água.
3. 💧 **Beba bastante água:** Tome o comprimido com um copo cheio de água (200ml) e evite deitar-se nos primeiros 30 minutos após engolir.
4. ⏰ **Mantenha os horários exatos:** Respeite rigorosamente o intervalo de 8h em 8h ou 12h em 12h para manter a eficácia.
5. 🦠 **Probióticos:** Considere o uso de probióticos ou iogurtes naturais em horários alternados (ex: 2h após o antibiótico) para proteger a flora intestinal.

⚠️ *Importante: Sempre consulte o farmacêutico ou médico que prescreveu o medicamento para recomendações específicas.*`
  },
  {
    keywords: ['esqueci', 'esquecer', 'dose', 'atrasei', 'horário certo', 'passou da hora', 'perdi o horário'],
    answer: `⏰ **O que fazer se você esquecer de tomar uma dose:**

1. ⏳ **Se o horário estiver próximo do original:** Tome a dose assim que lembrar.
2. 🚫 **Se estiver muito próximo da próxima dose:** Pule a dose esquecida e tome apenas a próxima no horário habitual.
3. ⚠️ **NUNCA dobre a dose:** Tomar dois comprimidos juntos para "compensar" pode causar superdosagem e efeitos colaterais perigosos.
4. 📝 **Antibióticos:** Se o atraso for de mais de 4 horas, tome assim que lembrar e ajuste os horários seguintes conforme orientação médica.
5. 🔔 **Dica:** Ative os alarmes sonoros e notificações por voz no aplicativo para nunca mais esquecer!`
  },
  {
    keywords: ['leite', 'café', 'suco', 'álcool', 'bebida', 'refrigerante', 'misturar'],
    answer: `🥤 **Com o que posso tomar meus medicamentos?**

1. 💧 **Água pura é a melhor escolha:** Sempre tome remédios com um copo cheio de água filtrada em temperatura ambiente.
2. 🥛 **Leite:** O cálcio do leite pode anular ou enfraquecer certos antibióticos (tetraciclinas, quinolonas) e suplementos de ferro.
3. ☕ **Café / Chá:** A cafeína e taninos podem irritar a mucosa gástrica e acelerar o metabolismo de certos remédios (como calmantes ou anti-hipertensivos).
4. 🍊 **Sucos cítricos (laranja, toranja/grapefruit):** A toranja altera enzimas do fígado e pode multiplicar perigosamente o efeito de estatinas e remédios de pressão.
5. 🍺 **Bebidas alcoólicas:** Evite totalmente o consumo de álcool durante tratamentos com antibióticos, calmantes, antidepressivos e anti-inflamatórios.`
  },
  {
    keywords: ['losartana', 'pressão', 'hipertensão', 'captopril', 'atenolol', 'enalapril', 'pressão alta'],
    answer: `🩺 **Orientações para Medicamentos de Pressão (ex: Losartana):**

1. 🌅 **Horário habitual:** Geralmente tomado pela manhã ao acordar ou à noite, sempre no mesmo horário fixo.
2. 🍽️ **Com ou sem alimentos:** Pode ser ingerido com ou sem comida, acompanhado de um copo d'água.
3. 🧂 **Controle de sódio:** Mantenha uma dieta equilibrada com pouco sal para potencializar o efeito do medicamento.
4. 🩺 **Monitore a pressão:** Registre suas aferições de pressão regularmente no histórico do aplicativo.
5. ⚠️ **Não interrompa:** Medicamentos de uso contínuo nunca devem ser pausados sem consentimento do seu cardiologista.`
  },
  {
    keywords: ['metformina', 'diabetes', 'glicemia', 'açúcar', 'insulina', 'glibenclamida'],
    answer: `🩺 **Orientações para Medicamentos do Diabetes (ex: Metformina):**

1. 🍽️ **Sempre durante ou após as refeições:** A Metformina deve ser tomada com a refeição principal (almoço ou jantar) para evitar desconfortos gastrointestinais, gases ou náuseas.
2. 💧 **Engula inteiro:** Não mastigue ou quebre comprimidos de liberação prolongada (XR).
3. 🍎 **Alimentação regular:** Não fique longos períodos em jejum para evitar episódios de hipoglicemia.
4. 📋 **Acompanhamento:** Realize os exames de glicemia em jejum e hemoglobina glicada conforme solicitado pelo endocrinologista.`
  },
  {
    keywords: ['dipirona', 'paracetamol', 'ibuprofeno', 'dor', 'febre', 'dor de cabeça', 'inflamação'],
    answer: `💊 **Analgésicos e Antitérmicos (Dipirona, Paracetamol, Ibuprofeno):**

1. 🌡️ **Dipirona / Paracetamol:** Indicados para alívio de dor leve a moderada e febre. Respeite o intervalo mínimo de 6h a 8h entre as doses.
2. 🩹 **Ibuprofeno:** É um anti-inflamatório. Deve ser tomado preferencialmente de estômago cheio para não causar azia ou gastrite.
3. ⚠️ **Atenção ao fígado:** Não ultrapasse a dose máxima diária de Paracetamol (máximo 3g a 4g por dia em adultos saudáveis).
4. 🚨 **Persistência dos sintomas:** Se a febre persistir por mais de 3 dias ou a dor por mais de 5 dias, procure atendimento médico.`
  },
  {
    keywords: ['jejum', 'refeição', 'comida', 'antes de comer', 'depois de comer'],
    answer: `🍽️ **Jejum x Com Refeição:**

- **Em Jejum (30 a 60 min antes de comer):**
  - Protetores gástricos (Omeprazol, Pantoprazol)
  - Hormônios da tireoide (Levotiroxina / Puran T4)
  - Alguns antibióticos específicos
- **Com ou após a Refeição:**
  - Anti-inflamatórios (Ibuprofeno, Cetoprofeno, Nimesulida)
  - Metformina
  - Suplementos de Ferro e Vitaminas lipossolúveis (A, D, E, K)
  - Antibióticos em geral (para reduzir náuseas)`
  }
];

/**
 * Analisa a pergunta do usuário e busca na base de conhecimento farmacêutica
 */
export function getOfflineHealthAdvice(query: string): string {
  const normalized = query.toLowerCase().trim();

  // Search in database
  let bestMatch: AiKnowledgeAnswer | null = null;
  let maxScore = 0;

  for (const item of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        score += kw.length;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && maxScore > 3) {
    return bestMatch.answer;
  }

  // Generic comprehensive response
  return `🩺 **Orientações Gerais do Assistente Farmacêutico:**

Sobre a sua dúvida (*"${query}"*):

1. ⏰ **Horários e Regularidade:** Mantenha sempre intervalos constantes entre as doses (ex: de 8h em 8h ou 12h em 12h) para garantir que a concentração do medicamento no sangue permaneça estável.
2. 💧 **Ingestão Adequada:** Ingira seus comprimidos ou cápsulas sempre com um copo cheio de água (200ml). Evite ingerir com leite, café, refrigerantes ou bebidas alcoólicas.
3. 🍽️ **Estômago Protegido:** Se o medicamento causar desconforto gástrico ou náusea, tome-o acompanhado de uma refeição leve, exceto quando a bula exigir jejum estrito.
4. 📦 **Armazenamento:** Guarde os medicamentos em local fresco, arejado, protegido da luz solar direta e longe da umidade do banheiro.
5. 🔔 **Configuração no App:** Cadastre o nome, a dose e os horários na aba **Remédios** para que o alarme toque automaticamente!

⚠️ *Nota: Esta resposta foi gerada pelo Assistente IA. Em caso de dúvidas graves, efeitos adversos ou sintomas persistentes, procure atendimento médico ou consulte seu farmacêutico.*`;
}
