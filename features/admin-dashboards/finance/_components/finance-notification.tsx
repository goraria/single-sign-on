import { TrendingUp } from "@gorth/primitive/cores/lucide"

import { Button } from "@gorth/primitive/custom/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@gorth/primitive/default/item"

export function FinanceNotification() {
  return (
    <Item className="rounded-xl" variant="outline">
      <ItemMedia variant="icon">
        <TrendingUp />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Credit score updated</ItemTitle>
        <ItemDescription>
          Your score increased by 14 points to 782.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline">
          View details
        </Button>
      </ItemActions>
    </Item>
  )
}
