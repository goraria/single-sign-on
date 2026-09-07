import {
  Users,
  SquareUser,
  Home,
  LifeBuoy,
  Send,
  Music,
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
  Video,
} from "@gorth/primitive/cores/lucide"

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
      title: "Admin",
      url: "/admin",
      icon: BadgeCheck,
      isActive: true,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
      isActive: true,
    },
    {
      title: "Applications",
      url: "/admin/apps",
      icon: AppWindow,
      isActive: true,
    },
    {
      title: "Sessions",
      url: "/admin/sessions",
      icon: MonitorSmartphone,
      isActive: true,
    },
    {
      title: "Resources",
      url: "/admin/resources",
      icon: Database,
      isActive: true,
    },
    {
      title: "Consents",
      url: "/admin/consents",
      icon: ShieldCheck,
      isActive: true,
    },
    {
      title: "Audit Logs",
      url: "/admin/audit-logs",
      icon: ClipboardList,
      isActive: true,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Bolt,
      isActive: true,
    },
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: true,
    },
  ],
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

export const settingSidebar = {
  user: visitor,
  route: "/",
  role: "main",
  brand: {
    name: "Gortheia",
    logo: "/favicon.ico",
  },
  // teams: [
  //   {
  //     name: "Gorth Inc.",
  //     logo: GalleryVerticalEnd,
  //     plan: "Enterprise",
  //   },
  //   {
  //     name: "Goraria Corp.",
  //     logo: AudioWaveform,
  //     plan: "Startup",
  //   },
  //   {
  //     name: "Waddles Corp.",
  //     logo: Command,
  //     plan: "Free",
  //   },
  // ],
  navMain: [
    {
      title: "Dashboard",
      url: "/settings",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Tasks",
      url: "/settings/tasks",
      icon: ListTodo,
      isActive: true,
    },
    {
      title: "Apps",
      url: "/settings/apps",
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
      url: "/settings/sessions",
      icon: MonitorSmartphone,
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
  navSecondary: [
    {
      title: "Account",
      url: "/settings",
      icon: SquareUser,
      // isActive: true,
    },
  ],
  projects: [
    {
      name: "Others",
      url: "#",
      icon: Music,
    },
  ],
  navDropdown: [
    {
      title: "Account",
      url: "#",
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
      title: "Users",
      url: "/admin/users",
      icon: Users,
      isActive: true,
    },
    {
      title: "Applications",
      url: "/admin/apps",
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
  navSecondary: [
    {
      title: "Home",
      url: "/",
      icon: Home,
      description: "Home Page",
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Bolt,
      isActive: true,
    },
    {
      title: "Demo",
      url: "/demo",
      icon: Home,
      description: "Demo Page",
    },
  ],
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
        { title: "Applications", url: "/settings/apps" },
        { title: "Tasks", url: "/settings/tasks" },
        { title: "Dashboard", url: "/settings" },
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
        { title: "Careers", url: "/careers" },
        { title: "GitHub", url: appGlobal.github },
      ],
    },
    {
      title: "Legal",
      url: "#",
      icon: LockKeyhole,
      items: [
        { title: "Terms and conditions", url: "/terms" },
        { title: "Privacy policy", url: "/privacy-policy" },
        { title: "Security", url: "/#security" },
        { title: "Cookie policy", url: "/cookie-policy" },
      ],
    },
  ],
}
