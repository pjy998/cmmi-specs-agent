import { logger } from '../utils/logger.js';

/**
 * Error Handler - Centralized error handling and response formatting
 */
export class ErrorHandler {
  /**
   * Handle tool execution errors
   */
  static handleToolError(toolName: string, error: unknown): any {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error(`Tool execution error for ${toolName}:`, {
      toolName,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Error executing ${toolName}: ${errorMessage}`
        }
      ],
      isError: true
    };
  }

  /**
   * Handle general server errors
   */
  static handleServerError(operation: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error(`Server error during ${operation}:`, {
      operation,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  /**
   * Format successful tool response
   */
  static formatSuccessResponse(toolName: string, result: any): any {
    const resultString = JSON.stringify(result, null, 2);
    
    logger.info(`✅ Tool executed successfully: ${toolName}`, { 
      success: true,
      resultSize: resultString.length 
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: resultString
        }
      ]
    };
  }

  /**
   * Setup global error handlers
   */
  static setupGlobalHandlers(): void {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}
