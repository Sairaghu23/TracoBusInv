# Tracco Bus Management — Database Schema & ER Diagram

This document provides a comprehensive analysis of the PostgreSQL database schema for the **Tracco Bus Management** system. The schema houses 25 tables, covering features from student transport logistics and fee structures to vehicle diagnostics, maintenance log tracking, and driver management.

---

## 1. Entity-Relationship (ER) Diagram

Below is the Mermaid-based ER diagram illustrating all major tables, columns, primary keys (PK), foreign keys (FK), and their logical relations.

```mermaid
erDiagram
    BRANCH ||--o{ BTECH_STUDENTS : "has students"
    BRANCH ||--o{ MTECH_STUDENTS : "has students (logical)"
    
    ROUTES ||--o{ BUSES : "assigned to"
    ROUTES ||--o{ ROUTE_STOP_MAP : "contains"
    STOPPINGS ||--o{ ROUTE_STOP_MAP : "mapped in"
    
    ROUTE_STOP_MAP ||--o{ BTECH_STUDENTS_BUS_FEE_HISTORY : "boarding point"
    ROUTE_STOP_MAP ||--o{ MTECH_STUDENTS : "boarding point"
    
    BTECH_STUDENTS ||--o{ BTECH_STUDENTS_BUS_FEE_HISTORY : "fee history"
    MTECH_STUDENTS ||--o{ MTECH_STUDENTS_BUS_FEE_HISTORY : "fee history (logical)"
    
    BUSES ||--o{ BUS_READINGS : "has readings"
    BUSES ||--o{ DIESEL_LOGS : "logs diesel"
    BUSES ||--o{ OIL_LOGS : "logs oil"
    BUSES ||--o{ BUS_DOCUMENTS : "has documents"
    BUSES ||--o{ SPARE_USAGE : "consumes spares"
    
    BUS_READINGS ||--|| DIESEL_LOGS : "associated with"
    BUS_READINGS ||--o{ OIL_LOGS : "associated with"
    
    FUEL_RATES ||--o{ DIESEL_LOGS : "applies rate"
    OIL_STOCKS ||--o{ OIL_LOGS : "logs type"
    DOCUMENT_TYPES ||--o{ BUS_DOCUMENTS : "defines type"
    
    DRIVERS ||--o{ DRIVERS_PHONE_NUMBER : "has numbers"
    
    SPARE_STOCKS ||--o{ SPARE_PURCHASES : "replenishes"
    SPARE_STOCKS ||--o{ SPARE_ITEMS : "catalogued as"
    SPARE_STOCKS ||--o{ SPARE_USAGE : "used in"
    
    SPARE_PURCHASES ||--o{ SPARE_ITEMS : "buys items"
    SPARE_USAGE ||--o{ SPARE_USAGE_DETAILS : "details items used"
    SPARE_ITEMS ||--|| SPARE_USAGE_DETAILS : "consumed item"

    BRANCH {
        integer branch_id PK
        varchar branch_name UNIQUE
    }

    BTECH_STUDENTS {
        integer s_id PK
        varchar roll_id UNIQUE
        varchar s_name
        integer branch_id FK
        integer admission_year
        integer batch_start_year
        integer batch_end_year
    }

    BTECH_STUDENTS_BUS_FEE_HISTORY {
        integer fee_id PK
        integer s_id FK
        integer semester UNIQUE
        numeric amount_paid
        numeric concession
        varchar payment_mode
        date payment_date
        integer boarding FK
    }

    MTECH_STUDENTS {
        integer s_id PK
        varchar roll_id UNIQUE
        varchar s_name
        integer branch_id
        integer admission_year
        integer batch_start_year
        integer batch_end_year
        integer boarding FK
        numeric concession
    }

    MTECH_STUDENTS_BUS_FEE_HISTORY {
        integer fee_id PK
        integer s_id
        integer semester UNIQUE
        integer stop_id
        numeric amount_paid
        numeric concession
        varchar payment_mode
        date payment_date
    }

    ROUTES {
        integer route_id PK
        varchar route_name UNIQUE
    }

    STOPPINGS {
        integer stop_id PK
        varchar stop_name
        numeric stop_fee
    }

    ROUTE_STOP_MAP {
        integer map_id PK
        integer route_id FK
        integer stop_id FK
    }

    BUSES {
        integer bus_id PK
        varchar rc_plate_number UNIQUE
        varchar engine_number UNIQUE
        integer bus_no UNIQUE
        integer seating_capacity
        varchar status
        date purchase_date
        timestamp created_at
        integer route_id FK
    }

    BUS_READINGS {
        integer reading_id PK
        integer bus_id FK
        date start_date
        date end_date
        integer old_reading
        integer new_reading
        integer distance
        timestamp created_at
    }

    DIESEL_LOGS {
        integer diesel_id PK
        integer bus_id FK
        integer reading_id FK
        integer rate_id FK
        integer liters
        date created_at
        timestamp created_at_ts
    }

    FUEL_RATES {
        integer rate_id PK
        date rate_date UNIQUE
        numeric fuel_rate
        timestamp created_at
    }

    OIL_LOGS {
        integer log_id PK
        integer reading_id FK
        integer bus_id FK
        integer oil_id FK
        date log_date
        numeric quantity
        numeric amount
        integer old_reading
        integer new_reading
    }

    OIL_STOCKS {
        integer oil_id PK
        varchar oil_type
    }

    BUS_DOCUMENTS {
        integer bus_document_id PK
        integer bus_id FK
        integer document_type_id FK
        text file_path
        date start_date
        date expiry_date
        varchar provider
    }

    DOCUMENT_TYPES {
        integer document_type_id PK
        varchar document_name UNIQUE
    }

    DRIVERS {
        integer driver_id PK
        varchar name
        varchar phone
        varchar license_number UNIQUE
        varchar status
        date joining_date
        text address
        text photo_url
        date license_expiry
        timestamp created_at
    }

    DRIVERS_PHONE_NUMBER {
        integer phone_id PK
        integer driver_id FK
        varchar phone_number
    }

    SPARE_STOCKS {
        integer spare_id PK
        varchar spare_name
        integer quantity
        timestamp created_at
    }

    SPARE_PURCHASES {
        integer purchase_id PK
        integer spare_id FK
        date purchase_date
        numeric quantity
        numeric amount
        varchar vendor
        timestamp created_at
    }

    SPARE_ITEMS {
        integer item_id PK
        integer spare_id FK
        integer purchase_id FK
        varchar product_code UNIQUE
        varchar status
        timestamp created_at
    }

    SPARE_USAGE {
        integer usage_id PK
        integer spare_id FK
        integer bus_id FK
        integer quantity
        date usage_date
        varchar mechanic
        timestamp created_at
        integer old_reading
        integer new_reading
        numeric spare_cost
        numeric service_charge
    }

    SPARE_USAGE_DETAILS {
        integer usage_item_id PK
        integer usage_id FK
        integer item_id FK
    }

    USERS {
        integer id PK
        varchar username UNIQUE
        varchar password
        varchar role
        timestamp created_at
    }
```

---

## 2. Table-by-Table Database Schema

### 2.1 Logistics & Routing Subsystem

#### 2.1.1 `routes`
Stores names of the transport routes.
* **route_id**: `integer` (PK, Auto-increment)
* **route_name**: `varchar(50)` (NOT NULL, UNIQUE)

#### 2.1.2 `stoppings`
Stores pickup and dropoff points alongside their respective base fare.
* **stop_id**: `integer` (PK, Auto-increment)
* **stop_name**: `varchar(60)` (NOT NULL)
* **stop_fee**: `numeric` (NOT NULL)

#### 2.1.3 `route_stop_map`
A mapping bridge resolving the M:N relationship between routes and stop points.
* **map_id**: `integer` (PK, Auto-increment)
* **route_id**: `integer` (FK referencing `routes.route_id`)
* **stop_id**: `integer` (FK referencing `stoppings.stop_id`)
* **Unique Constraints**: Unique index over `(route_id, stop_id)`

---

### 2.2 Student & Transport Subscriptions Subsystem

#### 2.2.1 `branch`
Educational branches (e.g., CSE, ECE, ME).
* **branch_id**: `integer` (PK, Auto-increment)
* **branch_name**: `varchar(100)` (NOT NULL, UNIQUE)

#### 2.2.2 `btech_students`
Profiles for B.Tech students.
* **s_id**: `integer` (PK, Auto-increment)
* **roll_id**: `varchar(50)` (NOT NULL, UNIQUE)
* **s_name**: `varchar(255)` (NOT NULL)
* **branch_id**: `integer` (FK referencing `branch.branch_id`)
* **admission_year**: `integer`
* **batch_start_year**: `integer`
* **batch_end_year**: `integer`

#### 2.2.3 `btech_students_bus_fee_history`
History logs of fee collections for B.Tech student subscriptions.
* **fee_id**: `integer` (PK, Auto-increment)
* **s_id**: `integer` (FK referencing `btech_students.s_id`)
* **semester**: `integer` (NOT NULL)
* **amount_paid**: `numeric` (NOT NULL)
* **concession**: `numeric` (Default: `0`)
* **payment_mode**: `varchar(50)`
* **payment_date**: `date` (NOT NULL)
* **boarding**: `integer` (FK referencing `route_stop_map.map_id`)

#### 2.2.4 `mtech_students`
Profiles for M.Tech students.
* **s_id**: `integer` (PK, Auto-increment)
* **roll_id**: `varchar(50)` (NOT NULL, UNIQUE)
* **s_name**: `varchar(255)` (NOT NULL)
* **branch_id**: `integer` (Logical reference to `branch.branch_id`)
* **admission_year**: `integer`
* **batch_start_year**: `integer`
* **batch_end_year**: `integer`
* **boarding**: `integer` (FK referencing `route_stop_map.map_id`)
* **concession**: `numeric` (Default: `0`)

#### 2.2.5 `mtech_students_bus_fee_history`
History logs of fee collections for M.Tech student subscriptions.
* **fee_id**: `integer` (PK, Auto-increment)
* **s_id**: `integer` (Logical reference to `mtech_students.s_id`)
* **semester**: `integer` (NOT NULL)
* **stop_id**: `integer` (Logical reference to `stoppings.stop_id`)
* **amount_paid**: `numeric` (NOT NULL)
* **concession**: `numeric` (Default: `0`)
* **payment_mode**: `varchar(50)`
* **payment_date**: `date` (NOT NULL)

---

### 2.3 Fleet & Operations Subsystem

#### 2.3.1 `buses`
Primary registry of vehicles in the transportation fleet.
* **bus_id**: `integer` (PK, Auto-increment)
* **rc_plate_number**: `varchar(20)` (NOT NULL, UNIQUE)
* **engine_number**: `varchar(20)` (NOT NULL, UNIQUE)
* **bus_no**: `integer` (NOT NULL, UNIQUE)
* **seating_capacity**: `integer` (Default: `0`)
* **status**: `varchar(10)` (Default: `'ACTIVE'`, restricted to `'ACTIVE'`, `'INACTIVE'`, `'REPAIR'`)
* **purchase_date**: `date`
* **created_at**: `timestamp` (Default: `CURRENT_TIMESTAMP`)
* **route_id**: `integer` (FK referencing `routes.route_id`)

#### 2.3.2 `bus_readings`
Records odometer readings to track distances driven.
* **reading_id**: `integer` (PK, Auto-increment)
* **bus_id**: `integer` (FK referencing `buses.bus_id`, NOT NULL)
* **start_date**: `date` (NOT NULL)
* **end_date**: `date` (NOT NULL)
* **old_reading**: `integer` (NOT NULL)
* **new_reading**: `integer` (NOT NULL)
* **distance**: `integer` (Generated always as `new_reading - old_reading`)
* **created_at**: `timestamp` (Default: `CURRENT_TIMESTAMP`)

#### 2.3.3 `bus_documents`
Scanned copy paths and details of operational permits, insurance, and road taxes.
* **bus_document_id**: `integer` (PK, Auto-increment)
* **bus_id**: `integer` (FK referencing `buses.bus_id`)
* **document_type_id**: `integer` (FK referencing `document_types.document_type_id`)
* **file_path**: `text`
* **start_date**: `date`
* **expiry_date**: `date` (NOT NULL)
* **provider**: `varchar(255)`

#### 2.3.4 `document_types`
Predefined types of documentation (e.g., Insurance, Registration, Emission Test).
* **document_type_id**: `integer` (PK, Auto-increment)
* **document_name**: `varchar(100)` (NOT NULL, UNIQUE)

---

### 2.4 Consumables & Maintenance Log Subsystem

#### 2.4.1 `fuel_rates`
Saves daily or periodic fuel rates per liter.
* **rate_id**: `integer` (PK, Auto-increment)
* **rate_date**: `date` (NOT NULL, UNIQUE)
* **fuel_rate**: `numeric` (NOT NULL)
* **created_at**: `timestamp` (Default: `CURRENT_TIMESTAMP`)

#### 2.4.2 `diesel_logs`
Refueling sessions logged to evaluate vehicle fuel efficiency.
* **diesel_id**: `integer` (PK, Auto-increment)
* **bus_id**: `integer` (FK referencing `buses.bus_id`, NOT NULL)
* **reading_id**: `integer` (FK referencing `bus_readings.reading_id`, UNIQUE, NOT NULL)
* **rate_id**: `integer` (FK referencing `fuel_rates.rate_id`, NOT NULL)
* **liters**: `integer` (NOT NULL)
* **created_at**: `date`
* **created_at_ts**: `timestamp` (Default: `CURRENT_TIMESTAMP`)

#### 2.4.3 `oil_stocks`
Oil stock types in the warehouse.
* **oil_id**: `integer` (PK, Auto-increment)
* **oil_type**: `varchar(50)` (NOT NULL)

#### 2.4.4 `oil_logs`
Oil refill sessions logged for engine and steering maintenance.
* **log_id**: `integer` (PK, Auto-increment)
* **reading_id**: `integer` (FK referencing `bus_readings.reading_id`)
* **bus_id**: `integer` (FK referencing `buses.bus_id`, NOT NULL)
* **oil_id**: `integer` (FK referencing `oil_stocks.oil_id`, NOT NULL)
* **log_date**: `date`
* **quantity**: `numeric`
* **amount**: `numeric`
* **old_reading**: `integer`
* **new_reading**: `integer`

---

### 2.5 Inventory & Spare Parts Subsystem

#### 2.5.1 `spare_stocks`
Registry of available spare part types and warehouse volumes.
* **spare_id**: `integer` (PK, Auto-increment)
* **spare_name**: `varchar(100)` (NOT NULL)
* **quantity**: `integer` (Default: `0`)
* **created_at**: `timestamp` (Default: `CURRENT_TIMESTAMP`)

#### 2.5.2 `spare_purchases`
Purchase orders for replenishing the spares inventory.
* **purchase_id**: `integer` (PK, Auto-increment)
* **spare_id**: `integer` (FK referencing `spare_stocks.spare_id`, NOT NULL)
* **purchase_date**: `date`
* **quantity**: `numeric`
* **amount**: `numeric`
* **vendor**: `varchar(255)`
* **created_at**: `timestamp` (Default: `CURRENT_TIMESTAMP`)

#### 2.5.3 `spare_items`
Individual instances of spare parts tracked via unique product codes.
* **item_id**: `integer` (PK, Auto-increment)
* **spare_id**: `integer` (FK referencing `spare_stocks.spare_id`, NOT NULL)
* **purchase_id**: `integer` (FK referencing `spare_purchases.purchase_id`, NOT NULL)
* **product_code**: `varchar(50)` (NOT NULL, UNIQUE)
* **status**: `varchar(20)` (Default: `'available'`)
* **created_at**: `timestamp` (Default: `CURRENT_TIMESTAMP`)

#### 2.5.4 `spare_usage`
Records of fleet repairs and spares usage.
* **usage_id**: `integer` (PK, Auto-increment)
* **spare_id**: `integer` (FK referencing `spare_stocks.spare_id`, NOT NULL)
* **bus_id**: `integer` (FK referencing `buses.bus_id`, NOT NULL)
* **quantity**: `integer` (NOT NULL)
* **usage_date**: `date` (NOT NULL)
* **mechanic**: `varchar(255)`
* **old_reading**: `integer`
* **new_reading**: `integer`
* **spare_cost**: `numeric`
* **service_charge**: `numeric`
* **created_at**: `timestamp` (Default: `CURRENT_TIMESTAMP`)

#### 2.5.5 `spare_usage_details`
Bridge associating utilized `spare_items` with their corresponding `spare_usage` incident.
* **usage_item_id**: `integer` (PK, Auto-increment)
* **usage_id**: `integer` (FK referencing `spare_usage.usage_id`, NOT NULL)
* **item_id**: `integer` (FK referencing `spare_items.item_id`, NOT NULL, UNIQUE)

---

### 2.6 Personnel & Authentication Subsystem

#### 2.6.1 `drivers`
Profiles for transport drivers.
* **driver_id**: `integer` (PK, Auto-increment)
* **name**: `varchar(255)` (NOT NULL)
* **phone**: `varchar(20)`
* **license_number**: `varchar(50)` (UNIQUE)
* **status**: `varchar(50)` (Default: `'ACTIVE'`)
* **joining_date**: `date`
* **address**: `text`
* **photo_url**: `text`
* **license_expiry**: `date`
* **created_at**: `timestamp` (Default: `CURRENT_TIMESTAMP`)

#### 2.6.2 `drivers_phone_number`
Multiple contact numbers assigned to drivers.
* **phone_id**: `integer` (PK, Auto-increment)
* **driver_id**: `integer` (FK referencing `drivers.driver_id`, NOT NULL)
* **phone_number**: `varchar(15)` (NOT NULL)

#### 2.6.3 `users`
System accounts for admin portals.
* **id**: `integer` (PK, Auto-increment)
* **username**: `varchar(100)` (NOT NULL, UNIQUE)
* **password**: `varchar(255)` (NOT NULL)
* **role**: `varchar(50)` (Default: `'admin'`)
* **created_at**: `timestamp` (Default: `CURRENT_TIMESTAMP`)

#### 2.6.4 `test_inventory`
* **id**: `integer` (PK, Auto-increment)
* **item_name**: `varchar(255)` (NOT NULL)
* **quantity**: `integer` (Default: `0`)
* **created_at**: `timestamp` (Default: `CURRENT_TIMESTAMP`)
