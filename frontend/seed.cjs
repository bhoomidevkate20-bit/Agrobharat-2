const { createClient } = require('@supabase/supabase-js');

const URL = 'https://sqmtkididvyiqqvqxisp.supabase.co';
const KEY = 'sb_publishable_v_mQseoIDdU-AE3q1RkGNA_DjAVKi-5';

async function seed() {
  console.log('--- Starting Demo Data Seed ---');

  // 1. Sign in Farmer
  const farmerClient = createClient(URL, KEY);
  const { data: fAuth, error: fErr } = await farmerClient.auth.signInWithPassword({
    email: 'farmer.demo@agrobharat.org',
    password: 'Password123!'
  });
  if (fErr) throw new Error('Farmer signin failed: ' + fErr.message);
  console.log('Farmer logged in:', fAuth.user.id);

  // Update farmer profile details
  await farmerClient.from('profiles').update({
    full_name: 'Ramesh Patil (Krishi Ratna Farmer)',
    location: 'Baramati, Pune, Maharashtra',
    upi_id: 'ramesh.patil@okaxis',
    payment_phone: '+91 98221 00001',
    is_subscribed: true
  }).eq('id', fAuth.user.id);

  // 2. Sign in Inspector
  const inspClient = createClient(URL, KEY);
  const { data: iAuth, error: iErr } = await inspClient.auth.signInWithPassword({
    email: 'inspector.demo@agrobharat.org',
    password: 'Password123!'
  });
  if (iErr) throw new Error('Inspector signin failed: ' + iErr.message);
  console.log('Inspector logged in:', iAuth.user.id);

  await inspClient.from('profiles').update({
    full_name: 'Dr. Rajesh Sharma (Field Assayer)',
    location: 'Nashik / Pune Region',
    certified_id: 'AGMARK-INSP-MH-4091',
    qualification: 'M.Sc. Agronomy, FSSAI Certified Grain Quality Assayer'
  }).eq('id', iAuth.user.id);

  // 3. Sign in FPO
  const fpoClient = createClient(URL, KEY);
  const { data: fpoAuth, error: fpoErr } = await fpoClient.auth.signInWithPassword({
    email: 'fpo.demo@agrobharat.org',
    password: 'Password123!'
  });
  if (fpoErr) throw new Error('FPO signin failed: ' + fpoErr.message);
  console.log('FPO logged in:', fpoAuth.user.id);

  await fpoClient.from('profiles').update({
    full_name: 'Sahyadri Farmers Producer Co.',
    location: 'Nashik, Maharashtra',
    field_inspector_id: iAuth.user.id,
    upi_id: 'sahyadri.fpo@icici',
    payment_phone: '+91 98221 00002',
    is_subscribed: true
  }).eq('id', fpoAuth.user.id);

  // 4. Sign in Delivery Agent
  const delivClient = createClient(URL, KEY);
  const { data: dAuth, error: dErr } = await delivClient.auth.signInWithPassword({
    email: 'delivery.demo@agrobharat.org',
    password: 'Password123!'
  });
  if (dErr) throw new Error('Delivery signin failed: ' + dErr.message);
  console.log('Delivery Agent logged in:', dAuth.user.id);

  await delivClient.from('profiles').update({
    full_name: 'Vikram Shinde (Kisan Express Logistics)',
    location: 'Satara / Pune Highway Hub',
    upi_id: 'vikram.kisanlogistics@oksbi',
    payment_phone: '+91 98221 00003',
    is_subscribed: true
  }).eq('id', dAuth.user.id);

  // 5. Sign in Customer
  const custClient = createClient(URL, KEY);
  const { data: cAuth, error: cErr } = await custClient.auth.signInWithPassword({
    email: 'customer.demo@agrobharat.org',
    password: 'Password123!'
  });
  if (cErr) throw new Error('Customer signin failed: ' + cErr.message);
  console.log('Customer logged in:', cAuth.user.id);

  await custClient.from('profiles').update({
    full_name: 'Pooja Agro Traders (Wholesale & Retail)',
    location: 'Market Yard, Gultekdi, Pune'
  }).eq('id', cAuth.user.id);

  // Create Listings from Farmer
  const farmerCrops = [
    { crop_type: 'Sharbati Premium Wheat', quantity_kg: 1200, price_per_kg: 34, location: 'Baramati, Pune', moisture_pct: 10.5, harvested_date: '2026-09-18' },
    { crop_type: 'Basmati Paddy (Pusa 1121)', quantity_kg: 2500, price_per_kg: 42, location: 'Baramati, Pune', moisture_pct: 12.0, harvested_date: '2026-09-15' },
    { crop_type: 'Yellow Maize (Corn)', quantity_kg: 1800, price_per_kg: 24, location: 'Indapur, Pune', moisture_pct: 11.8, harvested_date: '2026-09-21' },
    { crop_type: 'Organic Soybean (JS 335)', quantity_kg: 950, price_per_kg: 52, location: 'Baramati, Pune', moisture_pct: 9.8, harvested_date: '2026-09-22' },
    { crop_type: 'Desi Chana (Bengal Gram)', quantity_kg: 600, price_per_kg: 68, location: 'Phaltan, Satara', moisture_pct: 10.2, harvested_date: '2026-09-24' } // Keep 1 pending inspection for demo
  ];

  const createdListings = [];
  for (let i = 0; i < farmerCrops.length; i++) {
    const c = farmerCrops[i];
    const { data: l, error: err } = await farmerClient.from('listings').insert({
      owner_id: fAuth.user.id,
      owner_role: 'farmer',
      ...c
    }).select().single();
    if (err) console.error('Insert crop error:', err);
    else {
      console.log('Inserted listing:', l.crop_type, l.id);
      createdListings.push(l);
    }
  }

  // Grade the first 4 listings with Inspector (Grade A & B)
  // Leave the 5th (Desi Chana) as pending_inspection so the Inspector Dashboard has live item to grade during demo!
  for (let i = 0; i < 4; i++) {
    const l = createdListings[i];
    const grade = i === 1 ? 'B' : 'A';
    const expiry = '2026-12-31';
    await inspClient.from('listings').update({
      grade,
      expiry_date: expiry,
      status: 'approved'
    }).eq('id', l.id);
    console.log('Graded listing', l.crop_type, 'as Grade', grade);
  }

  // FPO bulk listing
  const { data: fpoListing, error: fpoLErr } = await fpoClient.from('listings').insert({
    owner_id: fpoAuth.user.id,
    owner_role: 'fpo',
    crop_type: 'Aggregated Maharashtra Pearl Millet (Bajra)',
    quantity_kg: 5000,
    price_per_kg: 26,
    location: 'Nashik Aggregation Hub'
  }).select().single();
  if (fpoLErr) console.error('FPO listing error:', fpoLErr);
  else {
    // Grade FPO listing
    await inspClient.from('listings').update({
      grade: 'A',
      expiry_date: '2026-11-30',
      status: 'approved'
    }).eq('id', fpoListing.id);
    console.log('Graded FPO listing as Grade A');
  }

  // FPO places Bids on Farmer's Wheat and Soybean
  if (createdListings[0]) {
    await fpoClient.from('bids').insert({
      listing_id: createdListings[0].id,
      bidder_id: fpoAuth.user.id,
      bidder_role: 'fpo',
      quantity_kg: 500,
      offered_price_per_kg: 33,
      status: 'pending'
    });
    console.log('FPO bid placed on Wheat');
  }

  if (createdListings[3]) {
    const { data: bid2 } = await fpoClient.from('bids').insert({
      listing_id: createdListings[3].id,
      bidder_id: fpoAuth.user.id,
      bidder_role: 'fpo',
      quantity_kg: 400,
      offered_price_per_kg: 51,
      status: 'accepted'
    }).select().single();
    console.log('FPO bid placed on Soybean (accepted)');
  }

  // Customer places Orders
  // Order 1: Sharbati Wheat - delivered & rated
  if (createdListings[0]) {
    const { data: ord1 } = await custClient.from('orders').insert({
      listing_id: createdListings[0].id,
      buyer_id: cAuth.user.id,
      quantity_kg: 100,
      product_price: 100 * 34,
      delivery_charge: 40,
      delivery_address: 'Shop 14, Grain Market, Market Yard, Pune - 411037',
      payment_method: 'UPI',
      status: 'delivered'
    }).select().single();
    console.log('Order 1 placed & delivered:', ord1.id);

    // Create delivery row for order 1
    const { data: del1 } = await farmerClient.from('deliveries').insert({
      order_id: ord1.id,
      delivery_agent_id: dAuth.user.id,
      pickup_location: 'Farm gate, Baramati, Pune',
      dropoff_location: ord1.delivery_address,
      weight_kg: 100,
      status: 'delivered'
    }).select().single();

    // Rating on Order 1
    await custClient.from('ratings').insert({
      order_id: ord1.id,
      rater_id: cAuth.user.id,
      ratee_id: fAuth.user.id,
      ratee_role: 'farmer',
      quality: 5,
      quantity_accuracy: 5,
      timeliness: 4.8,
      comment: 'Top quality Sharbati wheat! Very dry, well-cleaned seeds. Highly recommended.'
    });
    console.log('Rating created on Order 1');
  }

  // Order 2: Basmati Paddy - out_for_delivery (accepted by delivery agent)
  if (createdListings[1]) {
    const { data: ord2 } = await custClient.from('orders').insert({
      listing_id: createdListings[1].id,
      buyer_id: cAuth.user.id,
      quantity_kg: 150,
      product_price: 150 * 42,
      delivery_charge: 40,
      delivery_address: 'Kalyani Nagar Wholesalers, Pune - 411006',
      payment_method: 'Card',
      status: 'out_for_delivery'
    }).select().single();

    await farmerClient.from('deliveries').insert({
      order_id: ord2.id,
      delivery_agent_id: dAuth.user.id,
      pickup_location: 'Indapur Depot, Pune',
      dropoff_location: ord2.delivery_address,
      weight_kg: 150,
      status: 'picked_up'
    });
    console.log('Order 2 active (picked_up)');
  }

  // Order 3: Yellow Maize - newly placed, ready for dispatch by farmer
  if (createdListings[2]) {
    const { data: ord3 } = await custClient.from('orders').insert({
      listing_id: createdListings[2].id,
      buyer_id: cAuth.user.id,
      quantity_kg: 80,
      product_price: 80 * 24,
      delivery_charge: 40,
      delivery_address: 'Hadapsar Agro Hub, Pune - 411028',
      payment_method: 'UPI',
      status: 'placed'
    }).select().single();
    console.log('Order 3 placed (awaiting dispatch on Farmer dashboard)');
  }

  // Also create an open delivery job for the Delivery Agent's board!
  // To do this, create an order that is 'confirmed' and dispatched into 'deliveries' with status 'open'
  if (createdListings[0]) {
    const { data: ord4 } = await custClient.from('orders').insert({
      listing_id: createdListings[0].id,
      buyer_id: cAuth.user.id,
      quantity_kg: 60,
      product_price: 60 * 34,
      delivery_charge: 40,
      delivery_address: 'Kothrud Grain Store, Paud Road, Pune',
      payment_method: 'Cash on Delivery',
      status: 'confirmed'
    }).select().single();

    const { data: delOpen } = await farmerClient.from('deliveries').insert({
      order_id: ord4.id,
      pickup_location: 'Baramati Warehouse #3, Pune',
      dropoff_location: ord4.delivery_address,
      weight_kg: 60,
      status: 'open'
    }).select().single();
    console.log('Created open delivery job on dispatch board:', delOpen.id);
  }

  console.log('--- Seeding Completed Successfully! ---');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
