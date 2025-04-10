# Simple Blog
description:

## Docs

### ERD
``` mermaid
erDiagram
    USERS {
        UUID id PK
        VARCHAR(50) firstName
        VARCHAR(50) lastName
        VARCHAR(255) email "UNIQUE NOT NULL"
        VARCHAR(255) password "NOT NULL"
        VARCHAR(20) phone
        ENUM role "SuperAdmin|Admin|Editor NOT NULL"
        TIMESTAMP createdAt "DEFAULT NOW()"
        TIMESTAMP updatedAt
    }

    BLOGS {
        UUID id PK
        VARCHAR(255) title "UNIQUE NOT NULL"
        VARCHAR(255) slug "UNIQUE NOT NULL"
        TEXT content "NOT NULL"
        TEXT[] tags "Array of strings"
        UUID createdBy FK "NOT NULL REFERENCES USERS(id)"
        UUID editedBy FK "REFERENCES USERS(id)"
        TIMESTAMP createdAt "DEFAULT NOW()"
        TIMESTAMP updatedAt
    }

    USERS ||--o{ BLOGS : "creates"
    USERS ||--o{ BLOGS : "edits"
```

### System Design

### Deployment Info

## Project setup