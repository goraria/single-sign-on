"use client"

import { useEffect, useState } from "react"
import type { PaginationState } from "@gorth/primitive/cores/tanstack/table"

export function useAdminTable() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPagination((current) =>
        current.pageIndex === 0 ? current : { ...current, pageIndex: 0 }
      )
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])
  function resetPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }
  return {
    pagination,
    setPagination,
    searchInput,
    setSearchInput,
    search,
    resetPage,
  }
}
