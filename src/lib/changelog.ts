export type ChangelogEntry = {
  id: string
  date: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-06-11',
    date: '11 jun',
    items: [
      'Botão COPIAR CONVITE — chama a galera num toque',
      'Link de convite não te joga mais no limbo: digita o apelido e já entra direto',
      'Tem um código? Cola no campo novo do lobby e senta na mesa',
      'Salas privadas: cria escondida da lista e só entra quem tem o link',
      'Botão de sair na sala de espera — chega de assento fantasma segurando vaga',
      'O bate agora dá um tempinho pra todo mundo ver a última jogada antes do fim da rodada',
      'Salve pra rapaziada do Asaz! 🍻',
    ],
  },
  {
    id: '2026-06-10',
    date: '10 jun',
    items: [
      'Cartas com animação mais suaaaaave',
      'O selo de espiada/troca não corta mais na quina',
      'Caiu ou trocou de aba? A gente te traz de volta pro jogo',
      'A mesa não fecha mais sozinha enquanto vocês tão jogando',
    ],
  },
  {
    id: '2026-05-28',
    date: '28 mai',
    items: [
      'Botão de Novidades aqui em cima',
      'Quem chega tarde já entra na próxima',
    ],
  },
  {
    id: '2026-05-25',
    date: '25 mai',
    items: [
      'Arena nova: Boteco',
      'Avatares novos',
    ],
  },
]
