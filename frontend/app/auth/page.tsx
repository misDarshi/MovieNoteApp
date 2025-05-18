'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../context/AuthContext';

enum AuthMode {
  LOGIN,
  REGISTER
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const { login, register, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const handleLogin = async (username: string, password: string) => {
    await login(username, password);
    // If login is successful, the AuthContext will update the user state
    // and we can redirect to the home page
    if (!error) {
      router.push('/');
    }
  };

  const handleRegister = async (email: string, username: string, password: string) => {
    await register(email, username, password);
    // If registration is successful, the AuthContext will automatically log in
    // and we can redirect to the home page
    if (!error) {
      router.push('/');
    }
  };

  const toggleMode = () => {
    clearError();
    setMode(mode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN);
  };

  return (
    <main className="min-h-screen bg-[#f5f3ea] text-[#2e2e2e] px-6 py-10">
      <h1 className="text-5xl font-extrabold text-[#3b5742] mb-8 text-center tracking-tight">
        🎬 Movie Notes App
      </h1>
      
      <div className="max-w-md mx-auto mt-10">
        {mode === AuthMode.LOGIN ? (
          <LoginForm 
            onLogin={handleLogin} 
            onRegisterClick={toggleMode} 
            isLoading={isLoading} 
            error={error || undefined} 
          />
        ) : (
          <RegisterForm 
            onRegister={handleRegister} 
            onLoginClick={toggleMode} 
            isLoading={isLoading} 
            error={error || undefined} 
          />
        )}
      </div>
    </main>
  );
}
