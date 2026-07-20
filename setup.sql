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

-- IMPORTANTE: Após rodar este SQL no painel do Supabase, 
-- se o erro "schema cache" persistir, o Supabase atualizará o cache automaticamente em alguns instantes.
