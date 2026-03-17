-- Seed: realistic auto shop demo data
-- Run with: psql $DATABASE_URL -f scripts/seed.sql

BEGIN;

-- 1. Customers
INSERT INTO customers (name, phone, email, address, vehicle_info, role, created_at)
VALUES
  ('Mike Johnson', '(310) 555-0182', 'mike.johnson@gmail.com', '1247 Oak Ave, Los Angeles, CA 90025',
   '{"year":2019,"make":"Toyota","model":"Camry","vin":"4T1B11HK5KU178432","mileage":67400}',
   'customer', NOW() - INTERVAL '45 days'),

  ('Sarah Chen', '(213) 555-0347', 'schen.la@gmail.com', '892 Maple Dr, Santa Monica, CA 90405',
   '{"year":2021,"make":"Honda","model":"CR-V","vin":"2HKRW2H88MH614572","mileage":28900}',
   'customer', NOW() - INTERVAL '30 days'),

  ('David Martinez', '(818) 555-0619', 'dmartinez@outlook.com', '3341 Sunset Blvd, West Hollywood, CA 90069',
   '{"year":2017,"make":"Ford","model":"F-150","vin":"1FTFW1ET8HFC34791","mileage":104200}',
   'customer', NOW() - INTERVAL '21 days'),

  ('Jennifer Park', '(323) 555-0255', 'jenn.park@icloud.com', '561 Beverly Glen Blvd, Los Angeles, CA 90024',
   '{"year":2022,"make":"BMW","model":"3 Series","vin":"WBA5R1C51NF873645","mileage":15300}',
   'customer', NOW() - INTERVAL '14 days'),

  ('Robert Kim', '(562) 555-0488', 'rkim.mech@gmail.com', '7823 Long Beach Ave, Long Beach, CA 90805',
   '{"year":2015,"make":"Chevrolet","model":"Silverado 1500","vin":"1GCUKNEC0FZ251842","mileage":142800}',
   'customer', NOW() - INTERVAL '7 days'),

  ('Amanda Torres', '(424) 555-0731', 'amanda.torres@yahoo.com', '234 Venice Blvd, Venice, CA 90291',
   '{"year":2020,"make":"Nissan","model":"Altima","vin":"1N4BL4DV5LC253891","mileage":41600}',
   'customer', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- 2. Orders — get the customer IDs we just inserted
DO $$
DECLARE
  c1 INT; c2 INT; c3 INT; c4 INT; c5 INT; c6 INT;
BEGIN
  SELECT id INTO c1 FROM customers WHERE email = 'mike.johnson@gmail.com' LIMIT 1;
  SELECT id INTO c2 FROM customers WHERE email = 'schen.la@gmail.com' LIMIT 1;
  SELECT id INTO c3 FROM customers WHERE email = 'dmartinez@outlook.com' LIMIT 1;
  SELECT id INTO c4 FROM customers WHERE email = 'jenn.park@icloud.com' LIMIT 1;
  SELECT id INTO c5 FROM customers WHERE email = 'rkim.mech@gmail.com' LIMIT 1;
  SELECT id INTO c6 FROM customers WHERE email = 'amanda.torres@yahoo.com' LIMIT 1;

  -- Order 1: Completed — oil change + brake flush (Mike Johnson)
  INSERT INTO orders (
    customer_id, status, items, notes,
    subtotal_cents, vehicle_info,
    contact_name, contact_email, contact_phone,
    share_token, valid_days, expires_at,
    created_at, updated_at
  ) VALUES (
    c1, 'completed',
    '[
      {"service":"Full Synthetic Oil Change","description":"5W-30 full synthetic, includes filter","quantity":1,"unitPriceCents":9800,"totalCents":9800,"category":"labor"},
      {"service":"Brake Fluid Flush","description":"Complete system flush, DOT 4 fluid","quantity":1,"unitPriceCents":14000,"totalCents":14000,"category":"labor"},
      {"service":"Tire Rotation","description":"Rotate all four tires, adjust pressures","quantity":1,"unitPriceCents":4500,"totalCents":4500,"category":"labor"},
      {"service":"Hazmat Disposal","description":"Fluid disposal fee","quantity":1,"unitPriceCents":1500,"totalCents":1500,"category":"fee"}
    ]'::jsonb,
    'Customer reported slight brake pedal softness. Brake fluid was dark and contaminated — recommended flush.',
    29800,
    '{"year":2019,"make":"Toyota","model":"Camry","mileage":67400}',
    'Mike Johnson', 'mike.johnson@gmail.com', '(310) 555-0182',
    encode(gen_random_bytes(32), 'hex'),
    30, NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '40 days', NOW() - INTERVAL '39 days'
  );

  -- Order 2: Paid — valve cover gasket + spark plugs (Mike Johnson, repeat customer)
  INSERT INTO orders (
    customer_id, status, items, notes,
    subtotal_cents, vehicle_info,
    contact_name, contact_email, contact_phone,
    share_token, valid_days, expires_at,
    created_at, updated_at
  ) VALUES (
    c1, 'paid',
    '[
      {"service":"Valve Cover Gasket","description":"OEM gasket replacement, includes new spark plug tube seals","quantity":1,"unitPriceCents":26600,"totalCents":26600,"category":"labor"},
      {"service":"Spark Plugs","description":"Set of 4 iridium plugs (NGK)","quantity":1,"unitPriceCents":25800,"totalCents":25800,"category":"labor"},
      {"service":"Hazmat Disposal","description":"Fluid disposal","quantity":1,"unitPriceCents":1500,"totalCents":1500,"category":"fee"},
      {"service":"Loyalty Discount","description":"Returning customer discount 10%","quantity":1,"unitPriceCents":-5400,"totalCents":-5400,"category":"discount"}
    ]'::jsonb,
    'Oil leak at valve cover confirmed. Also noticed plugs were original at 67k miles — replaced both together.',
    48500,
    '{"year":2019,"make":"Toyota","model":"Camry","mileage":67800}',
    'Mike Johnson', 'mike.johnson@gmail.com', '(310) 555-0182',
    encode(gen_random_bytes(32), 'hex'),
    30, NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'
  );

  -- Order 3: Approved — timing belt + water pump (Sarah Chen)
  INSERT INTO orders (
    customer_id, status, items, notes,
    subtotal_cents, price_range_low_cents, price_range_high_cents,
    vehicle_info,
    contact_name, contact_email, contact_phone,
    share_token, valid_days, expires_at,
    created_at, updated_at
  ) VALUES (
    c2, 'approved',
    '[
      {"service":"Timing Belt Replacement","description":"Gates OEM-spec belt + tensioner kit","quantity":1,"unitPriceCents":68000,"totalCents":68000,"category":"labor"},
      {"service":"Water Pump Replacement","description":"Recommended while timing cover is off","quantity":1,"unitPriceCents":22000,"totalCents":22000,"category":"labor"},
      {"service":"Coolant System Flush","description":"Drain and refill with Honda green coolant","quantity":1,"unitPriceCents":9500,"totalCents":9500,"category":"labor"},
      {"service":"Shop Supplies","description":"Seals, gaskets, misc hardware","quantity":1,"unitPriceCents":3500,"totalCents":3500,"category":"fee"}
    ]'::jsonb,
    'Timing belt due at 30k / every 3 years per Honda spec. Strongly recommended water pump replacement at same visit — labor is shared.',
    103000, 98000, 115000,
    '{"year":2021,"make":"Honda","model":"CR-V","mileage":28900}',
    'Sarah Chen', 'schen.la@gmail.com', '(213) 555-0347',
    encode(gen_random_bytes(32), 'hex'),
    30, NOW() + INTERVAL '28 days',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'
  );

  -- Order 4: Sent — front brake pads + rotors (David Martinez)
  INSERT INTO orders (
    customer_id, status, items, notes,
    subtotal_cents, price_range_low_cents, price_range_high_cents,
    vehicle_info,
    contact_name, contact_email, contact_phone,
    share_token, valid_days, expires_at,
    created_at, updated_at
  ) VALUES (
    c3, 'sent',
    '[
      {"service":"Front Brake Pads","description":"OEM-grade ceramic pads (Akebono)","quantity":1,"unitPriceCents":18500,"totalCents":18500,"category":"labor"},
      {"service":"Front Brake Rotors","description":"Drilled & slotted rotors x2 (Power Stop)","quantity":2,"unitPriceCents":15000,"totalCents":30000,"category":"labor"},
      {"service":"Brake Caliper Lube","description":"Slide pins cleaned and lubricated","quantity":1,"unitPriceCents":3000,"totalCents":3000,"category":"labor"},
      {"service":"Hazmat Disposal","description":"Brake dust disposal","quantity":1,"unitPriceCents":1000,"totalCents":1000,"category":"fee"}
    ]'::jsonb,
    'Brake squeal reported. Front pads at 2mm (min 3mm). Rotors measure 25.8mm (min 26mm) — both need replacement.',
    52500, 49000, 58000,
    '{"year":2017,"make":"Ford","model":"F-150","mileage":104200}',
    'David Martinez', 'dmartinez@outlook.com', '(818) 555-0619',
    encode(gen_random_bytes(32), 'hex'),
    30, NOW() + INTERVAL '27 days',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
  );

  -- Order 5: Draft — AC recharge (Jennifer Park)
  INSERT INTO orders (
    customer_id, status, items, notes,
    subtotal_cents, price_range_low_cents, price_range_high_cents,
    vehicle_info,
    contact_name, contact_email, contact_phone,
    share_token, valid_days, expires_at,
    created_at, updated_at
  ) VALUES (
    c4, 'draft',
    '[
      {"service":"AC Performance Inspection","description":"Check refrigerant level, test compressor, check for leaks","quantity":1,"unitPriceCents":8500,"totalCents":8500,"category":"labor"},
      {"service":"AC Recharge (R-134a)","description":"Evacuate and recharge to manufacturer spec — estimate pending inspection","quantity":1,"unitPriceCents":18000,"totalCents":18000,"category":"labor"},
      {"service":"Cabin Air Filter","description":"Replacement recommended — last changed unknown","quantity":1,"unitPriceCents":4500,"totalCents":4500,"category":"labor"}
    ]'::jsonb,
    'Customer reports warm air from AC. Complaint started 2 weeks ago. Possibly low on refrigerant or compressor issue — need to inspect before finalizing.',
    31000, 28000, 45000,
    '{"year":2022,"make":"BMW","model":"3 Series","mileage":15300}',
    'Jennifer Park', 'jenn.park@icloud.com', '(323) 555-0255',
    encode(gen_random_bytes(32), 'hex'),
    30, NOW() + INTERVAL '30 days',
    NOW(), NOW()
  );

  -- Order 6: In progress — transmission service (Robert Kim)
  INSERT INTO orders (
    customer_id, status, items, notes,
    subtotal_cents, vehicle_info,
    contact_name, contact_email, contact_phone,
    share_token, valid_days, expires_at,
    created_at, updated_at
  ) VALUES (
    c5, 'in_progress',
    '[
      {"service":"Transmission Fluid Service","description":"Drain and fill, Dexron VI ATF","quantity":1,"unitPriceCents":18500,"totalCents":18500,"category":"labor"},
      {"service":"Transfer Case Service","description":"4WD transfer case fluid change","quantity":1,"unitPriceCents":12000,"totalCents":12000,"category":"labor"},
      {"service":"Front Differential Service","description":"Fluid flush and refill","quantity":1,"unitPriceCents":11000,"totalCents":11000,"category":"labor"},
      {"service":"Rear Differential Service","description":"Fluid flush and refill","quantity":1,"unitPriceCents":11000,"totalCents":11000,"category":"labor"},
      {"service":"Shop Supplies","description":"Gaskets, drain plugs, cleanup","quantity":1,"unitPriceCents":2500,"totalCents":2500,"category":"fee"}
    ]'::jsonb,
    'High mileage truck — 142k miles, all drivetrain fluids overdue. Full drivetrain service recommended. Currently in bay 2.',
    55000,
    '{"year":2015,"make":"Chevrolet","model":"Silverado 1500","mileage":142800}',
    'Robert Kim', 'rkim.mech@gmail.com', '(562) 555-0488',
    encode(gen_random_bytes(32), 'hex'),
    30, NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '2 days', NOW()
  );

  -- Order 7: Draft — check engine + oil change (Amanda Torres)
  INSERT INTO orders (
    customer_id, status, items, notes,
    subtotal_cents, price_range_low_cents, price_range_high_cents,
    vehicle_info,
    contact_name, contact_email, contact_phone,
    share_token, valid_days, expires_at,
    created_at, updated_at
  ) VALUES (
    c6, 'draft',
    '[
      {"service":"Diagnostic Scan","description":"OBD-II scan, pull fault codes, inspect affected systems","quantity":1,"unitPriceCents":9500,"totalCents":9500,"category":"labor"},
      {"service":"Full Synthetic Oil Change","description":"0W-20 full synthetic, includes filter","quantity":1,"unitPriceCents":9800,"totalCents":9800,"category":"labor"}
    ]'::jsonb,
    'Check engine light on. Customer unsure how long — noticed it this morning. Also overdue for oil change.',
    19300, 19300, 55000,
    '{"year":2020,"make":"Nissan","model":"Altima","mileage":41600}',
    'Amanda Torres', 'amanda.torres@yahoo.com', '(424) 555-0731',
    encode(gen_random_bytes(32), 'hex'),
    30, NOW() + INTERVAL '30 days',
    NOW(), NOW()
  );

END $$;

COMMIT;

SELECT 'Seed complete!' AS status,
  (SELECT COUNT(*) FROM customers WHERE email IN (
    'mike.johnson@gmail.com','schen.la@gmail.com','dmartinez@outlook.com',
    'jenn.park@icloud.com','rkim.mech@gmail.com','amanda.torres@yahoo.com'
  )) AS customers_inserted,
  (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '50 days') AS orders_inserted;
