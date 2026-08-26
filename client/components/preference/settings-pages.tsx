"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@gorth/primitive/custom/button"
import { RadioGroup, RadioGroupItem } from "@gorth/primitive/custom/radio"
import { Checkbox } from "@gorth/primitive/default/checkbox"
import { Input } from "@gorth/primitive/default/input"
import { Label } from "@gorth/primitive/default/label"
import { Switch } from "@gorth/primitive/default/switch"
import { Textarea } from "@gorth/primitive/default/textarea"
import { ContentSection } from "./content-section"

function SavedNotice({ visible }: { visible: boolean }) {
  return visible ? (
    <p className="text-sm text-emerald-600">Preferences updated.</p>
  ) : null
}

export function ProfileSettings() {
  const [urls, setUrls] = useState([
    "https://shadcn.com",
    "http://twitter.com/shadcn",
  ])
  const [saved, setSaved] = useState(false)

  return (
    <ContentSection
      title="Profile"
      description="This is how others will see you on the site."
    >
      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault()
          setSaved(true)
        }}
      >
        <Field
          label="Username"
          description="This is your public display name. It can be your real name or a pseudonym. You can only change this once every 30 days."
        >
          <Input placeholder="shadcn" defaultValue="japtor" />
        </Field>
        <Field
          label="Email"
          description={
            <>
              You can manage verified email addresses in your{" "}
              <Link href="/settings/account" className="underline">
                email settings
              </Link>
              .
            </>
          }
        >
          <select className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm">
            <option>m@example.com</option>
            <option>m@google.com</option>
            <option>m@support.com</option>
          </select>
        </Field>
        <Field
          label="Bio"
          description="You can @mention other users and organizations to link to them."
        >
          <Textarea
            defaultValue="I own a computer."
            placeholder="Tell us a little bit about yourself"
            className="resize-none"
          />
        </Field>
        <div>
          <Label>URLs</Label>
          <p className="text-muted-foreground mb-2 text-sm">
            Add links to your website, blog, or social media profiles.
          </p>
          <div className="space-y-1.5">
            {urls.map((url, index) => (
              <Input
                key={index}
                value={url}
                onChange={(event) =>
                  setUrls((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item
                    )
                  )
                }
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={() => setUrls((current) => [...current, ""])}
          >
            Add URL
          </Button>
        </div>
        <SavedNotice visible={saved} />
        <Button type="submit">Update profile</Button>
      </form>
    </ContentSection>
  )
}

export function AccountSettings() {
  const [saved, setSaved] = useState(false)

  return (
    <ContentSection
      title="Account"
      description="Update your account settings. Set your preferred language and timezone."
    >
      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault()
          setSaved(true)
        }}
      >
        <Field
          label="Name"
          description="This is the name that will be displayed on your profile and in emails."
        >
          <Input placeholder="Your name" defaultValue="Japtor" />
        </Field>
        <Field
          label="Date of birth"
          description="Your date of birth is used to calculate your age."
        >
          <Input type="date" className="w-60" />
        </Field>
        <Field
          label="Language"
          description="This is the language that will be used in the dashboard."
        >
          <select className="border-input bg-background h-9 w-50 rounded-md border px-3 text-sm">
            <option value="">Select language</option>
            {[
              "English",
              "French",
              "German",
              "Spanish",
              "Portuguese",
              "Russian",
              "Japanese",
              "Korean",
              "Chinese",
            ].map((language) => (
              <option key={language}>{language}</option>
            ))}
          </select>
        </Field>
        <SavedNotice visible={saved} />
        <Button type="submit">Update account</Button>
      </form>
    </ContentSection>
  )
}

export function AppearanceSettings() {
  const { resolvedTheme, setTheme } = useTheme()
  const [theme, setSelectedTheme] = useState(
    resolvedTheme === "dark" ? "dark" : "light"
  )
  const [font, setFont] = useState("inter")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTheme(theme)
    document.documentElement.dataset.font = font
  }

  return (
    <ContentSection
      title="Appearance"
      description="Customize the appearance of the app. Automatically switch between day and night themes."
    >
      <form onSubmit={submit} className="space-y-8">
        <Field
          label="Font"
          description="Set the font you want to use in the dashboard."
        >
          <select
            value={font}
            onChange={(event) => setFont(event.target.value)}
            className="border-input bg-background h-9 w-50 rounded-md border px-3 text-sm capitalize"
          >
            <option value="inter">Inter</option>
            <option value="manrope">Manrope</option>
            <option value="system">System</option>
          </select>
        </Field>
        <div className="space-y-2">
          <Label>Theme</Label>
          <p className="text-muted-foreground text-sm">
            Select the theme for the dashboard.
          </p>
          <RadioGroup
            value={theme}
            onValueChange={(value) => setSelectedTheme(String(value))}
            className="grid max-w-md grid-cols-2 gap-8 pt-2"
          >
            <ThemePreview
              value="light"
              title="Light"
              active={theme === "light"}
            />
            <ThemePreview value="dark" title="Dark" active={theme === "dark"} />
          </RadioGroup>
        </div>
        <Button type="submit">Update preferences</Button>
      </form>
    </ContentSection>
  )
}

export function NotificationSettings() {
  const [type, setType] = useState("all")
  const [settings, setSettings] = useState({
    communication: false,
    marketing: false,
    social: true,
    mobile: false,
  })

  return (
    <ContentSection
      title="Notifications"
      description="Configure how you receive notifications."
    >
      <form className="space-y-8" onSubmit={(event) => event.preventDefault()}>
        <div className="space-y-3">
          <Label>Notify me about...</Label>
          <RadioGroup
            value={type}
            onValueChange={(value) => setType(String(value))}
            className="flex flex-col gap-2"
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
        <div>
          <h3 className="mb-4 text-lg font-medium">Email Notifications</h3>
          <div className="space-y-4">
            {[
              [
                "communication",
                "Communication emails",
                "Receive emails about your account activity.",
              ],
              [
                "marketing",
                "Marketing emails",
                "Receive emails about new products, features, and more.",
              ],
              [
                "social",
                "Social emails",
                "Receive emails for friend requests, follows, and more.",
              ],
            ].map(([key, title, description]) => (
              <ToggleCard
                key={key}
                title={title}
                description={description}
                checked={settings[key as keyof typeof settings]}
                onCheckedChange={(checked) =>
                  setSettings((current) => ({ ...current, [key]: checked }))
                }
              />
            ))}
            <ToggleCard
              title="Security emails"
              description="Receive emails about your account activity and security."
              checked
              disabled
            />
          </div>
        </div>
        <Label className="flex items-start gap-2 font-normal">
          <Checkbox
            checked={settings.mobile}
            onCheckedChange={(checked) =>
              setSettings((current) => ({
                ...current,
                mobile: Boolean(checked),
              }))
            }
          />
          <span>
            Use different settings for my mobile devices
            <span className="text-muted-foreground mt-1 block text-sm">
              You can manage your mobile notifications in the mobile settings
              page.
            </span>
          </span>
        </Label>
        <Button type="submit">Update notifications</Button>
      </form>
    </ContentSection>
  )
}

const displayItems = [
  "Recents",
  "Home",
  "Applications",
  "Desktop",
  "Downloads",
  "Documents",
]

export function DisplaySettings() {
  const [selected, setSelected] = useState(["Recents", "Home"])

  return (
    <ContentSection
      title="Display"
      description="Turn items on or off to control what's displayed in the app."
    >
      <form className="space-y-8" onSubmit={(event) => event.preventDefault()}>
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
                        : current.filter((value) => value !== item)
                    )
                  }
                />
                {item}
              </Label>
            ))}
          </div>
        </div>
        <Button type="submit">Update display</Button>
      </form>
    </ContentSection>
  )
}

function Field({
  label,
  description,
  children,
}: {
  label: string
  description: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

function ThemePreview({
  value,
  title,
  active,
}: {
  value: string
  title: string
  active: boolean
}) {
  const dark = value === "dark"
  return (
    <Label className="cursor-pointer">
      <RadioGroupItem value={value} className="sr-only" />
      <div
        className={`rounded-md border-2 p-1 ${active ? "border-primary" : "border-muted"}`}
      >
        <div
          className={`space-y-2 rounded-sm p-2 ${dark ? "bg-slate-950" : "bg-[#ecedef]"}`}
        >
          <div
            className={`space-y-2 rounded-md p-2 shadow-xs ${dark ? "bg-slate-800" : "bg-white"}`}
          >
            <div
              className={`h-2 w-20 rounded-lg ${dark ? "bg-slate-400" : "bg-[#ecedef]"}`}
            />
            <div
              className={`h-2 w-25 rounded-lg ${dark ? "bg-slate-400" : "bg-[#ecedef]"}`}
            />
          </div>
          {[0, 1].map((item) => (
            <div
              key={item}
              className={`flex items-center space-x-2 rounded-md p-2 shadow-xs ${dark ? "bg-slate-800" : "bg-white"}`}
            >
              <div
                className={`size-4 rounded-full ${dark ? "bg-slate-400" : "bg-[#ecedef]"}`}
              />
              <div
                className={`h-2 w-25 rounded-lg ${dark ? "bg-slate-400" : "bg-[#ecedef]"}`}
              />
            </div>
          ))}
        </div>
      </div>
      <span className="block w-full p-2 text-center font-normal">{title}</span>
    </Label>
  )
}

function ToggleCard({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label className="text-base">{title}</Label>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  )
}
