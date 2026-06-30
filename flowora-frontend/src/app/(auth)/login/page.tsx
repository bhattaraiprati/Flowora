'use client';

import Button from '@/components/UI/Button';
import InputField from '@/components/UI/InputField';
import Logo from '@/components/UI/logo';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { LoginCredentials, RegisterFormData, RegisterCredentials } from '@/types/authInterface';
import { useMutation } from '@tanstack/react-query';
import React, { ChangeEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'login' | 'register';

const Page = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const { isAuthenticated, _hasHydrated, isTokenValid } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Redirect already-authenticated users with valid tokens away from login
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && isTokenValid()) {
      const user = useAuthStore.getState().user;
      if (user?.role === 'SUPER_ADMIN') {
        router.replace('/super-admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [_hasHydrated, isAuthenticated, isTokenValid, router]);

  // Sync tab search param if present on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'register' || tabParam === 'login') {
        setActiveTab(tabParam as Tab);
      }
    }
  }, []);

  const loginMutation = useMutation<
    {
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: "USER" | "ADMIN" | "SUPER_ADMIN";
        avatarInitials?: string;
      };
      expiresAt: number;
      expiresIn: string;
      message: string;
    },
    Error,
    LoginCredentials
  >({
    mutationFn: (data) => authApi.login(data),
    onSuccess: ({ user, token, expiresAt }) => {
      setAuth(user, token, expiresAt);

      const redirectUrl = localStorage.getItem('redirect_after_login');
      if (redirectUrl) {
        localStorage.removeItem('redirect_after_login');
        router.replace(redirectUrl);
      } else {
        // Redirect based on user role
        if (user.role === 'SUPER_ADMIN') {
          router.replace('/super-admin');
        } else {
          router.replace('/dashboard');
        }
      }
    },
    onError: (err: Error) => {
      setError('Login failed. Please check your credentials.');
    },
  });

  const registerMutation = useMutation<{
    message: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  }, Error, RegisterCredentials>({
    mutationFn: (data) => authApi.register(data),
    onSuccess: (result) => {
      setActiveTab('login');
      setError('Account created successfully! Please check your email for verification.');
    },
    onError: (err: Error) => {
      setError(err.message || 'Registration failed. Please try again.');
    },
  });

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (activeTab === 'login') {
      setLoginForm((prev) => ({ ...prev, [name]: value }));
    } else {
      setRegisterForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!loginForm.email || !loginForm.password) {
      setError('Please fill in all fields.');
      return;
    }
    loginMutation.mutate(loginForm);
  };

  const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    
    if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const { confirmPassword, ...credentials } = registerForm;
    registerMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen flex font-sans bg-gray-50 overflow-hidden">
      {/* Left Panel  */}
      <div className="hidden lg:flex w-6/12 bg-brand relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-white/5" />

        <Logo />

        <div className="space-y-6 z-10">
          <h1 className="text-5xl leading-tight font-bold">
            Project management,
            <br />
            <span className="italic font-serif font-normal opacity-90 text-brand-light">simplified for teams.</span>
          </h1>
          <p className="text-lg opacity-80 max-w-md">
            Manage tasks, visualize progress, and collaborate seamlessly. Keep your team in sync and deliver projects on time.
          </p>
        </div>

        <div className="space-y-4 z-10">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
            <p className="text-sm">
              Visual Kanban boards, lists, and calendar views
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
            <p className="text-sm">
              Real-time team chat & group collaboration
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - login registerForm */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[400px]">
          <div className="inline-flex items-center gap-2 bg-brand-light text-brand-dark text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
            FLOWORA WORKSPACE
          </div>

          {/* switch Tabs */}
          <div className="bg-brand-light p-1.5 rounded-2xl flex mb-10">
            <button
              onClick={() => {
                setActiveTab("login");
                setError(null);
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "login"
                  ? "bg-white text-brand shadow-sm font-bold"
                  : "text-gray-650 hover:text-gray-800"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setError(null);
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "register"
                  ? "bg-white text-brand shadow-sm font-bold"
                  : "text-gray-650 hover:text-gray-800"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-700 border border-red-150 animate-shake">
              {error}
            </div>
          )}

          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-1">
                  Welcome back
                </h2>
                <p className="text-gray-500 mb-8">
                  Sign in to your Flowora workspace
                </p>
              </div>

              <InputField
                label="Email address"
                type="email"
                name="email"
                value={loginForm.email}
                placeholder="you@example.com"
                onChange={handleInputChange}
              />
              <InputField
                label="Password"
                type="password"
                name="password"
                value={loginForm.password}
                placeholder="••••••••••"
                onChange={handleInputChange}
              />

              <div className="text-right">
                <a href="#" className="text-sm text-brand hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button
                variant="primary"
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in…" : "Sign In"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400 bg-gray-50 px-4">
                  or continue with
                </div>
              </div>

              <Button variant="sso" type="button">
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-5 h-5"
                />
                Sign in with Google
              </Button>
            </form>
          )}

          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-1">
                  Create account
                </h2>
                <p className="text-gray-500 mb-8">
                  Join Flowora PM workspace
                </p>
              </div>

              <InputField
                label="Full name"
                type="text"
                name="name"
                value={registerForm.name}
                placeholder="Jane Smith"
                onChange={handleInputChange}
              />
              <InputField
                label="Email address"
                type="email"
                name="email"
                value={registerForm.email}
                placeholder="you@example.com"
                onChange={handleInputChange}
              />
              <InputField
                label="Password"
                type="password"
                name="password"
                value={registerForm.password}
                placeholder="Min. 8 characters"
                onChange={handleInputChange}
              />
              <InputField
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={registerForm.confirmPassword}
                placeholder="Re-enter your password"
                onChange={handleInputChange}
              />

              <Button
                variant="primary"
                type="submit"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending
                  ? "Creating account…"
                  : "Create my account"}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-gray-500 mt-10 leading-relaxed">
            By continuing, you agree to Flowora's{" "}
            <a href="#" className="text-brand hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-brand hover:underline">
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;