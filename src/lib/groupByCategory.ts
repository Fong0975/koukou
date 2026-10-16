import type { CategoryDto, SubscriptionDto } from "@/types/dto";

/** Subscriptions sharing one category. */
export interface CategoryGroup {
  category: CategoryDto;
  items: SubscriptionDto[];
}

/**
 * Groups subscriptions under their categories.
 *
 * @param items - The subscriptions.
 * @returns Groups in the categories' configured order (then by id), each sorted by subscription name.
 *   Categories without subscriptions are left out.
 */
export function groupByCategory(items: SubscriptionDto[]): CategoryGroup[] {
  const groups = new Map<number, CategoryGroup>();
  for (const item of items) {
    const group = groups.get(item.category.id) ?? { category: item.category, items: [] };
    group.items.push(item);
    groups.set(item.category.id, group);
  }

  return [...groups.values()]
    .sort((a, b) => a.category.sortOrder - b.category.sortOrder || a.category.id - b.category.id)
    .map(({ category, items: grouped }) => ({
      category,
      items: [...grouped].sort((a, b) => a.name.localeCompare(b.name)),
    }));
}
