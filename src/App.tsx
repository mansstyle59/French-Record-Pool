/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dashboard from './components/Dashboard';
import AuthScreen from './components/AuthScreen';
import { useAuth } from './components/AuthContext';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Initialisation du système...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased font-sans">
      {!user ? <AuthScreen /> : <Dashboard />}
    </div>
  );
}
