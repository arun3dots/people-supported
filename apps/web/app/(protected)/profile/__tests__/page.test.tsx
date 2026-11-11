import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from '../page';
import { useAuth } from '../../../../lib/context/AuthContext';

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the Auth context
vi.mock('../../../../lib/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockProfile = {
  id: 'user-1',
  fullName: 'Admin User',
  email: 'admin@platform.com',
  phoneNumber: '07123456789',
  addressLine1: '123 Care Street',
  city: 'London',
  postcode: 'SW1A 1AA',
  photoUrl: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  role: { name: 'Admin' },
  tenant: { name: 'Sunrise Care Home' },
};

vi.mock('../../../../lib/queries/profile/useMyProfileQueries', () => ({
  useGetMyProfileQuery: () => ({
    data: mockProfile,
    isLoading: false,
  }),
  useUpdateMyProfileMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUploadMyProfilePhotoMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('Admin Profile Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        fullName: 'Admin User',
        email: 'admin@platform.com',
        roleName: 'Admin',
      },
    });
  });

  it('renders user details correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage />
      </QueryClientProvider>
    );

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0);
    expect(screen.getAllByText('admin@platform.com').length).toBeGreaterThan(0);
  });
});
