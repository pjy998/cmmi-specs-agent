/**
 * Router Interface - Defines the contract for tool routing
 */
export interface ToolRouter {
  canHandle(toolName: string): boolean;
  handle(toolName: string, args: any): Promise<any>;
}

/**
 * Tool Registry - Manages tool registration and discovery
 */
export class ToolRegistry {
  private routers: Map<string, ToolRouter> = new Map();
  private toolCategories: Map<string, string[]> = new Map();

  /**
   * Register a tool router with category
   */
  registerRouter(category: string, router: ToolRouter, tools: string[]): void {
    this.routers.set(category, router);
    this.toolCategories.set(category, tools);
  }

  /**
   * Get all available tools grouped by category
   */
  getAllTools(): { [category: string]: string[] } {
    const result: { [category: string]: string[] } = {};
    for (const [category, tools] of this.toolCategories.entries()) {
      result[category] = tools;
    }
    return result;
  }

  /**
   * Find the appropriate router for a tool
   */
  getRouterForTool(toolName: string): ToolRouter | null {
    for (const router of this.routers.values()) {
      if (router.canHandle(toolName)) {
        return router;
      }
    }
    return null;
  }

  /**
   * Get total tool count
   */
  getToolCount(): number {
    let count = 0;
    for (const tools of this.toolCategories.values()) {
      count += tools.length;
    }
    return count;
  }
}
