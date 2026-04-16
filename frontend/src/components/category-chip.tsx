import { cn } from "@/lib/utils"

type CategoryChipProps = {
  /** Category display name */
  categoryName: string
  /** Optional click handler for inline edit trigger */
  onClick?: () => void
}

/**
 * Small category label chip displayed on todo items in non-"All" views.
 *
 * Style: caption size, subtle background, muted text, 4px border-radius, 4px 8px padding.
 * Renders nothing when no category is assigned (parent should not render this component
 * for uncategorized todos).
 *
 * NOTE: This component will not be rendered until Epic 7 (ViewSwitcher).
 * Created now so it is ready for integration.
 */
export function CategoryChip({ categoryName, onClick }: CategoryChipProps) {
  if (!categoryName) return null

  const Element = onClick ? "button" : "span"

  return (
    <Element
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-[4px] bg-muted px-2 py-0.5",
        "text-caption text-muted-foreground",
        onClick && "cursor-pointer hover:bg-accent transition-colors"
      )}
      {...(onClick && { "aria-label": `Change category: ${categoryName}` })}
    >
      {categoryName}
    </Element>
  )
}
