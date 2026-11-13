# AGENTS.md

# E-Commerce Project – AI Development Guidelines

## 1. Project Overview

Build a production-minded full-stack e-commerce application using a PERN-based architecture.

The application must follow clean architecture, modular code organization, security best practices, scalability and maintainability.

### Technology Stack

**Frontend**

- React.js
- Vite
- TypeScript
- React Router
- Axios
- Tailwind CSS

**Backend**

- Node.js
- Express.js
- TypeScript
- REST API architecture

**Authentication**

- Clerk

**Database**

- Neon PostgreSQL
- Prisma ORM

**Payment**

- Razorpay (sandbox/test mode during development)

---

## 2. Architecture Rules

- Keep frontend and backend responsibilities separate.
- Follow modular and layered architecture.
- Never put business logic directly inside route files.
- Keep controllers responsible for HTTP request/response handling.
- Keep business logic inside service layers.
- Keep database operations inside repositories or dedicated data-access modules.
- Use reusable middleware.
- Maintain consistent API response structures.
- Avoid unnecessary abstractions and overengineering.

## 3. Frontend Development Rules

- Use functional React components and hooks.
- Use TypeScript for components, props and API responses.
- Create reusable UI components.
- Keep API calls separate from UI components.
- Use centralized Axios configuration.
- Implement proper loading, error and empty states.
- Protect private routes using Clerk authentication.
- Never store sensitive secrets in frontend environment variables.
- Use environment variables prefixed with VITE_ only for public configuration.

## 4. Backend Development Rules

- Use TypeScript throughout the backend.
- Use async/await for asynchronous operations.
- Implement centralized error handling.
- Validate all incoming request data using Zod.
- Use appropriate HTTP status codes.
- Implement request logging.
- Keep controllers thin.
- Implement pagination, filtering and sorting where required.
- Never expose internal errors, stack traces or sensitive information in production responses.
- Use environment variables for configuration.

## 5. Authentication – Clerk

- Clerk is the authentication provider.
- Do not implement custom password authentication.
- Do not store user passwords in PostgreSQL.
- Verify Clerk session tokens on protected backend routes using the official Clerk backend SDK.
- Never trust user IDs supplied by the frontend.
- Extract the authenticated Clerk user ID from the verified token.
- Synchronize application user records with Neon PostgreSQL.
- Use Clerk webhooks for user lifecycle synchronization where appropriate.
- Make webhook processing idempotent.
- Implement authorization separately from authentication.

## 6. Authorization and Roles

Initial roles:

- customer
- admin

Rules:

- Customers can access only their own private resources.
- Admin routes must require server-side role verification.
- Never trust a role supplied by the frontend.
- Enforce ownership checks for carts, addresses and orders.
- Centralize authorization middleware.

## 7. Database Rules – Neon PostgreSQL

- Use Prisma ORM for database operations.
- Define relational models with proper constraints.
- Use foreign keys wherever appropriate.
- Add indexes for frequently queried columns.
- Use unique constraints for emails, Clerk IDs and other unique identifiers.
- Use transactions for operations involving multiple related database changes.
- Avoid N+1 query problems.
- Use migrations for schema changes.
- Never modify production schema manually.
- Never expose database credentials.

## 8. E-Commerce Modules

Implement modules incrementally:

1. Authentication and user profiles
2. Product management
3. Categories and product search
4. Shopping cart
5. Wishlist
6. Address management
7. Checkout
8. Order management
9. Payment integration
10. Admin dashboard
11. Inventory management
12. Notifications

Each module should have clearly separated routes, controllers, services, validation and database access.

## 9. Payment Security – Razorpay

- Use Razorpay test credentials during development.
- Create payment orders only from the backend.
- Never trust payment amounts calculated by the frontend.
- Verify Razorpay payment signatures on the backend.
- Verify webhook signatures.
- Make payment processing idempotent.
- Maintain payment and order status separately.
- Never mark an order as paid merely because the frontend reports success.
- Never simulate successful real-money transactions.
- Handle failed, pending, cancelled and successful payments.

## 10. Security Requirements

- Validate and sanitize incoming input.
- Configure CORS using trusted origins.
- Use Helmet.
- Apply rate limiting to sensitive endpoints.
- Prevent SQL injection through safe ORM queries.
- Protect secrets using environment variables.
- Never commit .env files.
- Avoid logging tokens, passwords or payment secrets.
- Enforce authorization on every protected resource.
- Use HTTPS in production.

## 11. API Standards

Use consistent response structures.

Success:

{
  "success": true,
  "message": "Request successful",
  "data": {}
}

Error:

{
  "success": false,
  "message": "Something went wrong",
  "errors": []
}

- Use RESTful resource naming.
- Use appropriate HTTP methods.
- Use consistent error codes.
- Version APIs when appropriate.
- Document APIs using OpenAPI/Swagger.

## 12. Testing Requirements

- Write unit tests for business logic.
- Write integration tests for API endpoints.
- Test authentication and authorization.
- Test validation failures.
- Test database transaction behavior.
- Test payment signature verification.
- Test duplicate webhook handling.
- Test customer access restrictions.

## 13. Coding Standards

- Use meaningful names.
- Prefer small, reusable functions.
- Avoid duplicate business logic.
- Avoid `any` in TypeScript.
- Use strict TypeScript configuration.
- Handle errors explicitly.
- Do not leave unnecessary console.log statements.
- Do not install packages without a valid reason.
- Keep code readable and maintainable.

## 14. Environment Variables

Maintain separate environment files for frontend and backend.

Never commit actual secrets.

Example backend configuration:

DATABASE_URL=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
PORT=
NODE_ENV=

Example frontend configuration:

VITE_CLERK_PUBLISHABLE_KEY=
VITE_API_BASE_URL=

## 15. AI Agent Working Instructions

Before implementing any feature:

1. Inspect the existing project structure.
2. Understand the current architecture.
3. Identify affected modules.
4. Explain the implementation approach.
5. Implement one logical feature at a time.
6. Follow existing naming and coding conventions.
7. Avoid unnecessary changes to unrelated files.
8. Run relevant tests after implementation.
9. Report changed files and explain important decisions.
10. Never claim a feature is complete without verifying it.

### Important Rules

- Do not invent API endpoints or database fields without checking existing code.
- Do not silently remove existing functionality.
- Do not hardcode credentials or secrets.
- Do not bypass authentication or authorization.
- Do not create fake payment success flows.
- Prefer secure, maintainable and testable solutions over shortcuts.

**Primary objective:** Build a secure, maintainable and production-minded e-commerce application with reliable authentication, relational data management and payment processing.
