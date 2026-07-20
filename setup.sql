-- SQL para configurar o banco de dados no Supabase

-- 1. Tabela de Perfis (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para Perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Tabela de Importações (Imports)
-- Se a tabela já existir, este script adicionará as colunas faltantes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'imports') THEN
        CREATE TABLE public.imports (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            original_filename TEXT NOT NULL,
            file_size_bytes BIGINT,
            total_rows INTEGER DEFAULT 0,
            valid_rows INTEGER DEFAULT 0,
            invalid_rows INTEGER DEFAULT 0,
            inserted_rows INTEGER DEFAULT 0,
            updated_rows INTEGER DEFAULT 0,
            ignored_rows INTEGER DEFAULT 0,
            unique_orders INTEGER DEFAULT 0,
            minimum_order_date TIMESTAMPTZ,
            maximum_order_date TIMESTAMPTZ,
            gmv_total NUMERIC DEFAULT 0,
            estimated_commission_total NUMERIC DEFAULT 0,
            status TEXT DEFAULT 'processing',
            warnings TEXT[] DEFAULT '{}',
            error_message TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            completed_at TIMESTAMPTZ
        );
    ELSE
        -- Adicionar colunas se elas não existirem (para quem já tem a tabela)
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='imports' AND column_name='valid_rows') THEN
            ALTER TABLE public.imports ADD COLUMN valid_rows INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='imports' AND column_name='unique_orders') THEN
            ALTER TABLE public.imports ADD COLUMN unique_orders INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='imports' AND column_name='minimum_order_date') THEN
            ALTER TABLE public.imports ADD COLUMN minimum_order_date TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='imports' AND column_name='maximum_order_date') THEN
            ALTER TABLE public.imports ADD COLUMN maximum_order_date TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='imports' AND column_name='warnings') THEN
            ALTER TABLE public.imports ADD COLUMN warnings TEXT[] DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='imports' AND column_name='completed_at') THEN
            ALTER TABLE public.imports ADD COLUMN completed_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='imports' AND column_name='inserted_rows') THEN
            ALTER TABLE public.imports ADD COLUMN inserted_rows INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='imports' AND column_name='updated_rows') THEN
            ALTER TABLE public.imports ADD COLUMN updated_rows INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='imports' AND column_name='ignored_rows') THEN
            ALTER TABLE public.imports ADD COLUMN ignored_rows INTEGER DEFAULT 0;
        END IF;
    END IF;
END $$;

-- Habilitar RLS para Importações
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias importações" 
ON public.imports FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias importações" 
ON public.imports FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias importações" 
ON public.imports FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Tabela de Linhas de Pedidos (Affiliate Order Rows)
CREATE TABLE IF NOT EXISTS public.affiliate_order_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    import_id UUID REFERENCES public.imports(id) ON DELETE CASCADE,
    row_identity TEXT UNIQUE NOT NULL,
    row_fingerprint TEXT,
    order_id TEXT NOT NULL,
    sku_id TEXT,
    product_id TEXT,
    product_name TEXT,
    store_name TEXT,
    items_sold INTEGER DEFAULT 1,
    items_refunded INTEGER DEFAULT 0,
    order_type TEXT,
    original_settlement_status TEXT,
    normalized_settlement_status TEXT,
    content_type_original TEXT,
    content_type_normalized TEXT,
    content_id TEXT,
    traffic_source TEXT,
    gmv NUMERIC DEFAULT 0,
    standard_estimated_commission NUMERIC DEFAULT 0,
    shop_ads_estimated_commission NUMERIC DEFAULT 0,
    estimated_bonus NUMERIC DEFAULT 0,
    partner_agency_estimated_bonus NUMERIC DEFAULT 0,
    estimated_commission NUMERIC DEFAULT 0,
    order_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para Linhas de Pedidos
ALTER TABLE public.affiliate_order_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias linhas" 
ON public.affiliate_order_rows FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir/atualizar suas próprias linhas" 
ON public.affiliate_order_rows FOR ALL 
USING (auth.uid() = user_id);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliate_rows_user_date ON public.affiliate_order_rows(user_id, order_date);
CREATE INDEX IF NOT EXISTS idx_affiliate_rows_import_id ON public.affiliate_order_rows(import_id);

-- 5. Funções RPC para Agregação Eficiente (Evita limite de 1000 linhas do Supabase REST)

-- Sumário do Dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(p_start_at TIMESTAMPTZ, p_end_at_exclusive TIMESTAMPTZ)
RETURNS TABLE(gmv_total NUMERIC, commission_total NUMERIC, orders_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(gmv), 0) as gmv_total,
    COALESCE(SUM(estimated_commission), 0) as commission_total,
    COUNT(DISTINCT order_id) as orders_count
  FROM public.affiliate_order_rows
  WHERE user_id = auth.uid()
    AND order_date >= p_start_at
    AND order_date < p_end_at_exclusive;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Métricas por Status
CREATE OR REPLACE FUNCTION public.get_status_metrics(p_start_at TIMESTAMPTZ, p_end_at_exclusive TIMESTAMPTZ)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH metrics AS (
    SELECT 
      normalized_settlement_status as status,
      COUNT(DISTINCT order_id) as count,
      SUM(gmv) as gmv,
      SUM(estimated_commission) as commission
    FROM public.affiliate_order_rows
    WHERE user_id = auth.uid()
      AND order_date >= p_start_at
      AND order_date < p_end_at_exclusive
    GROUP BY normalized_settlement_status
  )
  SELECT jsonb_object_agg(
    status, 
    jsonb_build_object('count', count, 'gmv', COALESCE(gmv, 0), 'commission', COALESCE(commission, 0))
  ) INTO result
  FROM metrics;

  RETURN jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(result, '{}'::jsonb),
          '{settled}', COALESCE(result->'settled', '{"count": 0, "gmv": 0, "commission": 0}'::jsonb)
        ),
        '{pending}', COALESCE(result->'pending', '{"count": 0, "gmv": 0, "commission": 0}'::jsonb)
      ),
      '{awaiting_payment}', COALESCE(result->'awaiting_payment', '{"count": 0, "gmv": 0, "commission": 0}'::jsonb)
    ),
    '{ineligible}', COALESCE(result->'ineligible', '{"count": 0, "gmv": 0, "commission": 0}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gráfico do Dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_chart(p_start_at TIMESTAMPTZ, p_end_at_exclusive TIMESTAMPTZ)
RETURNS TABLE(date TEXT, gmv NUMERIC, commission NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(order_date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as date,
    COALESCE(SUM(gmv), 0) as gmv,
    COALESCE(SUM(estimated_commission), 0) as commission
  FROM public.affiliate_order_rows
  WHERE user_id = auth.uid()
    AND order_date >= p_start_at
    AND order_date < p_end_at_exclusive
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comparação de Tipo de Conteúdo
CREATE OR REPLACE FUNCTION public.get_content_type_comparison(p_start_at TIMESTAMPTZ, p_end_at_exclusive TIMESTAMPTZ)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH stats AS (
    SELECT 
      COALESCE(content_type_normalized, 'other') as content,
      COUNT(DISTINCT order_id) as orders,
      SUM(gmv) as gmv,
      SUM(estimated_commission) as commission
    FROM public.affiliate_order_rows
    WHERE user_id = auth.uid()
      AND order_date >= p_start_at
      AND order_date < p_end_at_exclusive
    GROUP BY 1
  )
  SELECT jsonb_object_agg(
    content, 
    jsonb_build_object('orders', orders, 'gmv', COALESCE(gmv, 0), 'commission', COALESCE(commission, 0))
  ) INTO result
  FROM stats;

  RETURN jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(result, '{}'::jsonb),
        '{video}', COALESCE(result->'video', '{"orders": 0, "gmv": 0, "commission": 0}'::jsonb)
      ),
      '{live}', COALESCE(result->'live', '{"orders": 0, "gmv": 0, "commission": 0}'::jsonb)
    ),
    '{other}', COALESCE(result->'other', '{"orders": 0, "gmv": 0, "commission": 0}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comparação de Fonte de Tráfego
CREATE OR REPLACE FUNCTION public.get_traffic_source_comparison(p_start_at TIMESTAMPTZ, p_end_at_exclusive TIMESTAMPTZ)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH stats AS (
    SELECT 
      COALESCE(traffic_source, 'unknown') as traffic,
      COUNT(DISTINCT order_id) as orders,
      SUM(gmv) as gmv,
      SUM(estimated_commission) as commission
    FROM public.affiliate_order_rows
    WHERE user_id = auth.uid()
      AND order_date >= p_start_at
      AND order_date < p_end_at_exclusive
    GROUP BY 1
  )
  SELECT jsonb_object_agg(
    traffic, 
    jsonb_build_object('orders', orders, 'gmv', COALESCE(gmv, 0), 'commission', COALESCE(commission, 0))
  ) INTO result
  FROM stats;

  RETURN jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(result, '{}'::jsonb),
        '{organic}', COALESCE(result->'organic', '{"orders": 0, "gmv": 0, "commission": 0}'::jsonb)
      ),
      '{shop_ads}', COALESCE(result->'shop_ads', '{"orders": 0, "gmv": 0, "commission": 0}'::jsonb)
    ),
    '{unknown}', COALESCE(result->'unknown', '{"orders": 0, "gmv": 0, "commission": 0}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Top Produtos
CREATE OR REPLACE FUNCTION public.get_top_products(p_start_at TIMESTAMPTZ, p_end_at_exclusive TIMESTAMPTZ)
RETURNS TABLE(id TEXT, name TEXT, sold BIGINT, orders BIGINT, gmv NUMERIC, commission NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(product_id, product_name) as id,
    product_name as name,
    SUM(items_sold)::BIGINT as sold,
    COUNT(DISTINCT order_id)::BIGINT as orders,
    COALESCE(SUM(gmv), 0) as gmv,
    COALESCE(SUM(estimated_commission), 0) as commission
  FROM public.affiliate_order_rows
  WHERE user_id = auth.uid()
    AND order_date >= p_start_at
    AND order_date < p_end_at_exclusive
  GROUP BY 1, 2
  ORDER BY sold DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vendas por Hora
CREATE OR REPLACE FUNCTION public.get_sales_by_hour(p_start_at TIMESTAMPTZ, p_end_at_exclusive TIMESTAMPTZ)
RETURNS TABLE(hour INT, orders BIGINT, gmv NUMERIC, commission NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM order_date AT TIME ZONE 'America/Sao_Paulo')::INT as hour,
    COUNT(DISTINCT order_id)::BIGINT as orders,
    COALESCE(SUM(gmv), 0) as gmv,
    COALESCE(SUM(estimated_commission), 0) as commission
  FROM public.affiliate_order_rows
  WHERE user_id = auth.uid()
    AND order_date >= p_start_at
    AND order_date < p_end_at_exclusive
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vendas por Dia da Semana
CREATE OR REPLACE FUNCTION public.get_sales_by_weekday(p_start_at TIMESTAMPTZ, p_end_at_exclusive TIMESTAMPTZ)
RETURNS TABLE(day INT, orders BIGINT, gmv NUMERIC, commission NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(DOW FROM order_date AT TIME ZONE 'America/Sao_Paulo')::INT as day,
    COUNT(DISTINCT order_id)::BIGINT as orders,
    COALESCE(SUM(gmv), 0) as gmv,
    COALESCE(SUM(estimated_commission), 0) as commission
  FROM public.affiliate_order_rows
  WHERE user_id = auth.uid()
    AND order_date >= p_start_at
    AND order_date < p_end_at_exclusive
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Relatório Diário
CREATE OR REPLACE FUNCTION public.get_daily_report(p_start_at TIMESTAMPTZ, p_end_at_exclusive TIMESTAMPTZ)
RETURNS TABLE(date TEXT, orders BIGINT, gmv NUMERIC, commission NUMERIC, settled BIGINT, pending BIGINT, awaiting BIGINT, ineligible BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(order_date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as date,
    COUNT(DISTINCT order_id)::BIGINT as orders,
    COALESCE(SUM(gmv), 0) as gmv,
    COALESCE(SUM(estimated_commission), 0) as commission,
    COUNT(DISTINCT CASE WHEN normalized_settlement_status = 'settled' THEN order_id END)::BIGINT as settled,
    COUNT(DISTINCT CASE WHEN normalized_settlement_status = 'pending' THEN order_id END)::BIGINT as pending,
    COUNT(DISTINCT CASE WHEN normalized_settlement_status = 'awaiting_payment' THEN order_id END)::BIGINT as awaiting,
    COUNT(DISTINCT CASE WHEN normalized_settlement_status = 'ineligible' THEN order_id END)::BIGINT as ineligible
  FROM public.affiliate_order_rows
  WHERE user_id = auth.uid()
    AND order_date >= p_start_at
    AND order_date < p_end_at_exclusive
  GROUP BY 1
  ORDER BY 1 DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IMPORTANTE: Após rodar este SQL no painel do Supabase, 
-- se o erro "schema cache" persistir, o Supabase atualizará o cache automaticamente em alguns instantes.
