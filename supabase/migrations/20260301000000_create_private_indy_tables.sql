CREATE SCHEMA IF NOT EXISTS private;

-- ============================================================
-- indy_credentials
-- ============================================================
CREATE TABLE private.indy_credentials (
    id                 bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at         timestamp with time zone NOT NULL DEFAULT now(),
    username           text NOT NULL,
    encrypted_password text NOT NULL,
    user_id            uuid NOT NULL UNIQUE,
    CONSTRAINT indy_credentials_pkey PRIMARY KEY (id),
    CONSTRAINT indy_credentials_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE private.indy_credentials ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON private.indy_credentials TO authenticated;

CREATE POLICY "indy_credentials: select own row"
    ON private.indy_credentials FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "indy_credentials: insert own row"
    ON private.indy_credentials FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "indy_credentials: update own row"
    ON private.indy_credentials FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "indy_credentials: delete own row"
    ON private.indy_credentials FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================
-- refresh_tokens
-- ============================================================
CREATE TABLE private.refresh_tokens (
    id            bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    valid_until   date NOT NULL,
    refresh_token text NOT NULL,
    user_id       uuid NOT NULL UNIQUE,
    CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE private.refresh_tokens ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON private.refresh_tokens TO authenticated;

CREATE POLICY "refresh_tokens: select own row"
    ON private.refresh_tokens FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "refresh_tokens: insert own row"
    ON private.refresh_tokens FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "refresh_tokens: update own row"
    ON private.refresh_tokens FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "refresh_tokens: delete own row"
    ON private.refresh_tokens FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
