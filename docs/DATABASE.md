# Database Schema

## Entity-Relationship Diagram

```mermaid
erDiagram
    products {
        varchar(50) barcode PK
        varchar(255) name
        decimal(10,2) price
        int stock
        varchar(100) category
        varchar(255) image_url
        datetime created_at
        datetime updated_at
    }

    marketplace_listings {
        int id PK
        varchar(50) barcode FK
        enum marketplace
        enum status
        decimal(10,2) price
        int stock
        varchar(255) listing_id
        datetime last_sync
    }

    sales {
        int id PK
        varchar(50) barcode FK
        enum marketplace
        int quantity
        decimal(10,2) amount
        datetime sale_date
    }
    
    rate_limits {
        int id PK
        varchar(50) ip
        varchar(50) group_name
        int count
        datetime window_start
    }

    products ||--o{ marketplace_listings : "has listings"
    products ||--o{ sales : "has sales"
```

## Tables

### `products`
CORE table storing the canonical product information. This is the source of truth for the inventory.

| Column | Type | Description |
|--------|------|-------------|
| `barcode` | VARCHAR(50) | **PK**. Unique product identifier. |
| `name` | VARCHAR(255) | Product display name. |
| `price` | DECIMAL(10,2) | Base price (TRY). |
| `stock` | INT | Current physical stock. |
| `category` | VARCHAR(100) | Product category for filtering. |
| `image_url` | VARCHAR(255) | Main product image URL. |

### `marketplace_listings`
Tracks the status and data of products listed on external marketplaces (Trendyol, Hepsiburada, etc.).

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | **PK**. Auto-increment ID. |
| `barcode` | VARCHAR(50) | **FK**. Link to `products`. |
| `marketplace` | ENUM | 'Trendyol', 'Hepsiburada', 'N11'. |
| `status` | ENUM | 'active', 'inactive', 'pending'. |
| `listing_id` | VARCHAR(255) | External ID on the marketplace. |

### `sales`
Records sales transactions for reporting and analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | **PK**. Auto-increment ID. |
| `barcode` | VARCHAR(50) | **FK**. Link to `products`. |
| `amount` | DECIMAL(10,2) | Total sale amount. |
| `quantity` | INT | Quantity sold. |

## Indexes

- `products`: INDEX(`category`)
- `sales`: INDEX(`sale_date`), INDEX(`marketplace`)
- `marketplace_listings`: UNIQUE(`barcode`, `marketplace`)
