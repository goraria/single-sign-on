import {
  Users,
  SquareUser,
  Home,
  LifeBuoy,
  Send,
  LogIn,
  KeySquare,
  BadgeCheck,
  Bolt,
  LayoutDashboard,
  ListTodo,
  AppWindow,
  Bell,
  LockKeyhole,
  ClipboardList,
  Database,
  MonitorSmartphone,
  ShieldCheck,
  Bot,
  Boxes,
  Cloud,
  GitFork,
  Mail,
  MessageSquare,
  MessageCircle,
  Clapperboard,
  SatelliteDish,
  LibraryBig,
  Store,
  Video,
  Banknote,
  ChartBar,
  Gauge,
  ShoppingBag,
  GraduationCap,
  Forklift,
  Server,
  FolderOpen,
  HeartPulse,
  Search,
  CreditCard,
  Receipt,
  Images,
  Globe,
  Rocket,
  FileBox
} from "@gorth/primitive/cores/lucide"

import type { OrbitData } from "@gorth/primitive/illustration/orbit"

export const authOrbitData: OrbitData = {
  brand: {
    title: "Gorth",
    url: "/logo/gorth.png",
    icon: ShieldCheck,
    description: "#",
  },
  navMain: [
    {
      title: "Auth",
      url: "",
      icon: ShieldCheck,
      description: "var(--professional-main)",
    },
    {
      title: "Ecosystem",
      url: "",
      icon: Boxes,
      description: "var(--professional-primary-2)",
    },
    {
      title: "Service",
      url: "",
      icon: Server,
      description: "var(--professional-primary-5)",
    },
  ],
  navSecondary: [
    {
      title: "GorCer",
      url: "",
      icon: MessageCircle,
      description: "var(--professional-secondary)",
    },
    {
      title: "GorBox",
      url: "",
      icon: Clapperboard,
      description: "var(--professional-primary-4)",
    },
    {
      title: "GorDex",
      url: "",
      icon: LibraryBig,
      description: "var(--professional-primary-2)",
    },
    {
      title: "GorMea",
      url: "",
      icon: SatelliteDish,
      description: "var(--professional-primary-5)",
    },
    {
      title: "GorTou",
      url: "",
      icon: ListTodo,
      description: "var(--professional-primary-3)",
    },
    {
      title: "GorSop",
      url: "",
      icon: Store,
      description: "var(--professional-primary-1)",
    },
  ],
  navSignal: [
    {
      title: "Notifications",
      url: "",
      icon: Bell,
      description: "var(--professional-danger)",
    },
    {
      title: "Resource",
      url: "",
      icon: Database,
      description: "var(--professional-info)",
    },
    {
      title: "Discovery",
      url: "",
      icon: Search,
      description: "var(--professional-secondary)",
    },
    {
      title: "Payment",
      url: "",
      icon: CreditCard,
      description: "var(--professional-main)",
    },
    {
      title: "Billing",
      url: "",
      icon: Receipt,
      description: "var(--professional-warning)",
    },
    {
      title: "Media",
      url: "",
      icon: Images,
      description: "var(--professional-primary-1)",
    },
    {
      title: "Insight",
      url: "",
      icon: ChartBar,
      description: "var(--professional-primary-4)",
    },
    {
      title: "Browser",
      url: "",
      icon: Globe,
      description: "var(--professional-secondary)",
    },
    {
      title: "Launcher",
      url: "",
      icon: Rocket,
      description: "var(--professional-success)",
    },
  ],
}

export const sharedRoutes = [
  "/about",
  "/career",
  "/cookie-policy",
  "/demo",
  "/term",
  "/privacy-policy",
  "/.well-known",
] as const

export const guestRoutes = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
] as const

export const protectedRoutes = ["/settings", "/dashboard", "/user"] as const
export const defaultAuthRedirect = "/dashboard"
export const adminRoutes = ["/admin"] as const
export const viceRoutes = ["/vice"] as const

export const appConnection = [
  {
    title: "GitHub",
    description: "Connect repositories, issues, and deployment workflows.",
    isActive: true,
    icon: GitFork,
  },
  {
    title: "Slack",
    description: "Receive workspace notifications and security alerts.",
    isActive: true,
    icon: MessageSquare,
  },
  {
    title: "Google Mail",
    description: "Send transactional e-mails from your applications.",
    isActive: false,
    icon: Mail,
  },
  {
    title: "Supabase",
    description: "Synchronize users and application data securely.",
    isActive: true,
    icon: Database,
  },
  {
    title: "Vercel",
    description: "Manage production and preview deployments.",
    isActive: false,
    icon: Cloud,
  },
  {
    title: "OpenAI",
    description: "Add intelligent assistants and automation workflows.",
    isActive: false,
    icon: Bot,
  },
  {
    title: "Video Platform",
    description: "Connect Gorth video streaming services.",
    isActive: true,
    icon: Video,
  },
  {
    title: "Gorth Apps",
    description: "Manage internal ecosystem application integrations.",
    isActive: true,
    icon: Boxes,
  },
] as const

export const appGlobal = {
  name: "Gorth",
  // name: "Waddles",
  description: "Design by Japtor Gorthenburg",
  title: "Comprehensive Restaurant Management System",
  address: "208 Main St, Hai Bà Trưng, Hà Nội, Việt Nam",
  times: "06:00 - 22:00 (Hằng ngày)",
  opening: "06:00 - 22:00 (GMT+7) (Thứ Hai - Chủ Nhật)",
  phone: "(+84) 123 456 789",
  hotline: "(028) 1876 5439",
  email: "info@gorth.org",
  website: "www.gorth.org",
  currency: "VND",
  locales: "vi-VN",
  zalo: "https://zalo.me/0123456789",
  facebook: "https://www.facebook.com/gorth.org",
  instagram: "https://www.instagram.com/gorth.org",
  twitter: "https://www.twitter.com/gorth.org",
  youtube: "https://www.youtube.com/gorth.org",
  github: "https://www.github.com/gorth.org",
  twitch: "https://www.twitch.tv/gorth.org",
  copyright:
    "Copyright © &copy; 2020 - " +
    new Date().getFullYear() +
    " Gorth Inc. All rights reserved.",
  pro:
    "Bản quyền © Gorth Inc. 2020 - " +
    new Date().getFullYear() +
    " Bảo lưu mọi quyền.",
  copyleft:
    "Copyright © 2020 - " +
    new Date().getFullYear() +
    " Waddles Corp. Powered by Gorth Inc.",
  noob:
    "Bản quyền © Waddles Corp. 2020 - " +
    new Date().getFullYear() +
    " Cung cấp bởi Gorth Inc.",
}

export const visitor = {
  name: "Visitor",
  email: "visitor@gorth.org",
  avatar: "",
  role: "user" as const,
}

export const secondary = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: false,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Bolt,
    isActive: false,
  },
  {
    title: "Home",
    url: "/",
    icon: Home,
    isActive: false,
  },
  {
    title: "Demo",
    url: "/demo",
    icon: FileBox,
    // description: "Demo",
    isActive: false,
  },
]

export const oauthAdminPaths = {
  client: "/admin/oauth/client",
  resource: "/admin/oauth/resource",
  consent: "/admin/oauth/consent",
} as const

export const adminServices = [
  {
    slug: "notification",
    title: "Notifications",
    repository: "notification-center",
    icon: Bell,
    description: "Delivery channels, templates and notification preferences.",
  },
  {
    slug: "resource",
    title: "Resource",
    repository: "resource-interaction",
    icon: Database,
    description: "Resources, comments, reactions and shared interactions.",
  },
  {
    slug: "discovery",
    title: "Discovery",
    repository: "discovery-engine",
    icon: Search,
    description: "Search indexing and cross-application discovery.",
  },
  {
    slug: "payment",
    title: "Payment",
    repository: "payment-gateway",
    icon: CreditCard,
    description: "Payment providers, transactions and webhook processing.",
  },
  {
    slug: "billing",
    title: "Billing",
    repository: "billing-subscription",
    icon: Receipt,
    description: "Plans, subscriptions, invoices and usage.",
  },
  {
    slug: "media",
    title: "Media",
    repository: "media-storage",
    icon: Images,
    description: "Upload, storage and media lifecycle management.",
  },
  {
    slug: "insight",
    title: "Insight",
    repository: "insight-governance",
    icon: ChartBar,
    description: "Analytics, governance and audit insights.",
  },
] as const

export const adminSidebar = {
  user: visitor,
  route: "/",
  role: "main",
  brand: {
    name: "Gorth",
    logo: "/favicon.ico",
  },
  navMain: [
    {
      title: "Default",
      url: "/admin",
      icon: LayoutDashboard,
      isActive: true,
    },
    { title: "CRM", url: "/admin/crm", icon: ChartBar },
    { title: "Finance", url: "/admin/finance", icon: Banknote },
    { title: "Analytics", url: "/admin/analytics", icon: Gauge },
    { title: "Productivity", url: "/admin/productivity", icon: ListTodo },
    { title: "E-commerce", url: "/admin/ecommerce", icon: ShoppingBag },
    { title: "Academy", url: "/admin/academy", icon: GraduationCap },
    { title: "Logistics", url: "/admin/logistics", icon: Forklift },
    { title: "Infrastructure", url: "/admin/infrastructure", icon: Server },
    { title: "File Manager", url: "/admin/file-manager", icon: FolderOpen },
    {
      title: "Patient Monitoring",
      url: "/admin/patient-monitoring",
      icon: HeartPulse,
    },
    { title: "Role", url: "/admin/role", icon: ShieldCheck },
    {
      title: "OAuth",
      url: "#",
      icon: KeySquare,
      items: [
        { title: "Client", url: oauthAdminPaths.client, icon: AppWindow },
        { title: "Resource", url: oauthAdminPaths.resource, icon: Database },
        { title: "Consent", url: oauthAdminPaths.consent, icon: ShieldCheck },
      ],
    },
    {
      title: "User",
      url: "/admin/user",
      icon: Users,
      isActive: true,
    },
    {
      title: "Session",
      url: "/admin/session",
      icon: MonitorSmartphone,
      isActive: true,
    },
    {
      title: "Audit log",
      url: "/admin/audit-log",
      icon: ClipboardList,
      isActive: true,
    },
  ],
  navSecondary: secondary,
  projects: [],
  navDropdown: [
    {
      title: "Settings",
      url: "/settings",
      icon: Bolt,
    },
  ],
  navSignal: [
    {
      title: "Sign In",
      url: "/auth/sign-in",
      icon: LogIn,
    },
    {
      title: "Sign Up",
      url: "/auth/sign-up",
      icon: KeySquare,
    },
  ],
}

export const settingsSidebar = {
  user: visitor,
  route: "/",
  role: "main",
  brand: { name: "Gorth", logo: "/favicon.ico" },
  navMain: [
    { title: "Profile", url: "/settings", icon: SquareUser },
    {
      title: "Tasks",
      url: "/settings/task",
      icon: ListTodo,
      isActive: true,
    },
    {
      title: "Apps",
      url: "/settings/app",
      icon: AppWindow,
      isActive: true,
    },
    {
      title: "Notification",
      url: "/settings/notification",
      icon: Bell,
      isActive: true,
    },
    {
      title: "Security",
      url: "/settings/security",
      icon: LockKeyhole,
      isActive: true,
    },
    {
      title: "Sessions",
      url: "/settings/session",
      icon: MonitorSmartphone,
      isActive: true,
    },
    {
      title: "Browser accounts",
      url: "/settings/browser-account",
      icon: Users,
      isActive: true,
    },
    {
      title: "Options",
      url: "#",
      icon: LockKeyhole,
      isActive: true,
      items: [
        {
          title: "Profile",
          url: "/settings/profile",
          icon: SquareUser,
          // isActive: true,
        },
        {
          title: "Account",
          url: "/settings/account",
          icon: LifeBuoy,
        },
        {
          title: "Appearance",
          url: "/settings/appearance",
          icon: Send,
        },
        {
          title: "Display",
          url: "/settings/display",
          icon: Send,
        },
      ],
    },
  ],

  navSecondary: secondary,
  projects: [],
  navDropdown: [{ title: "Settings", url: "/settings", icon: Bolt }],
  navSignal: adminSidebar.navSignal,
}

export const roleSidebars = {
  user: {
    ...settingsSidebar,
    navMain: [
      { title: "User dashboard", url: "/user", icon: LayoutDashboard },
      { title: "Role", url: "/user/role", icon: ShieldCheck },
    ],
    projects: [],
  },
  vice: {
    ...settingsSidebar,
    navMain: [
      { title: "Vice dashboard", url: "/vice", icon: LayoutDashboard },
      { title: "Role", url: "/vice/role", icon: ShieldCheck },
    ],
    projects: [],
  },
}

export const mainHeader = {
  user: visitor,
  navMain: [
    {
      title: "Admin",
      url: "/admin",
      icon: BadgeCheck,
      isActive: true,
    },
    {
      title: "User",
      url: "/admin/user",
      icon: Users,
      isActive: true,
    },
    {
      title: "Client",
      url: oauthAdminPaths.client,
      icon: AppWindow,
      isActive: true,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Bolt,
      isActive: true,
    },
  ],
  navSecondary: secondary,
  navDropdown: [
    {
      title: "Account",
      url: "/admin",
      icon: BadgeCheck,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Bolt,
    },
  ],
  navSignal: [
    {
      title: "Sign In",
      url: "/auth/sign-in",
      icon: LogIn,
    },
    {
      title: "Sign Up",
      url: "/auth/sign-up",
      icon: KeySquare,
    },
  ],
}

export const mainFooter = {
  navDropdown: [
    {
      title: "Application",
      url: "#",
      icon: AppWindow,
      items: [
        { title: "Single sign-on", url: "/" },
        { title: "Applications", url: "/settings/app" },
        { title: "Tasks", url: "/settings/task" },
        { title: "Dashboard", url: "/dashboard" },
      ],
    },
    {
      title: "Resources",
      url: "#",
      icon: LifeBuoy,
      items: [
        { title: "API demo", url: "/demo" },
        { title: "Security", url: "/#security" },
        { title: "How it works", url: "/#how-it-works" },
        { title: "Account", url: "/settings/account" },
      ],
    },
    {
      title: "Company",
      url: "#",
      icon: Users,
      items: [
        { title: "About", url: "/about" },
        { title: "Contact", url: "mailto:hello@gorth.app" },
        { title: "Careers", url: "/career" },
        { title: "GitHub", url: appGlobal.github },
      ],
    },
    {
      title: "Legal",
      url: "#",
      icon: LockKeyhole,
      items: [
        { title: "Terms and conditions", url: "/term" },
        { title: "Privacy policy", url: "/privacy-policy" },
        { title: "Security", url: "/#security" },
        { title: "Cookie policy", url: "/cookie-policy" },
      ],
    },
  ],
}
