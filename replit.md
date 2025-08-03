# Overview

This is a Point of Sale (TPV/POS) system built as a full-stack web application for managing sales transactions, client data, and generating reports. The system provides a complete business solution for retail operations including transaction processing, client management, inventory tracking, VAT calculations, and comprehensive reporting capabilities. It features a modern React frontend with a Node.js/Express backend and PostgreSQL database integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints following resource-based routing
- **Development Server**: Custom Vite integration for hot module replacement

## Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations with schema-first approach
- **Core Tables**:
  - `clients` - Customer information with default client support
  - `transactions` - Sales records with payment methods and totals
  - `transaction_items` - Line items with VAT calculations per item
- **Data Relationships**: Foreign key constraints with cascade deletes
- **Data Types**: Decimal precision for currency values, UUID primary keys

## Authentication & Authorization
- Currently implements a basic admin-only system
- Session-based authentication using connect-pg-simple for PostgreSQL session storage
- Role-based access control structure prepared for future expansion

## Key Features & Business Logic
- **Multi-VAT Support**: Handles Spanish VAT rates (4%, 10%, 21%) with automatic calculations
- **Payment Methods**: Cash, card, and bank transfer support
- **Real-time Calculations**: Dynamic subtotal, VAT, and total calculations
- **Print Integration**: Thermal printer-compatible receipt generation
- **Reporting Suite**: Dashboard analytics, date-range reports, VAT breakdowns
- **Client Management**: Default client system for walk-in customers

## Development Workflow
- **Hot Reload**: Vite development server with Express backend integration
- **Type Safety**: Shared TypeScript schemas between frontend and backend
- **Database Migrations**: Drizzle push/pull workflow for schema changes
- **Build Process**: Separate frontend (Vite) and backend (esbuild) compilation

# External Dependencies

## Database & Hosting
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket Support**: Custom WebSocket constructor for Neon serverless connections

## UI Component Library
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework with custom design system

## Development Tools
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **TypeScript**: Full type safety across the entire application stack
- **ESBuild**: Fast TypeScript compilation for production builds

## Form & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Schema validation library with TypeScript integration
- **Drizzle Zod**: Automatic Zod schema generation from database schemas

## Development & Build
- **Vite**: Modern build tool with fast HMR and optimized production builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **TSX**: TypeScript execution for development server