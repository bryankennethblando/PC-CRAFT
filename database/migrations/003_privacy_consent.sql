CREATE TABLE privacy_consents (
  user_id BIGINT UNSIGNED NOT NULL,
  notice_version VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, notice_version),
  CONSTRAINT fk_privacy_consents_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO schema_migrations (version) VALUES ('003_privacy_consent');
