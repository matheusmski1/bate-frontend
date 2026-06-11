export type ChangelogEntry = {
  id: string
  date: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
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
