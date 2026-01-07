# System Architecture

## Overview

Beekod Chatbot is an e-commerce management system that integrates with multiple marketplaces (Trendyol, Hepsiburada, N11) and provides a chat-based interface for operations.

## High-Level Architecture

```mermaid
graph TD
    Client[Client Apps] --> LB[Load Balancer]
    LB --> App[Node.js App / Express]
    
    subgraph "Core Services"
        App --> NlpService[NLP Service]
        App --> ChatService[Chat Service]
        App --> ProductService[Product Service]
        App --> MarketplaceService[Marketplace Service]
    end
    
    subgraph "External Integrations"
        MarketplaceService --> Trendyol[Trendyol API]
        MarketplaceService --> HB[Hepsiburada API]
        MarketplaceService --> N11[N11 API]
        ChatService --> Gemini[Google Gemini AI]
        ProductService --> GoogleVision[Google Vision API]
    end
    
    subgraph "Data & Cache"
        App --> MySQL[(MySQL Database)]
        App --> Redis[(Redis Cache)]
        App --> FS[File System / Storage]
    end
```

## Data Flow: Chat Interaction

```mermaid
sequenceDiagram
    participant User
    participant ChatAPI
    participant NLP
    participant Service
    participant Gemini
    
    User->>ChatAPI: Send Message ("500TL yap")
    ChatAPI->>NLP: Parse Intent
    NLP->>Gemini: Analyze (if needed)
    Gemini-->>NLP: Intent: price.set
    NLP-->>ChatAPI: Parsed Command
    ChatAPI->>Service: Execute Action (updatePrice)
    Service-->>ChatAPI: Result
    ChatAPI-->>User: Response ("Fiyat güncellendi")
```

## Database Schema Overview

```mermaid
erDiagram
    PRODUCTS ||--o{ SALES : has
    PRODUCTS ||--o{ IMAGES : has
    PRODUCTS ||--o{ MARKETPLACE_LISTINGS : listed_on
    
    PRODUCTS {
        string barcode PK
        string name
        float price
        int stock
        string category
    }
    
    MARKETPLACE_LISTINGS {
        int id PK
        string barcode FK
        string marketplace
        float price
        int stock
        string status
    }
    
    SALES {
        int id PK
        string barcode FK
        int quantity
        float amount
        datetime date
    }
```

## Directory Structure

- `src/services`: Core logic (NLP, Pricing, Products)
- `src/marketplaces`: Provider adapters for external APIs
- `src/routes`: API endpoints
- `src/models`: Database types and schemas
- `scripts`: Utility and maintenance scripts
