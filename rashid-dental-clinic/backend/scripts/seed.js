/**
 * Seeds a working set of test data:
 *  - one admin account
 *  - one patient account
 *  - a few doctors
 *  - a few services
 *  - default clinic settings
 *
 * Run with: npm run seed
 * (Make sure MONGODB_URI is set in .env first.)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Service = require('../src/models/Service');
const ClinicSettings = require('../src/models/ClinicSettings');

const ADMIN_EMAIL = 'admin@rashiddental.com';
const ADMIN_PASSWORD = 'Admin@12345';
const PATIENT_EMAIL = 'patient@example.com';
const PATIENT_PASSWORD = 'Patient@12345';

async function seed() {
  await connectDB();

  // --- Admin account ---
  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = await User.create({
      name: 'Clinic Administrator',
      email: ADMIN_EMAIL,
      phone: '0000000000',
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`Created admin account -> email: ${ADMIN_EMAIL} / password: ${ADMIN_PASSWORD}`);
  } else {
    console.log('Admin account already exists, skipping.');
  }

  // --- Sample patient account ---
  let patient = await User.findOne({ email: PATIENT_EMAIL });
  if (!patient) {
    patient = await User.create({
      name: 'Test Patient',
      email: PATIENT_EMAIL,
      phone: '1111111111',
      password: PATIENT_PASSWORD,
      role: 'patient',
    });
    console.log(`Created patient account -> email: ${PATIENT_EMAIL} / password: ${PATIENT_PASSWORD}`);
  } else {
    console.log('Sample patient account already exists, skipping.');
  }

  // --- Doctors ---
  const doctorCount = await Doctor.countDocuments();
  if (doctorCount === 0) {
    await Doctor.insertMany([
      {
        name: 'Dr. Ayesha Rashid',
        specialization: 'General & Cosmetic Dentistry',
        biography: 'Over 12 years of experience in general and cosmetic dental care.',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00', end: '17:00' },
      },
      {
        name: 'Dr. Bilal Ahmed',
        specialization: 'Orthodontics',
        biography: 'Specialist in braces, aligners, and bite correction.',
        availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        workingHours: { start: '10:00', end: '18:00' },
      },
      {
        name: 'Dr. Sara Khan',
        specialization: 'Pediatric Dentistry',
        biography: 'Focused on gentle, friendly dental care for children.',
        availableDays: ['Tuesday', 'Thursday', 'Saturday'],
        workingHours: { start: '09:00', end: '14:00' },
      },
    ]);
    console.log('Seeded sample doctors.');
  } else {
    console.log('Doctors already exist, skipping.');
  }

  // --- Services ---
  const serviceCount = await Service.countDocuments();
  if (serviceCount === 0) {
    await Service.insertMany([
      { name: 'Dental Check-up & Cleaning', description: 'Routine exam and professional cleaning.', duration: 30, price: 50 },
      { name: 'Teeth Whitening', description: 'In-clinic professional whitening treatment.', duration: 60, price: 150 },
      { name: 'Root Canal Treatment', description: 'Full root canal procedure with follow-up.', duration: 90, price: 300 },
      { name: 'Braces Consultation', description: 'Initial orthodontic assessment.', duration: 30, price: 40 },
      { name: 'Tooth Extraction', description: 'Simple tooth extraction.', duration: 45, price: 100 },
    ]);
    console.log('Seeded sample services.');
  } else {
    console.log('Services already exist, skipping.');
  }

  // --- Clinic settings singleton ---
  await ClinicSettings.getSingleton();
  console.log('Ensured clinic settings document exists.');

  console.log('\nSeed complete.');
  console.log('----------------------------------------');
  console.log(`Admin login   -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Patient login -> ${PATIENT_EMAIL} / ${PATIENT_PASSWORD}`);
  console.log('----------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
