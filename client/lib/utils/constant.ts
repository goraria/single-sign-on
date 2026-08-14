import {
  Users,
  SquareUser,
  Home,
  LifeBuoy,
  Send,
  Music,
  Rocket,
  Newspaper,
  SportShoe,
  LogIn,
  KeySquare,
  BadgeCheck,
  Bolt,
  LayoutDashboard,
  ListTodo,
  AppWindow,
} from "@gorth/primitive/cores/lucide";

export const administratorSidebar = {
  user: {
    name: "japtor",
    email: "japtor@gorth.org",
    avatar: "/avatar/waddles.jpeg",
  },
  route: "/",
  role: "main",
  brand: {
    name: "Gortheia",
    logo: "/favicon.ico",
  },
  navMain: [
    {
      title: "Administrator",
      url: "/administrator",
      icon: BadgeCheck,
      isActive: true,
    },
    {
      title: "SSO Applications",
      url: "/administrator",
      icon: Users,
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
      url: "/sign-in",
      icon: LogIn,
    },
    {
      title: "Sign Up",
      url: "/sign-up",
      icon: KeySquare,
    },
  ],
};

export const settingSidebar = {
  user: {
    name: "japtor",
    email: "japtor@gorth.org",
    avatar: "/avatar/waddles.jpeg",
  },
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
  ],
  navSecondary: [
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
      title: "Notification",
      url: "/settings/notifications",
      icon: Send,
    },
    {
      title: "Display",
      url: "/settings/display",
      icon: Send,
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
      url: "#",
      icon: Bolt,
    },
  ],
  navSignal: [
    {
      title: "Sign In",
      url: "/sign-in",
      icon: LogIn,
    },
    {
      title: "Sign Up",
      url: "/sign-up",
      icon: KeySquare,
    },
  ],
};

export const mainDashbar = {
  navMain: [
    {
      title: "Administrator",
      url: "/administrator",
      icon: BadgeCheck,
      isActive: true,
    },
    {
      title: "SSO Applications",
      url: "/administrator",
      icon: Users,
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
      isActive: true,
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
      url: "#",
      icon: Bolt,
    },
  ],
  navSignal: [
    {
      title: "Sign In",
      url: "/sign-in",
      icon: LogIn,
    },
    {
      title: "Sign Up",
      url: "/sign-up",
      icon: KeySquare,
    },
  ],
};
