import type { NavMenu, NavMenuItems } from '~/types/nav'

export const navMenu: NavMenu[] = [
  {
    heading: 'nav.general',
    items: [
      {
        title: 'nav.stats',
        icon: 'i-lucide-activity',
        link: '/',
      },
      {
        title: 'nav.subscriptions',
        icon: 'i-lucide-users',
        link: '/subscriptions',
      },
      {
        title: 'nav.services',
        icon: 'i-lucide-box',
        link: '/services',
      },
      {
        title: 'nav.nodes',
        icon: 'i-lucide-server',
        link: '/nodes',
        ownerOnly: true,
      },
      {
        title: 'nav.admins',
        icon: 'i-lucide-user-cog',
        link: '/admins',
        ownerOnly: true,
      },
    ],
  },
  {
    heading: 'nav.config',
    items: [
      {
        title: 'nav.security',
        icon: 'i-lucide-shield',
        link: '/config/security',
      },
      {
        title: 'nav.links',
        icon: 'i-lucide-key',
        link: '/config/access',
      },
      {
        title: 'nav.placeholders',
        icon: 'i-lucide-code',
        link: '/config/placeholders',
      },
      {
        title: 'nav.notifications',
        icon: 'i-lucide-bell',
        link: '/config/notifications',
      },
    ],
  },
  {
    heading: 'nav.platforms',
    items: [
      {
        title: 'nav.telegramBot',
        icon: 'i-lucide-bot',
        link: '/config/telegram',
      },
      {
        title: 'nav.discordWebhook',
        icon: 'i-lucide-webhook',
        link: '/config/discord',
      },
    ],
  },
  {
    heading: 'nav.system',
    items: [
      {
        title: 'nav.backup',
        icon: 'i-lucide-database',
        link: '/backup',
      },
      {
        title: 'nav.apiAccess',
        icon: 'i-lucide-terminal',
        link: '/api',
      },
    ],
  },
]

export const navMenuBottom: NavMenuItems = [
  {
    title: 'nav.faqHelp',
    icon: 'i-lucide-circle-help',
    link: '/faq',
  },
]

