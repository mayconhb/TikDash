export const motivationalQuotes = [
  "O próximo viral está a um vídeo de distância. Continue criando!",
  "Sua consistência no TikTok Shop é o que constrói seu império.",
  "Vídeos engajam, mas a confiança converte. Mantenha o foco!",
  "Cada visualização é uma oportunidade. Valorize seu tráfego.",
  "O algoritmo favorece quem não desiste. Vamos pra cima!",
  "Transforme sua criatividade em lucro hoje.",
  "Sua loja, suas regras, seu sucesso. Foque no processo.",
  "O TikTok Shop premia a autenticidade. Seja você mesmo!",
  "Vendas são consequência de um bom conteúdo. Capriche no roteiro.",
  "Não espere a perfeição para postar. A prática leva ao faturamento.",
  "O engajamento de hoje é a venda de amanhã.",
  "Analise seus dados, mas confie no seu instinto criativo.",
  "No TikTok Shop, a velocidade é sua aliada. Adapte-se e vença.",
  "Um bom hook (gancho) vale ouro. Domine a atenção do seu público.",
  "Seu produto resolve um problema? Mostre isso em 15 segundos.",
  "A disciplina supera o talento quando o talento não tem disciplina.",
  "O sucesso no digital é uma maratona, não um sprint.",
  "Cada 'carrinho adicionado' é um passo rumo à sua meta.",
  "Otimize seu catálogo, potencialize suas vendas.",
  "O público do TikTok ama novidades. O que você tem de novo hoje?",
  "Sua energia transparece no vídeo. Grave com entusiasmo!",
  "A concorrência dorme, você escala. Aproveite as oportunidades.",
  "Feedbacks negativos são bússolas para a melhoria.",
  "A escala no TikTok Shop é exponencial. Esteja preparado.",
  "Humanize sua marca e veja a mágica acontecer.",
  "O conteúdo nativo é o que mais vende. Menos cara de anúncio, mais entrega.",
  "Acredite no seu produto tanto quanto você acredita no seu sonho.",
  "Pequenos ajustes no CTA podem gerar grandes resultados.",
  "O mercado digital não para. Sua evolução também não deve parar.",
  "Você é o CEO da sua própria jornada. Lidere com excelência."
];

export function getDailyQuote(): string {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % motivationalQuotes.length;
  return motivationalQuotes[index];
}
