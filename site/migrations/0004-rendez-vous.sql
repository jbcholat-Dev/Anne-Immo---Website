-- Migration 0004 (story 10.6) : date et heure du rendez-vous réservé dans Cal.com (lead `rdv`), en UTC, ISO 8601.
-- Gardée sur le lead pour que la notification à Anne puisse être rejouée sans relire Cal.com.
ALTER TABLE lead ADD COLUMN rdv_start TEXT;
