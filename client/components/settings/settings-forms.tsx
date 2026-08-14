"use client";

import { FormEvent, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@gorth/primitive/default/button";
import { Checkbox } from "@gorth/primitive/default/checkbox";
import { Input } from "@gorth/primitive/default/input";
import { Label } from "@gorth/primitive/default/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@gorth/primitive/default/radio-group";
import { Switch } from "@gorth/primitive/default/switch";
import { Textarea } from "@gorth/primitive/default/textarea";
import { ContentSection } from "@/components/settings/content-section";

function FormNotice({ visible }: { visible: boolean }) {
  return visible ? (
    <p className="text-sm text-emerald-600">Preferences updated.</p>
  ) : null;
}

export function ProfileSettings() {
  const [saved, setSaved] = useState(false);
  return (
    <ContentSection
      title="Profile"
      description="This is how others will see you on the site."
    >
      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" defaultValue="japtor" className="max-w-lg" />
          <p className="text-muted-foreground text-sm">
            This is your public display name.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            defaultValue="japtor@gorth.org"
            className="max-w-lg"
          />
          <p className="text-muted-foreground text-sm">
            Select the verified address used for account communication.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            defaultValue="Building secure authentication for the Gorth ecosystem."
            className="max-w-lg"
          />
        </div>
        <FormNotice visible={saved} />
        <Button type="submit">Update profile</Button>
      </form>
    </ContentSection>
  );
}

export function AccountSettings() {
  const [saved, setSaved] = useState(false);
  return (
    <ContentSection
      title="Account"
      description="Update your account preferences and localization."
    >
      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="account-name">Name</Label>
          <Input id="account-name" defaultValue="Japtor" className="max-w-lg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date-of-birth">Date of birth</Label>
          <Input id="date-of-birth" type="date" className="max-w-lg" />
          <p className="text-muted-foreground text-sm">
            Your date of birth is used to calculate your age.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <select
            id="language"
            defaultValue="en"
            className="border-input bg-background h-9 w-full max-w-lg rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
          >
            <option value="en">English</option>
            <option value="vi">Vietnamese</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
          <p className="text-muted-foreground text-sm">
            This is the language used in the dashboard.
          </p>
        </div>
        <FormNotice visible={saved} />
        <Button type="submit">Update account</Button>
      </form>
    </ContentSection>
  );
}

export function AppearanceSettings() {
  const { resolvedTheme, setTheme } = useTheme();
  const [theme, setSelectedTheme] = useState(
    resolvedTheme === "dark" ? "dark" : "light",
  );
  const [font, setFont] = useState("inter");
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTheme(theme);
    document.documentElement.dataset.font = font;
    setSaved(true);
  }

  return (
    <ContentSection
      title="Appearance"
      description="Customize the appearance of the dashboard."
    >
      <form onSubmit={submit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="font">Font</Label>
          <select
            id="font"
            value={font}
            onChange={(event) => setFont(event.target.value)}
            className="border-input bg-background h-9 w-52 rounded-md border px-3 text-sm capitalize outline-none focus-visible:ring-2"
          >
            <option value="inter">Inter</option>
            <option value="system">System</option>
            <option value="mono">Mono</option>
          </select>
          <p className="text-muted-foreground text-sm">
            Set the font you want to use in the dashboard.
          </p>
        </div>
        <div className="space-y-3">
          <Label>Theme</Label>
          <p className="text-muted-foreground text-sm">
            Select the theme for the dashboard.
          </p>
          <RadioGroup
            value={theme}
            onValueChange={setSelectedTheme}
            className="grid max-w-md grid-cols-2 gap-8 pt-2"
          >
            {[
              ["light", "Light", "bg-[#ecedef]"],
              ["dark", "Dark", "bg-slate-950"],
            ].map(([value, title, background]) => (
              <Label key={value} className="cursor-pointer">
                <RadioGroupItem value={value} className="sr-only" />
                <div
                  className={`rounded-md border-2 p-1 ${theme === value ? "border-primary" : "border-muted"}`}
                >
                  <div className={`space-y-2 rounded-sm p-2 ${background}`}>
                    <div className="h-8 rounded-md bg-white/70 shadow-xs" />
                    <div className="h-8 rounded-md bg-white/40 shadow-xs" />
                    <div className="h-8 rounded-md bg-white/40 shadow-xs" />
                  </div>
                </div>
                <span className="block p-2 text-center font-normal">
                  {title}
                </span>
              </Label>
            ))}
          </RadioGroup>
        </div>
        <FormNotice visible={saved} />
        <Button type="submit">Update preferences</Button>
      </form>
    </ContentSection>
  );
}

export function NotificationSettings() {
  const [notificationType, setNotificationType] = useState("all");
  const [communication, setCommunication] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [social, setSocial] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <ContentSection
      title="Notifications"
      description="Configure how you receive notifications."
    >
      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <div className="space-y-3">
          <Label>Notify me about...</Label>
          <RadioGroup
            value={notificationType}
            onValueChange={setNotificationType}
            className="space-y-2"
          >
            {[
              ["all", "All new messages"],
              ["mentions", "Direct messages and mentions"],
              ["none", "Nothing"],
            ].map(([value, title]) => (
              <Label
                key={value}
                className="flex items-center gap-2 font-normal"
              >
                <RadioGroupItem value={value} />
                {title}
              </Label>
            ))}
          </RadioGroup>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Notifications</h3>
          {[
            [
              "Communication emails",
              "Receive emails about account activity.",
              communication,
              setCommunication,
            ],
            [
              "Marketing emails",
              "Receive emails about new products and features.",
              marketing,
              setMarketing,
            ],
            [
              "Social emails",
              "Receive emails for follows and mentions.",
              social,
              setSocial,
            ],
          ].map(([title, description, checked, setter]) => (
            <div
              key={String(title)}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div>
                <Label>{String(title)}</Label>
                <p className="text-muted-foreground text-sm">
                  {String(description)}
                </p>
              </div>
              <Switch
                checked={Boolean(checked)}
                onCheckedChange={setter as (checked: boolean) => void}
              />
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label>Security emails</Label>
              <p className="text-muted-foreground text-sm">
                Receive emails about account activity and security.
              </p>
            </div>
            <Switch checked disabled aria-readonly />
          </div>
        </div>
        <Label className="flex items-start gap-2 font-normal">
          <Checkbox
            checked={mobile}
            onCheckedChange={(checked) => setMobile(Boolean(checked))}
          />
          Use different settings for mobile devices
        </Label>
        <FormNotice visible={saved} />
        <Button type="submit">Update notifications</Button>
      </form>
    </ContentSection>
  );
}

const displayItems = [
  "Recents",
  "Home",
  "Applications",
  "Desktop",
  "Downloads",
  "Documents",
];

export function DisplaySettings() {
  const [selected, setSelected] = useState(["Recents", "Home"]);
  const [saved, setSaved] = useState(false);

  return (
    <ContentSection
      title="Display"
      description="Turn items on or off to control what's displayed in the app."
    >
      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <div>
          <Label className="text-base">Sidebar</Label>
          <p className="text-muted-foreground mb-4 text-sm">
            Select the items you want to display in the sidebar.
          </p>
          <div className="space-y-3">
            {displayItems.map((item) => (
              <Label key={item} className="flex items-center gap-2 font-normal">
                <Checkbox
                  checked={selected.includes(item)}
                  onCheckedChange={(checked) =>
                    setSelected((current) =>
                      checked
                        ? [...current, item]
                        : current.filter((value) => value !== item),
                    )
                  }
                />
                {item}
              </Label>
            ))}
          </div>
        </div>
        <FormNotice visible={saved} />
        <Button type="submit" disabled={selected.length === 0}>
          Update display
        </Button>
      </form>
    </ContentSection>
  );
}
