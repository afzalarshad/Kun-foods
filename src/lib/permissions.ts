export const PERMISSIONS = [
  "customers.view",
  "customers.edit",
  "customers.export",
  "customers.delete",
  "orders.view",
  "orders.edit",
  "orders.cancel",
  "orders.refund",
  "payments.view",
  "payments.manage",
  "products.view",
  "products.manage",
  "products.export",
  "inventory.view",
  "inventory.adjust",
  "warehouses.manage",
  "promotions.manage",
  "shipping.manage",
  "support.manage",
  "warehouse.pick",
  "warehouse.pack",
  "reports.view",
  "reports.financial",
  "audit.view",
  "import_export.manage",
  "users.manage",
  "pos.operate",
  "settings.manage",
  "content.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Role -> permission set. "admin" always has every permission (super admin).
 * Roles are plain strings (AdminUser.role) rather than a hard DB enum, so new
 * roles can be introduced here without a migration.
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [...PERMISSIONS],
  manager: [
    "customers.view", "customers.edit", "customers.export",
    "orders.view", "orders.edit", "orders.cancel", "orders.refund",
    "payments.view",
    "products.view", "products.manage", "products.export",
    "inventory.view", "inventory.adjust", "warehouses.manage",
    "promotions.manage", "shipping.manage", "support.manage",
    "warehouse.pick", "warehouse.pack",
    "reports.view", "reports.financial",
    "import_export.manage", "pos.operate", "content.manage",
  ],
  sales: [
    "customers.view", "customers.edit",
    "orders.view", "orders.edit", "orders.cancel",
    "products.view", "reports.view", "pos.operate",
  ],
  support: [
    "customers.view", "customers.edit",
    "orders.view", "support.manage", "reports.view",
  ],
  warehouse_manager: [
    "inventory.view", "inventory.adjust", "warehouses.manage",
    "warehouse.pick", "warehouse.pack",
    "orders.view", "products.view", "shipping.manage", "reports.view",
  ],
  picker: ["warehouse.pick", "orders.view", "products.view"],
  packer: ["warehouse.pack", "orders.view", "products.view"],
  inventory_manager: [
    "inventory.view", "inventory.adjust", "warehouses.manage",
    "products.view", "products.manage", "products.export",
    "reports.view", "import_export.manage",
  ],
  accountant: [
    "payments.view", "payments.manage",
    "reports.view", "reports.financial",
    "orders.view", "customers.view",
  ],
  marketing: ["promotions.manage", "customers.view", "customers.export", "reports.view", "content.manage"],
  pos_operator: ["pos.operate", "customers.view", "customers.edit", "products.view"],
  read_only: ["customers.view", "orders.view", "products.view", "inventory.view", "reports.view"],
  // legacy roles from before the granular permission system
  staff: [
    "customers.view", "customers.edit", "customers.export",
    "orders.view", "orders.edit", "orders.cancel", "orders.refund",
    "payments.view", "payments.manage",
    "products.view", "products.manage", "products.export",
    "inventory.view", "inventory.adjust", "warehouses.manage",
    "promotions.manage", "shipping.manage", "support.manage",
    "warehouse.pick", "warehouse.pack",
    "reports.view", "import_export.manage", "pos.operate", "content.manage",
  ],
  pos: ["pos.operate", "customers.view", "customers.edit", "products.view"],
};

/** Short labels for compact UI (sidebar badge). Longer descriptions live inline in the role dropdown. */
export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  sales: "Sales",
  support: "Support",
  warehouse_manager: "Warehouse Mgr",
  picker: "Picker",
  packer: "Packer",
  inventory_manager: "Inventory Mgr",
  accountant: "Accountant",
  marketing: "Marketing",
  pos_operator: "POS Operator",
  read_only: "Read Only",
  staff: "Staff",
  pos: "POS",
};

/** Roles confined to a single admin section, matching the old pos-role behavior. */
export const CONFINED_ROLES: Record<string, string> = {
  pos: "/admin/pos",
  pos_operator: "/admin/pos",
  picker: "/admin/warehouse",
  packer: "/admin/warehouse",
};

export function hasPermission(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
