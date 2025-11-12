-- SQL script to add structured quote data to existing quote-sent bookings
-- This can be run manually if needed to backfill data

UPDATE bookings 
SET 
  quote_description = 'Custom Service Quote',
  quote_duration = '1',  
  quote_notes = 'Quote details extracted from notes field',
  quote_sent_at = updated_at
WHERE payment_status = 'quote-sent' 
  AND quote_description IS NULL;
