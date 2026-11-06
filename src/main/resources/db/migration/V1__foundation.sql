CREATE TABLE app_users (
    id uuid PRIMARY KEY,
    email varchar(255) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    role varchar(20) NOT NULL CHECK (role IN ('CUSTOMER', 'ADMIN')),
    created_at timestamptz NOT NULL,
    CONSTRAINT users_email_normalized CHECK (email = lower(email))
);

CREATE TABLE products (
    id uuid PRIMARY KEY,
    name varchar(160) NOT NULL CHECK (length(trim(name)) > 0),
    description varchar(2000) NOT NULL,
    sku varchar(64) NOT NULL UNIQUE,
    price numeric(19,2) NOT NULL CHECK (price BETWEEN 0 AND 999999999.99),
    active boolean NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT product_sku_format CHECK (sku ~ '^[A-Z0-9][A-Z0-9_-]{0,63}$')
);
CREATE INDEX idx_products_active_name ON products(active, name, id);

CREATE TABLE inventory (
    product_id uuid PRIMARY KEY REFERENCES products(id),
    quantity bigint NOT NULL DEFAULT 0 CHECK (quantity BETWEEN 0 AND 1000000000)
);

CREATE TABLE customer_orders (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES app_users(id),
    status varchar(20) NOT NULL CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    total numeric(19,2) NOT NULL CHECK (total >= 0),
    currency varchar(3) NOT NULL CHECK (currency = 'BRL'),
    created_at timestamptz NOT NULL,
    cancelled_at timestamptz,
    CONSTRAINT order_cancellation_state CHECK ((status = 'CANCELLED') = (cancelled_at IS NOT NULL))
);
CREATE INDEX idx_orders_owner_created ON customer_orders(user_id, created_at DESC, id);

CREATE TABLE order_items (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES customer_orders(id),
    product_id uuid NOT NULL REFERENCES products(id),
    sku varchar(64) NOT NULL,
    product_name varchar(160) NOT NULL,
    unit_price numeric(19,2) NOT NULL CHECK (unit_price BETWEEN 0 AND 999999999.99),
    quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 1000000),
    subtotal numeric(19,2) NOT NULL CHECK (subtotal = unit_price * quantity),
    position integer,
    UNIQUE (order_id, product_id)
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
