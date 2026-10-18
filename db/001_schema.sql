DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO norma_app;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_len CHECK (char_length(email) BETWEEN 5 AND 254)
);

CREATE TABLE diet_types (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  kcal_min integer NOT NULL,
  kcal_max integer NOT NULL,
  sort_order integer NOT NULL UNIQUE
);

CREATE TABLE meal_plans (
  id uuid PRIMARY KEY,
  diet_type_id uuid NOT NULL REFERENCES diet_types (id),
  name text NOT NULL,
  duration_days integer NOT NULL CHECK (duration_days IN (1, 7)),
  price_kopecks integer NOT NULL CHECK (price_kopecks > 0),
  description text NOT NULL,
  kcal_per_day integer NOT NULL CHECK (kcal_per_day > 0),
  meals_per_day integer NOT NULL CHECK (meals_per_day = 4),
  UNIQUE (diet_type_id, duration_days)
);

CREATE TABLE meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL REFERENCES meal_plans (id) ON DELETE CASCADE,
  day_index integer NOT NULL CHECK (day_index BETWEEN 1 AND 7),
  slot text NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'snack', 'dinner')),
  title text NOT NULL,
  description text NOT NULL,
  kcal integer NOT NULL CHECK (kcal > 0),
  protein_g integer NOT NULL CHECK (protein_g >= 0),
  fat_g integer NOT NULL CHECK (fat_g >= 0),
  carbs_g integer NOT NULL CHECK (carbs_g >= 0),
  UNIQUE (meal_plan_id, day_index, slot)
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id),
  meal_plan_id uuid NOT NULL REFERENCES meal_plans (id),
  start_date date NOT NULL,
  delivery_slot text NOT NULL CHECK (delivery_slot IN ('10-14', '14-18', '18-22')),
  city text NOT NULL,
  street text NOT NULL,
  house text NOT NULL,
  apartment text,
  comment text,
  phone text NOT NULL,
  status text NOT NULL CHECK (status IN ('awaiting_payment', 'payment_failed', 'paid', 'delivered')),
  total_kopecks integer NOT NULL CHECK (total_kopecks > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_user_created_idx ON orders (user_id, created_at DESC);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders (id),
  status text NOT NULL CHECK (status IN ('succeeded', 'declined')),
  last4 text,
  amount_kopecks integer NOT NULL CHECK (amount_kopecks > 0),
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_last4_len CHECK (last4 IS NULL OR char_length(last4) = 4)
);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  level text NOT NULL,
  event text NOT NULL,
  user_id uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION app_register_user(
  p_email text,
  p_password_hash text,
  p_name text,
  p_phone text
) RETURNS TABLE (id uuid, email text, name text, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_email text := lower(trim(p_email));
BEGIN
  RETURN QUERY
  INSERT INTO users AS u (email, password_hash, name, phone)
  VALUES (clean_email, p_password_hash, trim(p_name), p_phone)
  RETURNING u.id, u.email, u.name, u.phone;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'email_taken' USING ERRCODE = 'unique_violation';
END;
$$;

CREATE FUNCTION app_find_user_by_email(p_email text)
RETURNS TABLE (id uuid, email text, password_hash text, name text, phone text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email, u.password_hash, u.name, u.phone
  FROM users u
  WHERE u.email = lower(trim(p_email));
$$;

CREATE FUNCTION app_order_owner(p_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM orders WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION app_register_user(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_find_user_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_order_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_register_user(text, text, text, text) TO norma_app;
GRANT EXECUTE ON FUNCTION app_find_user_by_email(text) TO norma_app;
GRANT EXECUTE ON FUNCTION app_order_owner(uuid) TO norma_app;

GRANT SELECT (id, email, name, phone) ON users TO norma_app;
GRANT SELECT ON diet_types, meal_plans, meals TO norma_app;
GRANT SELECT, INSERT, UPDATE ON orders TO norma_app;
GRANT SELECT, INSERT ON payments TO norma_app;
GRANT INSERT ON audit_log TO norma_app;
GRANT USAGE, SELECT ON SEQUENCE audit_log_id_seq TO norma_app;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_select_self ON users
  FOR SELECT TO norma_app
  USING (id::text = current_setting('app.user_id', true));

ALTER TABLE diet_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_types FORCE ROW LEVEL SECURITY;
CREATE POLICY diets_read ON diet_types
  FOR SELECT TO norma_app
  USING (true);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans FORCE ROW LEVEL SECURITY;
CREATE POLICY plans_read ON meal_plans
  FOR SELECT TO norma_app
  USING (true);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals FORCE ROW LEVEL SECURITY;
CREATE POLICY meals_read ON meals
  FOR SELECT TO norma_app
  USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
CREATE POLICY orders_select_own ON orders
  FOR SELECT TO norma_app
  USING (user_id::text = current_setting('app.user_id', true));
CREATE POLICY orders_insert_own ON orders
  FOR INSERT TO norma_app
  WITH CHECK (user_id::text = current_setting('app.user_id', true));
CREATE POLICY orders_update_own ON orders
  FOR UPDATE TO norma_app
  USING (user_id::text = current_setting('app.user_id', true))
  WITH CHECK (user_id::text = current_setting('app.user_id', true));

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
CREATE POLICY payments_select_own ON payments
  FOR SELECT TO norma_app
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = payments.order_id
        AND o.user_id::text = current_setting('app.user_id', true)
    )
  );
CREATE POLICY payments_insert_own ON payments
  FOR INSERT TO norma_app
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = payments.order_id
        AND o.user_id::text = current_setting('app.user_id', true)
    )
  );

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_insert ON audit_log
  FOR INSERT TO norma_app
  WITH CHECK (true);
