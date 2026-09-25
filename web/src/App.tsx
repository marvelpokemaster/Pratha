import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { AppShell } from '@/components/layout/AppShell';

import { Home } from '@/features/home/Home';
import { Auth } from '@/features/auth/Auth';

import { GaushalaDiscovery } from '@/features/gaushala/GaushalaDiscovery';
import { AnimalPassport } from '@/features/gaushala/AnimalPassport';
import { PujaDiscovery } from '@/features/pujas/PujaDiscovery';
import { SevaExperience } from '@/features/seva/SevaExperience';
import { Profile } from '@/features/profile/Profile';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Discover } from '@/features/discover/Discover';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen message="Restoring Sacred Session..." subtext="Connecting to Pratha" />;
  return <>{children}</>;
};

export const queryClient = new QueryClient();

export function PrathaAppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      
      <Route 
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/pujas" element={<PujaDiscovery />} />
        <Route path="/gaushala" element={<GaushalaDiscovery />} />
        <Route path="/gaushala/animal/:id" element={<AnimalPassport />} />
        <Route path="/seva" element={<SevaExperience />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Backward-compatible alias
export const SattvaAppContent = PrathaAppContent;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <PrathaAppContent />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
