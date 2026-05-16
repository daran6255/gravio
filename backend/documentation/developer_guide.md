# Developer Guide: Adding New Features to FastAPI Application

> **For**: Junior Developers  
> **Purpose**: Step-by-step guide to add new endpoints, tables, models, and schemas

---

## Table of Contents

1. [Quick Reference Checklist](#quick-reference-checklist)
2. [Step-by-Step Tutorial](#step-by-step-tutorial)
3. [Example: Creating a "Product" Feature](#example-creating-a-product-feature)
4. [Best Practices](#best-practices)
5. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
6. [Troubleshooting](#troubleshooting)

---

## Quick Reference Checklist

When adding a new feature, follow this order:

- [ ] **Step 1**: Create the database model (`app/models/*.py`)
- [ ] **Step 2**: Create Pydantic schemas (`app/schemas/*.py`)
- [ ] **Step 3**: Create database migration (`alembic revision`)
- [ ] **Step 4**: Run migration (`alembic upgrade head`)
- [ ] **Step 5**: Create repository (`app/repositories/*_repository.py`)
- [ ] **Step 6**: Create service (`app/services/*_service.py`)
- [ ] **Step 7**: Create API endpoints (`app/api/v1/endpoints/*.py`)
- [ ] **Step 8**: Add role-based access control
- [ ] **Step 9**: Add activity logging
- [ ] **Step 10**: Register router ([app/api/v1/router.py](file:///c:/External-projects/FastAPI/app/api/v1/router.py))
- [ ] **Step 11**: Test the endpoints

---

## Step-by-Step Tutorial

### Step 1: Create the Database Model

**Location**: `app/models/your_model.py`

**Purpose**: Define the database table structure using SQLAlchemy ORM.

**Example**:

```python
"""Product model"""

from sqlalchemy import String, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class Product(BaseModel):
    """Product database model"""
    
    __tablename__ = "products"
    
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    
    stock_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    
    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name={self.name}, price={self.price})>"
```

**Important Notes**:
- Always extend [BaseModel](file:///c:/External-projects/FastAPI/app/models/base.py#57-75) (includes `id`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`)
- Use `Mapped[type]` for type hints
- Add `index=True` for fields you'll search/filter by frequently
- Use appropriate SQLAlchemy types: `String`, `Integer`, `Float`, `Boolean`, `Text`, `DateTime`, `JSON`

**Update [app/models/__init__.py](file:///c:/External-projects/FastAPI/app/models/__init__.py)**:

```python
"""Models package - SQLAlchemy ORM models"""

from app.models.user import User, UserRole
from app.models.activity_log import ActivityLog, ActionType
from app.models.product import Product  # Add this line

__all__ = ["User", "UserRole", "ActivityLog", "ActionType", "Product"]  # Add Product
```

---

### Step 2: Create Pydantic Schemas

**Location**: `app/schemas/your_schema.py`

**Purpose**: Define request/response validation and serialization schemas.

**Example**:

```python
"""Product Pydantic schemas for validation"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator


# Base schema with common fields
class ProductBase(BaseModel):
    """Base product schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: float = Field(..., gt=0, description="Price must be greater than 0")
    stock_quantity: int = Field(default=0, ge=0, description="Stock cannot be negative")
    category: str = Field(..., min_length=1, max_length=100)


# Schema for creating a new product
class ProductCreate(ProductBase):
    """Schema for creating a product"""
    
    @validator("price")
    def validate_price(cls, v: float) -> float:
        """Ensure price has at most 2 decimal places"""
        if round(v, 2) != v:
            raise ValueError("Price must have at most 2 decimal places")
        return v


# Schema for updating a product
class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    category: Optional[str] = Field(None, min_length=1, max_length=100)


# Schema for product response
class ProductResponse(ProductBase):
    """Schema for product response"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Allows ORM model to Pydantic conversion


# Schema for paginated products list
class PaginatedProductsResponse(BaseModel):
    """Paginated products response"""
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[ProductResponse]
```

**Schema Types Explained**:
- **`*Base`**: Common fields shared across schemas
- **`*Create`**: Fields required/allowed when creating (POST)
- **`*Update`**: Fields allowed when updating (PUT/PATCH), all optional
- **`*Response`**: Fields returned to client (includes `id`, timestamps)
- **`Paginated*Response`**: For list endpoints with pagination

**Update [app/schemas/__init__.py](file:///c:/External-projects/FastAPI/app/schemas/__init__.py)** (optional but recommended):

```python
"""Pydantic schemas package"""

from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    PaginatedProductsResponse
)

__all__ = [
    "ProductCreate",
    "ProductUpdate", 
    "ProductResponse",
    "PaginatedProductsResponse"
]
```

---

### Step 3: Create Database Migration

**Purpose**: Create the database table for your new model.

**Command**:

```bash
# Navigate to project root
cd c:\External-projects\FastAPI

# Create migration
alembic revision -m "create_products_table"
```

**Edit the generated migration file** (`alembic/versions/XXXXX_create_products_table.py`):

```python
"""create_products_table

Revision ID: XXXXX
Revises: d20b1e512fc5
Create Date: 2025-12-08 XX:XX:XX

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'XXXXX'
down_revision: Union[str, None] = 'd20b1e512fc5'  # Previous migration ID
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create products table
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('stock_quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_products_id'), 'products', ['id'], unique=False)
    op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)
    op.create_index(op.f('ix_products_category'), 'products', ['category'], unique=False)
    op.create_index(op.f('ix_products_is_deleted'), 'products', ['is_deleted'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_products_is_deleted'), table_name='products')
    op.drop_index(op.f('ix_products_category'), table_name='products')
    op.drop_index(op.f('ix_products_name'), table_name='products')
    op.drop_index(op.f('ix_products_id'), table_name='products')
    
    # Drop table
    op.drop_table('products')
```

---

### Step 4: Run Migration

**Command**:

```bash
# Apply migration to database
alembic upgrade head

# Verify migration was applied
alembic current
```

**Expected Output**:
```
INFO  [alembic.runtime.migration] Running upgrade d20b1e512fc5 -> XXXXX, create_products_table
```

---

### Step 5: Create Repository

**Location**: `app/repositories/product_repository.py`

**Purpose**: Database access layer - handles all database queries.

**Example**:

```python
"""Product repository for database operations"""

from typing import Optional, List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    """Repository for product database operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(Product, db)
    
    async def get_by_name(self, name: str) -> Optional[Product]:
        """Get product by name"""
        query = select(Product).where(
            and_(
                Product.name == name,
                Product.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_category(
        self,
        category: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Product]:
        """Get products by category"""
        query = (
            select(Product)
            .where(
                and_(
                    Product.category == category,
                    Product.is_deleted == False
                )
            )
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def search_by_name(
        self,
        search_term: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Product]:
        """Search products by name (case-insensitive)"""
        query = (
            select(Product)
            .where(
                and_(
                    Product.name.ilike(f"%{search_term}%"),
                    Product.is_deleted == False
                )
            )
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
```

**Key Points**:
- Extend `BaseRepository[YourModel]` to inherit CRUD methods
- Always filter by `is_deleted == False` for soft-deleted records
- Use `async/await` for all database operations
- Common inherited methods: [get()](file:///c:/External-projects/FastAPI/app/api/v1/endpoints/users.py#101-118), `get_multi()`, [create()](file:///c:/External-projects/FastAPI/app/repositories/activity_log_repository.py#17-48), [update()](file:///c:/External-projects/FastAPI/app/utils/activity_tracker.py#115-141), [delete()](file:///c:/External-projects/FastAPI/app/utils/activity_tracker.py#143-164)

---

### Step 6: Create Service

**Location**: `app/services/product_service.py`

**Purpose**: Business logic layer - handles validation, orchestration, and business rules.

**Example**:

```python
"""Product service - business logic for product operations"""

from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.repositories.product_repository import ProductRepository


class ProductService:
    """Service for product-related business logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ProductRepository(db)
    
    async def get_product(self, product_id: int) -> Product:
        """Get product by ID"""
        product = await self.repository.get(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return product
    
    async def get_products(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List[Product]:
        """Get list of products"""
        return await self.repository.get_multi(skip=skip, limit=limit)
    
    async def get_products_by_category(
        self,
        category: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Product]:
        """Get products by category"""
        return await self.repository.get_by_category(
            category=category,
            skip=skip,
            limit=limit
        )
    
    async def create_product(self, product_in: ProductCreate) -> Product:
        """Create a new product"""
        # Check if product name already exists
        existing_product = await self.repository.get_by_name(product_in.name)
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this name already exists"
            )
        
        # Create product
        product_data = product_in.model_dump()
        product = await self.repository.create(product_data)
        return product
    
    async def update_product(
        self,
        product_id: int,
        product_in: ProductUpdate
    ) -> Product:
        """Update product"""
        # Check if product exists
        product = await self.repository.get(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Prepare update data
        update_data = product_in.model_dump(exclude_unset=True)
        
        # Check name uniqueness if being updated
        if "name" in update_data and update_data["name"] != product.name:
            existing_name = await self.repository.get_by_name(update_data["name"])
            if existing_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Product with this name already exists"
                )
        
        updated_product = await self.repository.update(product_id, update_data)
        return updated_product
    
    async def delete_product(self, product_id: int) -> bool:
        """Delete product (soft delete)"""
        product = await self.repository.get(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return await self.repository.delete(product_id, soft=True)
    
    async def search_products(
        self,
        search_term: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Product]:
        """Search products by name"""
        return await self.repository.search_by_name(
            search_term=search_term,
            skip=skip,
            limit=limit
        )
```

---

### Step 7: Create API Endpoints

**Location**: `app/api/v1/endpoints/products.py`

**Purpose**: API route handlers - define HTTP endpoints.

**Example**:

```python
"""Product endpoints"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rate_limiter import rate_limit_medium
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.product import Product
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate
from app.services.product_service import ProductService
from app.utils.activity_tracker import log_create, log_update, log_delete
from loguru import logger


router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=List[ProductResponse])
@rate_limit_medium()
async def get_products(
    request: Request,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records"),
    category: str = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of products (Any authenticated user)
    
    - **skip**: Pagination offset
    - **limit**: Number of items to return
    - **category**: Optional category filter
    """
    logger.info(f"User {current_user.email} fetching products")
    
    product_service = ProductService(db)
    
    if category:
        products = await product_service.get_products_by_category(
            category=category,
            skip=skip,
            limit=limit
        )
    else:
        products = await product_service.get_products(skip=skip, limit=limit)
    
    return products


@router.get("/{product_id}", response_model=ProductResponse)
@rate_limit_medium()
async def get_product(
    request: Request,
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get product by ID (Any authenticated user)
    """
    logger.info(f"User {current_user.email} fetching product {product_id}")
    
    product_service = ProductService(db)
    product = await product_service.get_product(product_id)
    
    return product


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
@rate_limit_medium()
async def create_product(
    request: Request,
    product_in: ProductCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new product (Admin or Manager only)
    """
    logger.info(f"User {current_user.email} creating product: {product_in.name}")
    
    product_service = ProductService(db)
    product = await product_service.create_product(product_in)
    
    # Log product creation
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="product",
        resource_id=product.id,
        status_code=201,
    )
    
    logger.info(f"Product created successfully: {product.id}")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
@rate_limit_medium()
async def update_product(
    request: Request,
    product_id: int,
    product_in: ProductUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update product by ID (Admin or Manager only)
    """
    logger.info(f"User {current_user.email} updating product {product_id}")
    
    product_service = ProductService(db)
    
    # Get before state
    existing_product = await product_service.get_product(product_id)
    before_state = {
        "name": existing_product.name,
        "price": existing_product.price,
        "stock_quantity": existing_product.stock_quantity,
        "category": existing_product.category,
    }
    
    # Update product
    updated_product = await product_service.update_product(product_id, product_in)
    
    # Log the update
    after_state = {
        "name": updated_product.name,
        "price": updated_product.price,
        "stock_quantity": updated_product.stock_quantity,
        "category": updated_product.category,
    }
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="product",
        resource_id=product_id,
        before=before_state,
        after=after_state,
    )
    
    logger.info(f"Product updated successfully: {product_id}")
    return updated_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit_medium()
async def delete_product(
    request: Request,
    product_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete product by ID (Admin only)
    
    Performs soft delete
    """
    logger.info(f"Admin {current_user.email} deleting product {product_id}")
    
    product_service = ProductService(db)
    await product_service.delete_product(product_id)
    
    # Log the deletion
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="product",
        resource_id=product_id,
    )
    
    logger.info(f"Product deleted successfully: {product_id}")
    return None


@router.get("/search/", response_model=List[ProductResponse])
@rate_limit_medium()
async def search_products(
    request: Request,
    q: str = Query(..., min_length=1, description="Search term"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search products by name (Any authenticated user)
    """
    logger.info(f"User {current_user.email} searching products: {q}")
    
    product_service = ProductService(db)
    products = await product_service.search_products(
        search_term=q,
        skip=skip,
        limit=limit
    )
    
    return products
```

---

### Step 8: Add Role-Based Access Control

**Apply role restrictions to endpoints**:

```python
# Any authenticated user
current_user: User = Depends(get_current_user)

# Single role only
current_user: User = Depends(require_roles([UserRole.ADMIN]))

# Multiple roles allowed
current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
```

**Common Patterns**:
- **Read operations** (GET): All authenticated users
- **Create operations** (POST): Admin, Manager
- **Update operations** (PUT): Admin, Manager
- **Delete operations** (DELETE): Admin only

---

### Step 9: Add Activity Logging

**Import tracking functions**:

```python
from app.utils.activity_tracker import log_create, log_update, log_delete
```

**Add logging to endpoints**:

```python
# On CREATE
await log_create(
    db=db,
    request=request,
    user_id=current_user.id,
    resource_type="product",
    resource_id=product.id,
    status_code=201,
)

# On UPDATE (with before/after tracking)
await log_update(
    db=db,
    request=request,
    user_id=current_user.id,
    resource_type="product",
    resource_id=product_id,
    before=before_state,
    after=after_state,
)

# On DELETE
await log_delete(
    db=db,
    request=request,
    user_id=current_user.id,
    resource_type="product",
    resource_id=product_id,
)
```

---

### Step 10: Register Router

**Location**: [app/api/v1/router.py](file:///c:/External-projects/FastAPI/app/api/v1/router.py)

**Add import and include router**:

```python
"""API v1 main router"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, activity_logs, products  # Add products

# Create main v1 router
router = APIRouter()

# Include all endpoint routers
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(activity_logs.router)
router.include_router(products.router)  # Add this line
```

---

### Step 11: Test the Endpoints

**Restart the server**:

```bash
# Server should auto-reload if using --reload flag
# Otherwise, restart manually
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Test with cURL**:

```bash
# 1. Login to get token
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'

# Save the access_token from response

# 2. Create a product
curl -X POST "http://localhost:8000/api/v1/products/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "A test product",
    "price": 99.99,
    "stock_quantity": 100,
    "category": "Electronics"
  }'

# 3. Get all products
curl -X GET "http://localhost:8000/api/v1/products/" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Get product by ID
curl -X GET "http://localhost:8000/api/v1/products/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Update product
curl -X PUT "http://localhost:8000/api/v1/products/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 89.99,
    "stock_quantity": 150
  }'

# 6. Search products
curl -X GET "http://localhost:8000/api/v1/products/search/?q=Test" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 7. Delete product
curl -X DELETE "http://localhost:8000/api/v1/products/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 8. Check activity logs
curl -X GET "http://localhost:8000/api/v1/activity-logs/?resource_type=product" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test with Swagger UI**:

1. Go to `http://localhost:8000/docs`
2. Click "Authorize" button
3. Login via `/api/v1/auth/login`
4. Copy the `access_token`
5. Paste in authorize dialog
6. Test all endpoints interactively

---

## Best Practices

### 1. Model Design

✅ **DO**:
- Extend [BaseModel](file:///c:/External-projects/FastAPI/app/models/base.py#57-75) for automatic timestamps and soft delete
- Add indexes on frequently queried/filtered fields
- Use appropriate field types and constraints
- Include nullable/non-nullable correctly

❌ **DON'T**:
- Create tables without indexes
- Use `String` without max length
- Forget to add `is_deleted` filter in queries

### 2. Schema Design

✅ **DO**:
- Separate Create, Update, and Response schemas
- Use Pydantic validators for business rules
- Add field descriptions for documentation
- Use `Field()` for constraints (min, max, regex)

❌ **DON'T**:
- Expose sensitive fields (passwords, tokens) in responses
- Allow null/empty strings when business logic requires values
- Skip validation

### 3. Repository Pattern

✅ **DO**:
- Keep database logic in repositories
- Always filter by `is_deleted == False`
- Use async/await consistently
- Create specific query methods for common operations

❌ **DON'T**:
- Put business logic in repositories (belongs in services)
- Execute raw SQL without parameterization
- Forget error handling

### 4. Service Layer

✅ **DO**:
- Validate business rules
- Raise HTTPException with proper status codes
- Log important operations
- Keep services focused and cohesive

❌ **DON'T**:
- Access database directly (use repository)
- Return database models (return after validation)
- Swallow exceptions

### 5. API Endpoints

✅ **DO**:
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Add rate limiting
- Include role-based access control
- Log mutations (create, update, delete)
- Write clear docstrings for API documentation

❌ **DON'T**:
- Use GET for mutations
- Skip authentication/authorization
- Forget to log important actions
- Return internal errors to clients

### 6. Migration

✅ **DO**:
- Test migrations on dev database first
- Include both upgrade and downgrade
- Add indexes in migration
- Use meaningful migration names

❌ **DON'T**:
- Edit applied migrations
- Skip migration  versioning
- Delete migration files

---

## Common Mistakes to Avoid

### 1. Forgetting async/await

**Wrong**:
```python
def get_product(self, product_id: int):  # Missing async
    result = self.db.execute(query)  # Missing await
    return result.scalar_one_or_none()
```

**Correct**:
```python
async def get_product(self, product_id: int):
    result = await self.db.execute(query)
    return result.scalar_one_or_none()
```

### 2. Not filtering soft-deleted records

**Wrong**:
```python
query = select(Product).where(Product.id == product_id)
```

**Correct**:
```python
query = select(Product).where(
    and_(
        Product.id == product_id,
        Product.is_deleted == False  # Always include this
    )
)
```

### 3. Exposing password in response

**Wrong**:
```python
class UserResponse(BaseModel):
    id: int
    email: str
    hashed_password: str  # DON'T expose this!
```

**Correct**:
```python
class UserResponse(BaseModel):
    id: int
    email: str
    # No password field
```

### 4. Missing Request parameter for rate limiting

**Wrong**:
```python
@router.get("/products")
@rate_limit_medium()
async def get_products(  # Missing request: Request
    current_user: User = Depends(get_current_user)
):
    pass
```

**Correct**:
```python
@router.get("/products")
@rate_limit_medium()
async def get_products(
    request: Request,  # Required for rate limiting
    current_user: User = Depends(get_current_user)
):
    pass
```

### 5. Not importing enums correctly

**Wrong**:
```python
# In endpoints file
from app.models.user import User  # Missing UserRole import
# Then trying to use:
Depends(require_roles([UserRole.ADMIN]))  # Error: UserRole not defined
```

**Correct**:
```python
from app.models.user import User, UserRole  # Import both
```

---

## Troubleshooting

### Problem: Migration fails with "relation already exists"

**Solution**: Table was created manually or migration already ran
```bash
# Check current migration
alembic current

# If table exists, mark migration as complete without running
alembic stamp head
```

### Problem: "No 'request' argument" error with rate limiting

**Solution**: Add `request: Request` parameter to endpoint
```python
async def my_endpoint(
    request: Request,  # Add this
    # ... other parameters
):
```

### Problem: 404 Not Found on new endpoint

**Solution**: Check router registration
```python
# In app/api/v1/router.py
router.include_router(your_new_router)  # Make sure this exists
```

### Problem: Validation error on response

**Solution**: Add [Config](file:///c:/External-projects/FastAPI/app/schemas/activity_log.py#34-36) class to response schema
```python
class YourResponse(BaseModel):
    # ... fields ...
    
    class Config:
        from_attributes = True  # Allows ORM to Pydantic conversion
```

### Problem: Can't access endpoint (403 Forbidden)

**Solution**: Check role requirements
```python
# Make sure user has correct role
# Or use get_current_user instead of require_roles if all users allowed
current_user: User = Depends(get_current_user)
```

---

## Quick Commands Reference

```bash
# Create migration
alembic revision -m "description"

# Run migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Check current migration
alembic current

# View migration history
alembic history

# Start development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Run tests
pytest

# Run tests with coverage
pytest --cov=app tests/
```

---

## Summary Flowchart

```
1. Create Model (app/models/*.py)
   ↓
2. Create Schemas (app/schemas/*.py)
   ↓
3. Create Migration (alembic revision -m "...")
   ↓
4. Run Migration (alembic upgrade head)
   ↓
5. Create Repository (app/repositories/*_repository.py)
   ↓
6. Create Service (app/services/*_service.py)
   ↓
7. Create Endpoints (app/api/v1/endpoints/*.py)
   ↓
8. Add RBAC (require_roles)
   ↓
9. Add Activity Logging (log_create, log_update, log_delete)
   ↓
10. Register Router (app/api/v1/router.py)
   ↓
11. Test (Swagger UI or cURL)
```

---

## Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **SQLAlchemy 2.0 Documentation**: https://docs.sqlalchemy.org/en/20/
- **Pydantic Documentation**: https://docs.pydantic.dev/
- **Alembic Documentation**: https://alembic.sqlalchemy.org/

---

**Happy Coding! 🚀**
