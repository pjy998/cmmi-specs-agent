/**
 * File Operations Module for MCP Multi-Agent System
 * Provides actual file I/O capabilities for document auto-landing
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger.js';

export interface FileOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  path?: string;
}

export interface DirectoryStructure {
  projectPath: string;
  featureName: string;
  createDocs: boolean;
  createSrc: boolean;
  createTests: boolean;
}

export class FileOperations {
  
  /**
   * Create a file with content
   */
  static async createFile(filePath: string, content: string): Promise<FileOperationResult> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }

      // Write file
      fs.writeFileSync(filePath, content, 'utf8');
      logger.info(`Created file: ${filePath}`);

      return {
        success: true,
        message: `File created successfully: ${filePath}`,
        path: filePath
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error creating file ${filePath}:`, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Create directory structure
   */
  static async createDirectory(dirPath: string): Promise<FileOperationResult> {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`Created directory: ${dirPath}`);
      }

      return {
        success: true,
        message: `Directory created successfully: ${dirPath}`,
        path: dirPath
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error creating directory ${dirPath}:`, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Resolve absolute path from base and relative paths
   */
  static resolvePath(basePath: string, relativePath: string): string {
    return path.resolve(basePath, relativePath);
  }

  /**
   * Check if file or directory exists
   */
  static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Create standardized CMMI project structure
   */
  static async createCmmiStructure(structure: DirectoryStructure): Promise<FileOperationResult> {
    try {
      const { projectPath, featureName, createDocs, createSrc, createTests } = structure;

      // Create base project structure
      await this.createDirectory(projectPath);
      
      // 只创建正确的目录结构：docs/feature/ 而不是 feature/docs/
      if (createDocs) {
        const projectDocsDir = path.join(projectPath, 'docs');
        await this.createDirectory(projectDocsDir);
        
        // 为特定功能创建文档目录
        const featureDocsDir = path.join(projectDocsDir, featureName);
        await this.createDirectory(featureDocsDir);
      }
      
      // 如果需要，可以创建项目级的src和tests目录
      if (createSrc) {
        await this.createDirectory(path.join(projectPath, 'src'));
      }
      
      if (createTests) {
        await this.createDirectory(path.join(projectPath, 'tests'));
      }

      logger.info(`Created CMMI structure for feature: ${featureName}`);

      return {
        success: true,
        message: `CMMI structure created for feature: ${featureName}`,
        path: projectPath
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating CMMI structure:', error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Add CMMI header to document content
   */
  static addCmmiHeader(content: string, processArea: string): string {
    const header = `<!-- CMMI: ${processArea} -->\n<!-- Generated: ${new Date().toISOString()} -->\n\n`;
    return header + content;
  }

  /**
   * Create CMMI document with proper header
   */
  static async createCmmiDocument(
    filePath: string, 
    content: string, 
    processArea: string
  ): Promise<FileOperationResult> {
    const contentWithHeader = this.addCmmiHeader(content, processArea);
    return await this.createFile(filePath, contentWithHeader);
  }

  /**
   * Backup existing file before overwriting
   */
  static async backupFile(filePath: string): Promise<string | null> {
    if (!this.exists(filePath)) {
      return null;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.backup.${timestamp}`;
      
      const content = fs.readFileSync(filePath, 'utf8');
      fs.writeFileSync(backupPath, content, 'utf8');
      
      logger.info(`Backed up file: ${filePath} -> ${backupPath}`);
      return backupPath;
    } catch (error) {
      logger.error(`Error backing up file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * List files in directory with filtering
   */
  static listFiles(dirPath: string, extension?: string): string[] {
    try {
      if (!this.exists(dirPath)) {
        return [];
      }

      const files = fs.readdirSync(dirPath);
      
      if (extension) {
        return files.filter(file => file.endsWith(extension));
      }
      
      return files;
    } catch (error) {
      logger.error(`Error listing files in ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * Read file content
   */
  static readFile(filePath: string): string | null {
    try {
      if (!this.exists(filePath)) {
        return null;
      }
      
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      logger.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Get file stats
   */
  static getFileStats(filePath: string): fs.Stats | null {
    try {
      if (!this.exists(filePath)) {
        return null;
      }
      
      return fs.statSync(filePath);
    } catch (error) {
      logger.error(`Error getting stats for ${filePath}:`, error);
      return null;
    }
  }
}

/**
 * Document Templates for different CMMI process areas
 */
export class DocumentTemplates {
  
  static requirements(featureName: string, userInput: string): string {
    // Always generate English template for intelligent translation
    return `<!-- CMMI: RD -->
<!-- Generated: ${new Date().toISOString()} -->

# Requirements Document: ${featureName}

## Project Overview

${userInput}

## Functional Requirements

Based on task analysis, the main functional requirements include:

### Core Feature Modules

1. **User Management**
   - User registration and authentication
   - Permission management
   - Profile management

2. **Business Logic**
   - Data processing and storage
   - Business rule implementation
   - State management

3. **User Interface**
   - User interface design
   - Responsive layout
   - Interaction optimization

## Non-Functional Requirements

### Performance Requirements
- Page load time < 3 seconds
- Support 100+ concurrent users
- Database query response time < 1 second

### Security Requirements
- User authentication
- Data encryption in transit
- Input validation
- Access control mechanisms

### Availability Requirements
- System availability > 99%
- Support for major browsers
- Mobile compatibility

## Acceptance Criteria

- [ ] All core features working properly
- [ ] Performance targets met
- [ ] Security testing passed
- [ ] Good user experience
- [ ] Complete documentation

---

*Generated by requirements-agent*
`;
  }

  static design(featureName: string, requirementsPath?: string): string {
    return `<!-- CMMI: TS -->
<!-- Generated: ${new Date().toISOString()} -->

# Design Document: ${featureName}

## Architecture Overview

### System Architecture
This system adopts a layered architecture design with the following main layers:

\`\`\`
+-----------------------------------+
|       Presentation Layer         |  <- User Interface Layer
+-----------------------------------+
|       Business Logic Layer       |  <- Business Logic Layer
+-----------------------------------+
|       Data Access Layer          |  <- Data Access Layer
+-----------------------------------+
|       Database Layer             |  <- Database Layer
+-----------------------------------+
\`\`\`

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript/TypeScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL/MongoDB
- **Authentication**: JWT Token
- **Testing**: Jest, Cypress

## Module Design

### 1. User Management Module
**Function**: Handle user registration, login, and permission management

**Core Components**:
- UserController: User operation controller
- AuthService: Authentication service
- UserModel: User data model

**Interface Design**:
\`\`\`typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  register(userData: RegisterData): Promise<User>;
  validateToken(token: string): Promise<boolean>;
}
\`\`\`

### 2. Business Logic Module
**Function**: Core business processing and data management

**Core Components**:
- BusinessController: Business logic controller
- DataService: Data processing service
- ValidationService: Data validation service

### 3. Data Persistence Module
**Function**: Data storage and retrieval

**Core Components**:
- DatabaseManager: Database connection management
- Repository: Data access objects
- Migration: Database version control

## Security Design

### Authentication Mechanism
- JWT token authentication
- Password encryption storage
- Session timeout control

### Permission Control
- Role-based access control (RBAC)
- API interface permission verification
- Frontend route protection

## Performance Considerations

### Optimization Strategy
- Database index optimization
- Cache mechanism design
- Asynchronous processing mechanism
- Code splitting and lazy loading

### Scalability Design
- Microservice architecture support
- Load balancing considerations
- Database sharding preparation

---
*Generated by design-agent*
${requirementsPath ? `*Based on requirements: ${requirementsPath}*` : ''}
`;
  }

  static tasks(featureName: string, designPath?: string): string {
    return `# Task Management: ${featureName}

## Project Overview
- **Feature**: ${featureName}
- **Status**: Planning
- **Start Date**: ${new Date().toISOString().split('T')[0]}
- **Target Completion**: [To be determined]

## Task Breakdown

### Phase 1: Setup and Infrastructure
- [ ] **Task 1.1**: Environment setup
  - Priority: High
  - Estimated effort: 2 hours
  - Dependencies: None
  - Assignee: [TBD]

- [ ] **Task 1.2**: Database schema creation
  - Priority: High
  - Estimated effort: 4 hours
  - Dependencies: Task 1.1
  - Assignee: [TBD]

### Phase 2: Core Implementation
- [ ] **Task 2.1**: Backend API development
  - Priority: High
  - Estimated effort: 16 hours
  - Dependencies: Task 1.2
  - Assignee: [TBD]

- [ ] **Task 2.2**: Frontend components
  - Priority: Medium
  - Estimated effort: 12 hours
  - Dependencies: Task 2.1
  - Assignee: [TBD]

### Phase 3: Integration and Testing
- [ ] **Task 3.1**: API integration
  - Priority: High
  - Estimated effort: 8 hours
  - Dependencies: Task 2.1, 2.2
  - Assignee: [TBD]

- [ ] **Task 3.2**: Unit testing
  - Priority: High
  - Estimated effort: 10 hours
  - Dependencies: Task 2.1, 2.2
  - Assignee: [TBD]

- [ ] **Task 3.3**: Integration testing
  - Priority: Medium
  - Estimated effort: 6 hours
  - Dependencies: Task 3.1
  - Assignee: [TBD]

### Phase 4: Deployment and Documentation
- [ ] **Task 4.1**: Deployment preparation
  - Priority: Medium
  - Estimated effort: 4 hours
  - Dependencies: Task 3.2, 3.3
  - Assignee: [TBD]

- [ ] **Task 4.2**: User documentation
  - Priority: Low
  - Estimated effort: 3 hours
  - Dependencies: Task 4.1
  - Assignee: [TBD]

## Resource Allocation

### Team Members
- **Developer 1**: Backend development
- **Developer 2**: Frontend development
- **Tester**: Quality assurance
- **DevOps**: Deployment and infrastructure

### Tools and Technologies
- Development: [IDE/Tools]
- Version Control: Git
- Project Management: [Tool]
- Communication: [Platform]

## Risk Management

| Risk | Impact | Probability | Mitigation Strategy |
|------|---------|-------------|-------------------|
| Technical complexity | High | Medium | Early prototyping and validation |
| Resource availability | Medium | Low | Cross-training team members |
| Scope creep | Medium | Medium | Regular stakeholder reviews |

## Success Criteria

- [ ] All functional requirements implemented
- [ ] Performance targets met
- [ ] Security requirements satisfied
- [ ] Code quality standards maintained
- [ ] Documentation completed
- [ ] User acceptance achieved

## Communication Plan

- **Daily standups**: 9:00 AM
- **Weekly reviews**: Fridays 2:00 PM
- **Milestone demos**: End of each phase
- **Stakeholder updates**: Bi-weekly

## Dependencies and Blockers

### External Dependencies
- [External service/API availability]
- [Third-party library updates]

### Internal Dependencies
- [Other team deliverables]
- [Infrastructure requirements]

## Progress Tracking

- **Completed Tasks**: 0 / [Total]
- **Estimated Progress**: 0%
- **Actual Progress**: 0%
- **Remaining Effort**: [Total estimated hours]

---
*Generated by tasks-agent*
${designPath ? `*Based on: ${designPath}*` : ''}
`;
  }

  static tests(featureName: string, tasksPath?: string): string {
    return `# Test Plan: ${featureName}

## Test Overview
- **Feature**: ${featureName}
- **Test Phase**: Planning
- **Test Environment**: [To be defined]
- **Test Data**: [Requirements to be defined]

## Test Strategy

### Testing Levels
1. **Unit Testing**: Individual component testing
2. **Integration Testing**: Component interaction testing
3. **System Testing**: End-to-end functionality testing
4. **Acceptance Testing**: User acceptance criteria validation

### Testing Types
- **Functional Testing**: Feature behavior verification
- **Performance Testing**: Response time and throughput
- **Security Testing**: Authentication and authorization
- **Usability Testing**: User experience validation

## Test Cases

### Unit Tests

#### UC-001: Core Function Test
- **Objective**: Verify core functionality
- **Preconditions**: [Setup requirements]
- **Test Steps**:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- **Expected Result**: [Expected outcome]
- **Status**: Not Started

#### UC-002: Error Handling Test
- **Objective**: Verify error handling
- **Preconditions**: [Error conditions]
- **Test Steps**:
  1. [Step 1]
  2. [Step 2]
- **Expected Result**: [Error response]
- **Status**: Not Started

### Integration Tests

#### IT-001: API Integration Test
- **Objective**: Verify API endpoints
- **Preconditions**: [API setup]
- **Test Steps**:
  1. [Request preparation]
  2. [API call execution]
  3. [Response validation]
- **Expected Result**: [Valid response]
- **Status**: Not Started

#### IT-002: Database Integration Test
- **Objective**: Verify data persistence
- **Preconditions**: [Database setup]
- **Test Steps**:
  1. [Data insertion]
  2. [Data retrieval]
  3. [Data validation]
- **Expected Result**: [Correct data]
- **Status**: Not Started

### System Tests

#### ST-001: End-to-End Workflow Test
- **Objective**: Verify complete user workflow
- **Preconditions**: [System setup]
- **Test Steps**:
  1. [User login]
  2. [Feature navigation]
  3. [Action execution]
  4. [Result verification]
- **Expected Result**: [Successful workflow]
- **Status**: Not Started

### Performance Tests

#### PT-001: Load Testing
- **Objective**: Verify system under load
- **Test Environment**: [Specifications]
- **Load Parameters**:
  - Concurrent users: [Number]
  - Duration: [Time]
  - Ramp-up: [Pattern]
- **Success Criteria**:
  - Response time < 2 seconds
  - No errors under normal load
- **Status**: Not Started

#### PT-002: Stress Testing
- **Objective**: Identify breaking point
- **Test Environment**: [Specifications]
- **Stress Parameters**:
  - Maximum users: [Number]
  - Duration: [Time]
- **Success Criteria**:
  - Graceful degradation
  - Recovery after load reduction
- **Status**: Not Started

### Security Tests

#### SEC-001: Authentication Test
- **Objective**: Verify user authentication
- **Test Steps**:
  1. [Valid credentials test]
  2. [Invalid credentials test]
  3. [Session management test]
- **Expected Result**: [Secure access control]
- **Status**: Not Started

#### SEC-002: Authorization Test
- **Objective**: Verify access permissions
- **Test Steps**:
  1. [Role-based access test]
  2. [Unauthorized access attempt]
- **Expected Result**: [Proper access control]
- **Status**: Not Started

## Test Environment Setup

### Hardware Requirements
- CPU: [Specifications]
- RAM: [Amount]
- Storage: [Capacity]
- Network: [Bandwidth]

### Software Requirements
- Operating System: [Version]
- Database: [Version]
- Browser: [Supported versions]
- Testing Tools: [List]

### Test Data Requirements
- User accounts: [Types and quantities]
- Sample data: [Categories and volumes]
- Configuration files: [Environment settings]

## Test Execution Plan

### Phase 1: Unit Testing (Week 1)
- Developer-led testing
- Individual component validation
- Code coverage target: 80%

### Phase 2: Integration Testing (Week 2)
- API and database testing
- Component interaction validation
- Environment: Development

### Phase 3: System Testing (Week 3)
- End-to-end testing
- Performance and security testing
- Environment: Staging

### Phase 4: Acceptance Testing (Week 4)
- User acceptance testing
- Business requirement validation
- Environment: Production-like

## Test Metrics and Reporting

### Key Metrics
- Test execution rate
- Pass/fail ratio
- Defect density
- Code coverage percentage
- Performance benchmarks

### Reporting Schedule
- Daily: Test execution status
- Weekly: Test summary report
- End of phase: Comprehensive test report

## Risk Assessment

| Risk | Impact | Mitigation |
|------|---------|------------|
| Test environment unavailability | High | Backup environment setup |
| Test data corruption | Medium | Regular data backups |
| Tool licensing issues | Low | Alternative tool evaluation |

## Exit Criteria

- [ ] All test cases executed
- [ ] 95% pass rate achieved
- [ ] No critical defects remaining
- [ ] Performance benchmarks met
- [ ] Security requirements validated
- [ ] User acceptance obtained

---
*Generated by test-agent*
${tasksPath ? `*Based on: ${tasksPath}*` : ''}
`;
  }

  static implementation(featureName: string, designPath?: string): string {
    return `# Implementation Guide: ${featureName}

## Implementation Overview
- **Feature**: ${featureName}
- **Implementation Phase**: Development
- **Technology Stack**: [To be defined based on design]
- **Development Approach**: [Methodology]

## Setup Instructions

### Development Environment
\`\`\`bash
# Clone repository
git clone [repository-url]
cd ${featureName}

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run development server
npm run dev
\`\`\`

### Database Setup
\`\`\`sql
-- Create database
CREATE DATABASE ${featureName}_db;

-- Create tables
CREATE TABLE [table_name] (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## Code Structure

### Directory Layout
\`\`\`
${featureName}/
├── src/
│   ├── components/      # UI components
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── utils/           # Utility functions
│   └── tests/           # Test files
├── docs/                # Documentation
├── config/              # Configuration files
└── scripts/             # Build and deployment scripts
\`\`\`

### Key Components

#### Component 1: [Name]
\`\`\`typescript
// src/components/ExampleComponent.ts
export class ExampleComponent {
  constructor(private config: Config) {}
  
  public async process(input: InputType): Promise<OutputType> {
    // Implementation logic
    return result;
  }
}
\`\`\`

#### Service 1: [Name]
\`\`\`typescript
// src/services/ExampleService.ts
export class ExampleService {
  async create(data: CreateData): Promise<Entity> {
    // Implementation logic
    return entity;
  }
  
  async update(id: string, data: UpdateData): Promise<Entity> {
    // Implementation logic
    return entity;
  }
  
  async delete(id: string): Promise<void> {
    // Implementation logic
  }
}
\`\`\`

### API Endpoints

#### Core Endpoints
\`\`\`typescript
// GET /api/${featureName}
router.get('/', async (req, res) => {
  // Implementation
});

// POST /api/${featureName}
router.post('/', async (req, res) => {
  // Implementation
});

// PUT /api/${featureName}/:id
router.put('/:id', async (req, res) => {
  // Implementation
});

// DELETE /api/${featureName}/:id
router.delete('/:id', async (req, res) => {
  // Implementation
});
\`\`\`

## Implementation Checklist

### Backend Development
- [ ] Database schema implementation
- [ ] API endpoint development
- [ ] Business logic implementation
- [ ] Error handling
- [ ] Logging and monitoring
- [ ] Security implementation
- [ ] Unit tests

### Frontend Development
- [ ] UI component development
- [ ] State management
- [ ] API integration
- [ ] Form validation
- [ ] Error handling
- [ ] Responsive design
- [ ] Component tests

### Integration
- [ ] Frontend-backend integration
- [ ] Database connectivity
- [ ] External API integration
- [ ] Authentication flow
- [ ] Authorization implementation
- [ ] Integration tests

### Quality Assurance
- [ ] Code review
- [ ] Performance optimization
- [ ] Security audit
- [ ] Accessibility testing
- [ ] Cross-browser testing
- [ ] Mobile responsiveness

## Configuration Management

### Environment Variables
\`\`\`env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${featureName}_db
DB_USER=username
DB_PASSWORD=password

# API
API_PORT=3000
API_HOST=localhost
JWT_SECRET=your-secret-key

# External Services
EXTERNAL_API_KEY=your-api-key
EXTERNAL_API_URL=https://api.example.com
\`\`\`

### Configuration Files
- \`config/development.json\`: Development settings
- \`config/production.json\`: Production settings
- \`config/test.json\`: Testing settings

## Deployment Instructions

### Build Process
\`\`\`bash
# Build for production
npm run build

# Run tests
npm test

# Create deployment package
npm run package
\`\`\`

### Docker Deployment
\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

### Environment Setup
\`\`\`bash
# Production deployment
docker build -t ${featureName} .
docker run -p 3000:3000 -e NODE_ENV=production ${featureName}
\`\`\`

## Monitoring and Logging

### Logging Configuration
\`\`\`typescript
// src/utils/logger.ts
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});
\`\`\`

### Health Checks
\`\`\`typescript
// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
\`\`\`

## Troubleshooting

### Common Issues
1. **Database Connection Issues**
   - Check database credentials
   - Verify network connectivity
   - Review firewall settings

2. **API Authentication Failures**
   - Validate JWT tokens
   - Check API key configuration
   - Review CORS settings

3. **Performance Issues**
   - Monitor database queries
   - Check memory usage
   - Review caching strategy

### Debug Commands
\`\`\`bash
# Check application logs
tail -f logs/combined.log

# Monitor database connections
npm run db:status

# Run performance tests
npm run test:performance
\`\`\`

## Next Steps

1. Complete core implementation
2. Conduct thorough testing
3. Perform security audit
4. Optimize performance
5. Prepare deployment
6. Update documentation

---
*Generated by coding-agent*
${designPath ? `*Based on: ${designPath}*` : ''}
`;
  }
}
