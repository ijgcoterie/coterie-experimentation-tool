-- SQL migration to add multi-variate experiment support
-- Run this against your Supabase database to add the variations column to the experiments table

-- Check if the table exists, and if not, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'experiments') THEN
        CREATE TABLE public.experiments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'draft',
            targeting JSONB NOT NULL DEFAULT '{}'::jsonb,
            code TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            published_at TIMESTAMPTZ,
            statsig_id TEXT,
            statsig_layer TEXT,
            is_from_statsig BOOLEAN NOT NULL DEFAULT false
        );
    END IF;
END
$$;

-- Add variations column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'experiments'
        AND column_name = 'variations'
    ) THEN
        ALTER TABLE public.experiments ADD COLUMN variations JSONB DEFAULT '[]'::jsonb;
        
        -- Migrate existing data to the new structure
        UPDATE public.experiments
        SET variations = jsonb_build_array(
            jsonb_build_object(
                'id', 'var-control-' || substr(md5(random()::text), 1, 8),
                'name', 'Control',
                'code', '',
                'weight', 50
            ),
            jsonb_build_object(
                'id', 'var-treatment-' || substr(md5(random()::text), 1, 8),
                'name', 'Treatment',
                'code', code,
                'weight', 50
            )
        )
        WHERE code IS NOT NULL AND code != '';
    END IF;
END
$$;

-- Update RLS policies (if using RLS)
-- Uncomment and modify as needed for your specific security requirements

-- ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow select for all users" ON public.experiments
--     FOR SELECT
--     TO authenticated
--     USING (true);

-- CREATE POLICY "Allow insert for authenticated users" ON public.experiments
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (true);

-- CREATE POLICY "Allow update for authenticated users" ON public.experiments
--     FOR UPDATE
--     TO authenticated
--     USING (true)
--     WITH CHECK (true);

-- CREATE POLICY "Allow delete for authenticated users" ON public.experiments
--     FOR DELETE
--     TO authenticated
--     USING (true);