import { randomBytes } from "crypto"
import { formatCodeDate } from "@/lib/utils/temp"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const CODE_PREFIX = "GORTH"
const CODE_RANDOM_LENGTH = 8
const ORDER_TYPE_SUFFIX: Record<string, string> = {
  dineIn: "T",
  takeaway: "A",
  delivery: "D",
  grocery: "G",
}

export const WAREHOUSE_TYPE_PREFIX = {
  issue: "I",
  receipt: "E",
  transfer: "S",
} as const

function generateRandomCodePart() {
  return Array.from(
    randomBytes(CODE_RANDOM_LENGTH),
    (byte) => ALPHABET[byte % ALPHABET.length]
  ).join("")
}

export function generateOrderCode(orderType: string) {
  const suffix = ORDER_TYPE_SUFFIX[orderType]
  if (!suffix) {
    throw new Error("Unsupported order type: " + orderType)
  }

  return CODE_PREFIX + formatCodeDate(new Date()) + generateRandomCodePart() + suffix
}

export function generateWarehouseCode(warehouseType: keyof typeof WAREHOUSE_TYPE_PREFIX) {
  const suffix = WAREHOUSE_TYPE_PREFIX[warehouseType]
  if (!suffix) {
    throw new Error("Unsupported warehouse type: " + warehouseType)
  }

  return CODE_PREFIX + formatCodeDate(new Date()) + generateRandomCodePart() + suffix
}

export function generateReceiptCode() {
  return generateWarehouseCode("receipt")
}

export function generateIssueCode() {
  return generateWarehouseCode("issue")
}

export function normalizeBalanceDate(date: Date) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

export function getIssueTransactionType(purpose: string) {
  switch (purpose) {
    case "waste":
      return "waste"
    case "adjustment":
      return "adjustment"
    case "transfer":
      return "transfer"
    default:
      return "usage"
  }
}

export function computeItemPricing(
  quantity: number,
  unitPrice?: number | null,
  totalPrice?: number | null
) {
  const safeQuantity = Number(quantity ?? 0)
  const safeUnitPrice = Number(unitPrice ?? 0)
  const safeTotalPrice =
    totalPrice !== undefined && totalPrice !== null
      ? Number(totalPrice)
      : safeQuantity * safeUnitPrice

  return {
    quantity: safeQuantity,
    unitPrice: safeUnitPrice,
    totalPrice: safeTotalPrice,
  }
}
