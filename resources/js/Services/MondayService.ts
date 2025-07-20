/**
 * Monday.com CRM Integration Service
 * Handles lead import, customer data sync, and GDPR-compliant reference generation
 */

export interface MondayLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MondayConfig {
  apiKey: string;
  boardId: string;
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
}

class MondayService {
  private config: MondayConfig | null = null;
  private readonly API_BASE = 'https://api.monday.com/v2';

  /**
   * Initialize Monday.com service with configuration
   */
  public async initialize(config: MondayConfig): Promise<void> {
    this.config = config;
    
    if (config.enabled) {
      try {
        await this.testConnection();
        console.log('Monday.com: Service initialized successfully');
      } catch (error) {
        console.error('Monday.com: Failed to initialize:', error);
        throw error;
      }
    }
  }

  /**
   * Test connection to Monday.com API
   */
  public async testConnection(): Promise<boolean> {
    if (!this.config?.apiKey) {
      throw new Error('Monday.com API key not configured');
    }

    try {
      const query = `
        query {
          me {
            id
            name
            email
          }
        }
      `;

      const response = await this.makeGraphQLRequest(query);
      return response.data?.me?.id !== undefined;
    } catch (error) {
      console.error('Monday.com: Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get leads from Monday.com board
   */
  public async getLeads(limit: number = 50): Promise<MondayLead[]> {
    if (!this.config?.enabled || !this.config?.boardId) {
      return [];
    }

    try {
      const query = `
        query {
          boards(ids: [${this.config.boardId}]) {
            items(limit: ${limit}) {
              id
              name
              column_values {
                id
                text
                value
              }
              created_at
              updated_at
            }
          }
        }
      `;

      const response = await this.makeGraphQLRequest(query);
      const items = response.data?.boards?.[0]?.items || [];

      return items.map((item: any) => this.mapItemToLead(item));
    } catch (error) {
      console.error('Monday.com: Failed to get leads:', error);
      return [];
    }
  }

  /**
   * Search leads by name or email
   */
  public async searchLeads(searchTerm: string): Promise<MondayLead[]> {
    if (!this.config?.enabled || !searchTerm.trim()) {
      return [];
    }

    try {
      const allLeads = await this.getLeads(100);
      const term = searchTerm.toLowerCase();
      
      return allLeads.filter(lead => 
        lead.name.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        lead.phone.includes(term)
      );
    } catch (error) {
      console.error('Monday.com: Search failed:', error);
      return [];
    }
  }

  /**
   * Create new lead in Monday.com
   */
  public async createLead(leadData: Partial<MondayLead>): Promise<string | null> {
    if (!this.config?.enabled || !this.config?.boardId) {
      return null;
    }

    try {
      const mutation = `
        mutation {
          create_item(
            board_id: ${this.config.boardId}
            item_name: "${leadData.name}"
            column_values: "${this.buildColumnValues(leadData)}"
          ) {
            id
          }
        }
      `;

      const response = await this.makeGraphQLRequest(mutation);
      const itemId = response.data?.create_item?.id;
      
      if (itemId) {
        console.log('Monday.com: Lead created successfully:', itemId);
        return itemId;
      }
      
      return null;
    } catch (error) {
      console.error('Monday.com: Failed to create lead:', error);
      return null;
    }
  }

  /**
   * Update lead status
   */
  public async updateLeadStatus(leadId: string, status: string): Promise<boolean> {
    if (!this.config?.enabled) {
      return false;
    }

    try {
      const mutation = `
        mutation {
          change_column_value(
            item_id: ${leadId}
            board_id: ${this.config.boardId}
            column_id: "status"
            value: "${status}"
          ) {
            id
          }
        }
      `;

      const response = await this.makeGraphQLRequest(mutation);
      return response.data?.change_column_value?.id !== undefined;
    } catch (error) {
      console.error('Monday.com: Failed to update lead status:', error);
      return false;
    }
  }

  /**
   * Generate GDPR-compliant reference number
   */
  public generateGDPRReference(leadData: Partial<MondayLead>): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(leadData.email || leadData.phone || leadData.name || '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `EST-${new Date().getFullYear()}-${hash}-${random}`;
  }

  /**
   * Check GDPR compliance for data processing
   */
  public checkGDPRCompliance(leadData: Partial<MondayLead>): {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for required consent
    if (!leadData.email && !leadData.phone) {
      issues.push('No contact method provided');
      recommendations.push('Ensure explicit consent for data processing');
    }

    // Check for data minimization
    if (leadData.notes && leadData.notes.length > 500) {
      recommendations.push('Consider reducing notes to essential information only');
    }

    // Check for purpose limitation
    if (!leadData.source) {
      recommendations.push('Document the source and purpose of data collection');
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Make GraphQL request to Monday.com API
   */
  private async makeGraphQLRequest(query: string): Promise<any> {
    if (!this.config?.apiKey) {
      throw new Error('Monday.com API key not configured');
    }

    const response = await fetch(this.API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.apiKey,
        'API-Version': '2023-10'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`Monday.com API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`Monday.com GraphQL error: ${data.errors[0].message}`);
    }

    return data;
  }

  /**
   * Map Monday.com item to lead object
   */
  private mapItemToLead(item: any): MondayLead {
    const getColumnValue = (columnId: string) => {
      const column = item.column_values.find((col: any) => col.id === columnId);
      return column?.text || '';
    };

    return {
      id: item.id,
      name: item.name,
      email: getColumnValue('email'),
      phone: getColumnValue('phone'),
      address: getColumnValue('address'),
      status: getColumnValue('status'),
      source: getColumnValue('source'),
      notes: getColumnValue('notes'),
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }

  /**
   * Build column values JSON for Monday.com
   */
  private buildColumnValues(leadData: Partial<MondayLead>): string {
    const values: any = {};

    if (leadData.email) values.email = leadData.email;
    if (leadData.phone) values.phone = leadData.phone;
    if (leadData.address) values.address = leadData.address;
    if (leadData.status) values.status = leadData.status;
    if (leadData.source) values.source = leadData.source;
    if (leadData.notes) values.notes = leadData.notes;

    return JSON.stringify(values).replace(/"/g, '\\"');
  }

  /**
   * Simple hash function for reference generation
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 4).toUpperCase();
  }

  /**
   * Get service configuration
   */
  public getConfig(): MondayConfig | null {
    return this.config;
  }

  /**
   * Check if service is enabled
   */
  public isEnabled(): boolean {
    return this.config?.enabled || false;
  }
}

// Export singleton instance
export const mondayService = new MondayService();
