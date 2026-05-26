'use client'

import { BackgroundDefault } from './backgrounds/BackgroundDefault'
import { BackgroundBoteco } from './backgrounds/BackgroundBoteco'

export function Background({ arenaId = 'default' }: { arenaId?: string }) {
  switch (arenaId) {
    case 'boteco':
      return <BackgroundBoteco />
    case 'default':
    default:
      return <BackgroundDefault />
  }
}
