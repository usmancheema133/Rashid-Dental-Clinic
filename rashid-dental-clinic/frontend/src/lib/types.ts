export type Role = 'patient' | 'admin';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  accountStatus: 'active' | 'inactive' | 'suspended';
};

export type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  biography: string;
  profileImage: string;
  availableDays: string[];
  workingHours: { start: string; end: string };
  accountStatus: 'active' | 'inactive';
};

export type Service = {
  _id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  status: 'active' | 'inactive';
};

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'rescheduled'
  | 'cancelled'
  | 'completed';

export type StatusHistoryEntry = {
  status: AppointmentStatus;
  changedAt: string;
  note?: string;
};

export type PopulatedPatient = { _id: string; name: string; email: string; phone: string };
export type PopulatedDoctor = { _id: string; name: string; specialization?: string; profileImage?: string };
export type PopulatedService = { _id: string; name: string; duration?: number; price?: number };

export type Appointment = {
  _id: string;
  bookingReference: string;
  patient: PopulatedPatient | string;
  doctor: PopulatedDoctor | string;
  service: PopulatedService | string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string;
  cancellationReason: string;
  statusHistory: StatusHistoryEntry[];
  createdDate: string;
  updatedDate: string;
};

export type ClinicDayHours = {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

export type ClinicSettings = {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  workingHours: ClinicDayHours[];
  slotDurationMinutes: number;
  onlineBookingEnabled: boolean;
};

export type Slot = { startTime: string; endTime: string };

export type DashboardStats = {
  totalPatients: number;
  totalDoctors: number;
  totalServices: number;
  appointments: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    today: number;
  };
};
