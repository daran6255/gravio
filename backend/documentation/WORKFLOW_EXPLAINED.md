# Feature Development Workflow: Explained with Examples

This guide explains the **Why**, **Purpose**, and provides a **Real-world Example** (creating a "Product" feature) for each step in our workflow.

## Step 1: Create the database model (`app/models/*.py`)

*   **Why**: Python doesn't know about databases by default. We use SQLAlchemy (an ORM) to represent database tables as Python classes.
*   **Purpose**: Defines the **structure** of your data—columns, data types, and constraints.
*   **Example**: You want to store products. You define a `Product` class with `name` (string) and `price` (float).
    ```python
    # app/models/product.py
    class Product(BaseModel):
        __tablename__ = "products"
        name: Mapped[str] = mapped_column(String, nullable=False)
        price: Mapped[float] = mapped_column(Float, nullable=False)
    ```

## Step 2: Create Pydantic schemas (`app/schemas/*.py`)

*   **Why**: We can't trust user input. Pydantic validates data *before* it touches our code/database. It also filters what we send back (hiding sensitive passwords).
*   **Purpose**: Defines the **API Contract**—what fields are required for requests (Input) and what fields are returned (Output).
*   **Example**: When creating a product, `price` must be positive.
    ```python
    # app/schemas/product.py
    class ProductCreate(BaseModel):
        name: str
        price: float
    ```

## Step 3: Create database migration (`alembic revision`)

*   **Why**: You wrote the Python model in Step 1, but the actual PostgreSQL database is still empty. It doesn't know about the "products" table yet.
*   **Purpose**: Generates a **script** that contains the raw SQL commands to create the table.
*   **Example**: Running `alembic revision ...` creates a file that says:
    ```python
    # alembic/versions/xxxx_create_product.py
    def upgrade():
        op.create_table('products', sa.Column('name', sa.String), ...)
    ```

## Step 4: Run migration (`alembic upgrade head`)

*   **Why**: The script from Step 3 is just a file sitting on your disk. It hasn't changed the database yet.
*   **Purpose**: **Executes** the script against the database. Now the table actually exists in PostgreSQL.
*   **Example**:
    ```bash
    $ alembic upgrade head
    INFO  [alembic] Running upgrade -> xxxx, create_product
    # Now you can query the 'products' table in pgAdmin/psql.
    ```

## Step 5: Create repository (`app/repositories/*_repository.py`)

*   **Why**: We don't want raw database queries scattered everywhere. If we change databases later, or want to cache queries, existing code shouldn't break.
*   **Purpose**: Handles **Raw Data Access** (CRUD). It's the *only* place properly allowed to touch the database directly.
*   **Example**:
    ```python
    # app/repositories/product_repository.py
    class ProductRepository(BaseRepository[Product]):
        async def get_expensive_products(self):
            # Complex SQL logic lives here, not in the API
            return await self.db.execute(select(Product).where(Product.price > 1000))
    ```

## Step 6: Create service (`app/services/*_service.py`)

*   **Why**: Creating a user isn't just "insert into table". You might need to hash a password, send a welcome email, or check usage limits.
*   **Purpose**: Contains **Business Logic**. It coordinates multiple things (Repositories, Email Service, External APIs).
*   **Example**:
    ```python
    # app/services/product_service.py
    class ProductService:
        async def create_product(self, data):
            # Logic: Don't allow negative stock
            if data.stock < 0: raise Exception("Invalid stock")
            return await self.repo.create(data)
    ```

## Step 7: Create API endpoints (`app/api/v1/endpoints/*.py`)

*   **Why**: The browser/mobile app needs a URL to hit.
*   **Purpose**: Connects the **HTTP World** (URLs, JSON) to your **Python World** (Service layer).
*   **Example**:
    ```python
    # app/api/v1/endpoints/products.py
    @router.post("/products/")
    async def create_product(data: ProductCreate):
        return await service.create_product(data)
    ```

## Step 8: Add role-based access control

*   **Why**: You don't want a regular user deleting your entire database.
*   **Purpose**: **Security**. Restricts who can do what.
*   **Example**:
    ```python
    # Only Admins can delete
    @router.delete("/products/{id}", dependencies=[Depends(require_roles(["admin"]))])
    ```

## Step 9: Add activity logging

*   **Why**: If data mysteriously disappears, you need to know who deleted it and when.
*   **Purpose**: **Audit Trail**. Records important actions.
*   **Example**:
    ```python
    await log_delete(user_id=current_user.id, resource="product", id=product_id)
    ```

## Step 10: Register router (`app/api/v1/router.py`)

*   **Why**: You created the endpoint file in Step 7, but the main application doesn't know it exists yet.
*   **Purpose**: **Plug it in**. Adds your new URL paths to the running server.
*   **Example**:
    ```python
    # app/api/v1/router.py
    router.include_router(products.router)
    ```

## Step 11: Test the endpoints

*   **Why**: "It works on my machine" isn't enough.
*   **Purpose**: **Verification**. Use Postman or Swagger UI to make sure it actually works.
*   **Example**: Go to `http://localhost:8000/docs`, click "POST /products/", and see if it creates the product successfully.
