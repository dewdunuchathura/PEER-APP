
-- Event check-ins table (for QR code scans)
CREATE TABLE IF NOT EXISTS event_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_event_check_ins_user_id ON event_check_ins(user_id);
CREATE INDEX idx_event_check_ins_event_id ON event_check_ins(event_id);
CREATE INDEX idx_event_check_ins_checked_in_at ON event_check_ins(checked_in_at);
