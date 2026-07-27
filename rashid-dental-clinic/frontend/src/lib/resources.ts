import { api } from './api';
import type {
  AuthUser,
  Doctor,
  Service,
  Appointment,
  ClinicSettings,
  Slot,
  DashboardStats,
} from './types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password }),
  register: (name: string, email: string, phone: string, password: string) =>
    api.post<{ token: string; user: AuthUser }>('/auth/register', { name, email, phone, password }),
  me: () => api.get<{ user: AuthUser }>('/auth/me'),
};

export const usersApi = {
  updateProfile: (data: { name?: string; phone?: string }) =>
    api.patch<{ user: AuthUser }>('/users/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<null>('/users/me/password', { currentPassword, newPassword }),
};

export const doctorsApi = {
  list: (all = false) => api.get<{ doctors: Doctor[] }>('/doctors', { all }),
  get: (id: string) => api.get<{ doctor: Doctor }>(`/doctors/${id}`),
  create: (data: Partial<Doctor>) => api.post<{ doctor: Doctor }>('/doctors', data),
  update: (id: string, data: Partial<Doctor>) => api.patch<{ doctor: Doctor }>(`/doctors/${id}`, data),
  remove: (id: string) => api.delete<null>(`/doctors/${id}`),
};

export const servicesApi = {
  list: (all = false) => api.get<{ services: Service[] }>('/services', { all }),
  get: (id: string) => api.get<{ service: Service }>(`/services/${id}`),
  create: (data: Partial<Service>) => api.post<{ service: Service }>('/services', data),
  update: (id: string, data: Partial<Service>) => api.patch<{ service: Service }>(`/services/${id}`, data),
  remove: (id: string) => api.delete<null>(`/services/${id}`),
};

export const availabilityApi = {
  getSettings: () => api.get<{ settings: ClinicSettings }>('/availability/settings'),
  updateSettings: (data: Partial<ClinicSettings>) =>
    api.patch<{ settings: ClinicSettings }>('/availability/settings', data),
  getSlots: (doctorId: string, date: string, serviceId?: string) =>
    api.get<{ slots: Slot[] }>('/availability/slots', { doctorId, date, serviceId }),
};

export const appointmentsApi = {
  create: (data: { doctorId: string; serviceId: string; date: string; startTime: string; reason?: string }) =>
    api.post<{ appointment: Appointment }>('/appointments', data),
  my: (status?: string) => api.get<{ appointments: Appointment[] }>('/appointments/my', { status }),
  get: (id: string) => api.get<{ appointment: Appointment }>(`/appointments/${id}`),
  cancel: (id: string, cancellationReason?: string) =>
    api.patch<{ appointment: Appointment }>(`/appointments/${id}/cancel`, { cancellationReason }),
};

export const adminApi = {
  dashboard: () => api.get<DashboardStats>('/admin/dashboard'),
  appointments: (filters: { date?: string; doctorId?: string; serviceId?: string; status?: string } = {}) =>
    api.get<{ appointments: Appointment[]; count: number }>('/admin/appointments', filters),
  confirm: (id: string) => api.patch<{ appointment: Appointment }>(`/admin/appointments/${id}/confirm`),
  reject: (id: string, reason?: string) =>
    api.patch<{ appointment: Appointment }>(`/admin/appointments/${id}/reject`, { reason }),
  reschedule: (id: string, date: string, startTime: string) =>
    api.patch<{ appointment: Appointment }>(`/admin/appointments/${id}/reschedule`, { date, startTime }),
  cancel: (id: string, reason?: string) =>
    api.patch<{ appointment: Appointment }>(`/admin/appointments/${id}/cancel`, { reason }),
  complete: (id: string) => api.patch<{ appointment: Appointment }>(`/admin/appointments/${id}/complete`),
  patients: (search?: string) => api.get<{ patients: AuthUser[] }>('/admin/patients', { search }),
};

// Re-exported so pages can import a single AuthUser type from lib/types via lib/resources too.
export type { AuthUser } from './types';
