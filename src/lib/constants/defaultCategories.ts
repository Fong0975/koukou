/** Shape of a category entry seeded into a fresh database. */
export interface DefaultCategory {
  name: string;
  icon: string;
  sortOrder: number;
}

/** Categories created on first start-up; users can add more later. */
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { name: "網站會員", icon: "🌐", sortOrder: 10 },
  { name: "影音串流", icon: "🎬", sortOrder: 20 },
  { name: "軟體訂閱", icon: "💻", sortOrder: 30 },
  { name: "電信費", icon: "📱", sortOrder: 40 },
  { name: "保險費", icon: "🛡️", sortOrder: 50 },
  { name: "水電瓦斯", icon: "💡", sortOrder: 60 },
  { name: "其他", icon: "📦", sortOrder: 999 },
];
