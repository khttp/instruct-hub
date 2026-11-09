ALTER TABLE lectures
    ALTER COLUMN cloudflare_stream_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS mux_playback_id VARCHAR(255);
