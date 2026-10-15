import { expect, it } from "vitest"
import { Clapperboard, SatelliteDish, LibraryBig, ListTodo, Store, MessageCircle } from "@gorth/primitive/cores/lucide"
import { authOrbitData } from "@/utils/constant"

it("uses each app's canonical name, Lucide icon and professional background in the orbit", () => {
  expect(authOrbitData.navSecondary).toEqual([
    { title: "GorCer", url: "", icon: MessageCircle, description: "var(--professional-main)" },
    { title: "GorBox", url: "", icon: Clapperboard, description: "var(--professional-primary-4)" },
    { title: "GorDex", url: "", icon: LibraryBig, description: "var(--professional-primary-2)" },
    { title: "GorMea", url: "", icon: SatelliteDish, description: "var(--professional-primary-5)" },
    { title: "GorTou", url: "", icon: ListTodo, description: "var(--professional-primary-3)" },
    { title: "GorSop", url: "", icon: Store, description: "var(--professional-primary-1)" },
  ])
})
