export interface SearchItem {
  title: string
  description?: string
  link: string
  icon?: string
  keywords?: string[]
  group: string
  ownerOnly?: boolean
}

export const searchItems: SearchItem[] = [
  // Stats Page
  {
    title: 'nav.stats',
    description: 'search.statsDesc',
    link: '/',
    icon: 'i-lucide-activity',
    keywords: ['dashboard', 'analytics', 'overview', 'home'],
    group: 'search.pages',
  },

  // Subscriptions
  {
    title: 'nav.subscriptions',
    description: 'search.subscriptionsDesc',
    link: '/subscriptions',
    icon: 'i-lucide-users',
    keywords: ['users', 'clients', 'accounts'],
    group: 'search.pages',
  },

  // Services
  {
    title: 'nav.services',
    description: 'search.servicesDesc',
    link: '/services',
    icon: 'i-lucide-box',
    keywords: ['plans', 'packages'],
    group: 'search.pages',
  },

  // Nodes
  {
    title: 'nav.nodes',
    description: 'search.nodesDesc',
    link: '/nodes',
    icon: 'i-lucide-server',
    keywords: ['servers', 'infrastructure'],
    group: 'search.pages',
    ownerOnly: true,
  },

  // Admins
  {
    title: 'nav.admins',
    description: 'search.adminsDesc',
    link: '/admins',
    icon: 'i-lucide-user-cog',
    keywords: ['administrators', 'users', 'accounts'],
    group: 'search.pages',
    ownerOnly: true,
  },

  // Security Page
  {
    title: 'nav.security',
    description: 'search.securityDesc',
    link: '/config/security',
    icon: 'i-lucide-shield',
    keywords: ['password', 'authentication', 'login'],
    group: 'search.config',
  },
  {
    title: 'search.changePassword',
    description: 'search.changePasswordDesc',
    link: '/config/security',
    icon: 'i-lucide-key-round',
    keywords: ['password', 'security', 'credentials', 'auth'],
    group: 'search.security',
  },

  // Links Page
  {
    title: 'nav.links',
    description: 'search.linksDesc',
    link: '/config/access',
    icon: 'i-lucide-key',
    keywords: ['access', 'subscription', 'url'],
    group: 'search.config',
  },
  {
    title: 'search.maxLinks',
    description: 'search.maxLinksDesc',
    link: '/config/access',
    icon: 'i-lucide-hash',
    keywords: ['max links', 'limit', 'subscription'],
    group: 'search.linksSettings',
  },
  {
    title: 'search.accessTitle',
    description: 'search.accessTitleDesc',
    link: '/config/access',
    icon: 'i-lucide-heading',
    keywords: ['title', 'header', 'name'],
    group: 'search.linksSettings',
  },
  {
    title: 'search.accessDescription',
    description: 'search.accessDescriptionDesc',
    link: '/config/access',
    icon: 'i-lucide-text',
    keywords: ['description', 'text', 'info'],
    group: 'search.linksSettings',
  },
  {
    title: 'search.supportUrl',
    description: 'search.supportUrlDesc',
    link: '/config/access',
    icon: 'i-lucide-headset',
    keywords: ['support', 'help', 'telegram', 'contact'],
    group: 'search.linksSettings',
  },
  {
    title: 'search.updateInterval',
    description: 'search.updateIntervalDesc',
    link: '/config/access',
    icon: 'i-lucide-clock',
    keywords: ['interval', 'refresh', 'hours', 'update'],
    group: 'search.linksSettings',
  },
  {
    title: 'search.usernameTag',
    description: 'search.usernameTagDesc',
    link: '/config/access',
    icon: 'i-lucide-at-sign',
    keywords: ['username', 'tag', 'identifier', 'v2rayng'],
    group: 'search.linksSettings',
  },
  {
    title: 'search.shuffleLinks',
    description: 'search.shuffleLinksDesc',
    link: '/config/access',
    icon: 'i-lucide-shuffle',
    keywords: ['random', 'shuffle', 'order'],
    group: 'search.linksSettings',
  },

  // Placeholders Page
  {
    title: 'nav.placeholders',
    description: 'search.placeholdersDesc',
    link: '/config/placeholders',
    icon: 'i-lucide-code',
    keywords: ['remark', 'format', 'template'],
    group: 'search.config',
  },
  {
    title: 'search.addPlaceholder',
    description: 'search.addPlaceholderDesc',
    link: '/config/placeholders',
    icon: 'i-lucide-plus',
    keywords: ['create', 'new', 'placeholder', 'remark'],
    group: 'search.placeholderSettings',
  },
  {
    title: 'search.placeholderCategories',
    description: 'search.placeholderCategoriesDesc',
    link: '/config/placeholders',
    icon: 'i-lucide-tags',
    keywords: ['category', 'type', 'info', 'limited', 'expired', 'disabled'],
    group: 'search.placeholderSettings',
  },

  // Telegram Bot Page
  {
    title: 'nav.telegramBot',
    description: 'search.telegramBotDesc',
    link: '/config/notifications',
    icon: 'i-lucide-bot',
    keywords: ['alerts', 'messages', 'telegram', 'bot', 'notifications'],
    group: 'search.config',
  },
  {
    title: 'search.telegramAdminId',
    description: 'search.telegramAdminIdDesc',
    link: '/config/notifications',
    icon: 'i-lucide-user',
    keywords: ['telegram', 'id', 'user', 'chat', 'admin'],
    group: 'search.botAccess',
  },
  {
    title: 'search.telegramBotToken',
    description: 'search.telegramBotTokenDesc',
    link: '/config/notifications',
    icon: 'i-lucide-key',
    keywords: ['telegram', 'bot', 'token', 'api'],
    group: 'search.botAccess',
  },
  {
    title: 'search.expireWarningDays',
    description: 'search.expireWarningDaysDesc',
    link: '/config/notifications',
    icon: 'i-lucide-calendar-clock',
    keywords: ['expire', 'warning', 'days', 'notification', 'alert'],
    group: 'search.botAccess',
  },
  {
    title: 'search.usageWarningPercent',
    description: 'search.usageWarningPercentDesc',
    link: '/config/notifications',
    icon: 'i-lucide-percent',
    keywords: ['usage', 'warning', 'percent', 'traffic', 'data'],
    group: 'search.botAccess',
  },
]
