/**
 * Role-Based Permission Service
 * Handles user roles, permissions, and access control
 */

export type UserRole = 'sales' | 'admin' | 'office' | 'viewer';

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  discountLimit: number; // Percentage
  priceOverride: boolean;
  canApprove: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canEditConfig: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLogin?: Date;
}

export interface PriceOverride {
  originalPrice: number;
  newPrice: number;
  discount: number;
  reason: string;
  approvedBy?: string;
  timestamp: number;
}

class PermissionService {
  private currentUser: User | null = null;
  private rolePermissions: Map<UserRole, RolePermissions> = new Map();

  constructor() {
    this.initializeRoles();
  }

  /**
   * Initialize default role permissions
   */
  private initializeRoles(): void {
    // Sales Role - Limited discounting, basic access
    this.rolePermissions.set('sales', {
      role: 'sales',
      permissions: [
        { action: 'create', resource: 'estimate' },
        { action: 'read', resource: 'estimate', conditions: { owner: 'self' } },
        {
          action: 'update',
          resource: 'estimate',
          conditions: { owner: 'self' },
        },
        { action: 'capture', resource: 'photo' },
        { action: 'read', resource: 'customer' },
        { action: 'create', resource: 'customer' },
      ],
      discountLimit: 5, // 5% maximum discount
      priceOverride: false,
      canApprove: false,
      canViewReports: false,
      canManageUsers: false,
      canEditConfig: false,
    });

    // Admin Role - Full system control
    this.rolePermissions.set('admin', {
      role: 'admin',
      permissions: [
        { action: '*', resource: '*' }, // Full access
      ],
      discountLimit: 100, // No limit
      priceOverride: true,
      canApprove: true,
      canViewReports: true,
      canManageUsers: true,
      canEditConfig: true,
    });

    // Office Role - Review and edit access
    this.rolePermissions.set('office', {
      role: 'office',
      permissions: [
        { action: 'create', resource: 'estimate' },
        { action: 'read', resource: 'estimate' },
        { action: 'update', resource: 'estimate' },
        { action: 'delete', resource: 'estimate' },
        { action: 'read', resource: 'customer' },
        { action: 'update', resource: 'customer' },
        { action: 'create', resource: 'customer' },
        { action: 'read', resource: 'report' },
        { action: 'approve', resource: 'discount' },
      ],
      discountLimit: 20, // 20% maximum discount
      priceOverride: true,
      canApprove: true,
      canViewReports: true,
      canManageUsers: false,
      canEditConfig: false,
    });

    // Viewer Role - Read-only access
    this.rolePermissions.set('viewer', {
      role: 'viewer',
      permissions: [
        { action: 'read', resource: 'estimate' },
        { action: 'read', resource: 'customer' },
        { action: 'read', resource: 'report' },
      ],
      discountLimit: 0, // No discounting
      priceOverride: false,
      canApprove: false,
      canViewReports: true,
      canManageUsers: false,
      canEditConfig: false,
    });
  }

  /**
   * Set current user
   */
  public setCurrentUser(user: User): void {
    this.currentUser = user;
    console.log('PermissionService: Current user set:', user.name, user.role);
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user has permission for action on resource
   */
  public hasPermission(
    action: string,
    resource: string,
    context?: Record<string, any>
  ): boolean {
    if (!this.currentUser) {
      return false;
    }

    const rolePerms = this.rolePermissions.get(this.currentUser.role);
    if (!rolePerms) {
      return false;
    }

    // Check for wildcard permissions (admin)
    const hasWildcard = rolePerms.permissions.some(
      perm => perm.action === '*' && perm.resource === '*'
    );
    if (hasWildcard) {
      return true;
    }

    // Check specific permissions
    return rolePerms.permissions.some(perm => {
      const actionMatch = perm.action === action || perm.action === '*';
      const resourceMatch = perm.resource === resource || perm.resource === '*';

      if (!actionMatch || !resourceMatch) {
        return false;
      }

      // Check conditions if present
      if (perm.conditions && context) {
        return this.checkConditions(perm.conditions, context);
      }

      return true;
    });
  }

  /**
   * Check permission conditions
   */
  private checkConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (key === 'owner' && value === 'self') {
        // Check if user owns the resource
        if (context.ownerId !== this.currentUser?.id) {
          return false;
        }
      } else if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get maximum discount percentage for current user
   */
  public getMaxDiscountPercent(): number {
    if (!this.currentUser) {
      return 0;
    }

    const rolePerms = this.rolePermissions.get(this.currentUser.role);
    return rolePerms?.discountLimit || 0;
  }

  /**
   * Check if user can override prices
   */
  public canOverridePrices(): boolean {
    if (!this.currentUser) {
      return false;
    }

    const rolePerms = this.rolePermissions.get(this.currentUser.role);
    return rolePerms?.priceOverride || false;
  }

  /**
   * Validate price override
   */
  public validatePriceOverride(override: PriceOverride): {
    valid: boolean;
    requiresApproval: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    let requiresApproval = false;

    if (!this.currentUser) {
      errors.push('User not authenticated');
      return { valid: false, requiresApproval: false, errors };
    }

    const maxDiscount = this.getMaxDiscountPercent();

    if (override.discount > maxDiscount) {
      if (this.canApproveDiscounts()) {
        requiresApproval = true;
      } else {
        errors.push(
          `Discount of ${override.discount}% exceeds maximum allowed (${maxDiscount}%)`
        );
      }
    }

    if (
      !this.canOverridePrices() &&
      override.newPrice !== override.originalPrice
    ) {
      errors.push('User not authorized to override prices');
    }

    if (!override.reason || override.reason.trim().length < 10) {
      errors.push('Price override reason must be at least 10 characters');
    }

    return {
      valid: errors.length === 0,
      requiresApproval,
      errors,
    };
  }

  /**
   * Check if user can approve discounts
   */
  public canApproveDiscounts(): boolean {
    if (!this.currentUser) {
      return false;
    }

    const rolePerms = this.rolePermissions.get(this.currentUser.role);
    return rolePerms?.canApprove || false;
  }

  /**
   * Log price override for audit trail
   */
  public logPriceOverride(override: PriceOverride, estimateId: string): void {
    const logEntry = {
      timestamp: Date.now(),
      userId: this.currentUser?.id,
      userName: this.currentUser?.name,
      userRole: this.currentUser?.role,
      estimateId,
      override,
      approved: override.approvedBy !== undefined,
    };

    // Store in IndexedDB or send to server
    console.log('PermissionService: Price override logged:', logEntry);

    // In a real implementation, this would be stored persistently
    const auditLog = JSON.parse(
      localStorage.getItem('price_override_audit') || '[]'
    );
    auditLog.push(logEntry);
    localStorage.setItem('price_override_audit', JSON.stringify(auditLog));
  }

  /**
   * Get audit log for price overrides
   */
  public getAuditLog(): any[] {
    if (!this.hasPermission('read', 'audit')) {
      return [];
    }

    return JSON.parse(localStorage.getItem('price_override_audit') || '[]');
  }

  /**
   * Check if user can manage other users
   */
  public canManageUsers(): boolean {
    if (!this.currentUser) {
      return false;
    }

    const rolePerms = this.rolePermissions.get(this.currentUser.role);
    return rolePerms?.canManageUsers || false;
  }

  /**
   * Check if user can edit configuration
   */
  public canEditConfig(): boolean {
    if (!this.currentUser) {
      return false;
    }

    const rolePerms = this.rolePermissions.get(this.currentUser.role);
    return rolePerms?.canEditConfig || false;
  }

  /**
   * Get role permissions
   */
  public getRolePermissions(role: UserRole): RolePermissions | undefined {
    return this.rolePermissions.get(role);
  }

  /**
   * Get all available roles
   */
  public getAvailableRoles(): UserRole[] {
    return Array.from(this.rolePermissions.keys());
  }

  /**
   * Create permission guard for UI components
   */
  public createPermissionGuard(action: string, resource: string) {
    return {
      canAccess: (context?: Record<string, any>) =>
        this.hasPermission(action, resource, context),
      role: this.currentUser?.role,
      user: this.currentUser,
    };
  }

  /**
   * Format role name for display
   */
  public formatRoleName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
      sales: 'Sales Representative',
      admin: 'Administrator',
      office: 'Office Manager',
      viewer: 'Viewer',
    };

    return roleNames[role] || role;
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
