import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        }
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Failed to sign in with Google.';
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('12501')) {
        errorMsg = 'Sign-in cancelled.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMsg = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (authLoading) {
    return <LoadingScreen message="Verifying Devotee..." subtext="Accessing your sacred journey" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      let errorMsg = 'Authentication failed. Please try again.';
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-credential':
            errorMsg = 'Incorrect email or password.';
            break;
          case 'auth/user-not-found':
            errorMsg = 'No account found with this email.';
            break;
          case 'auth/email-already-in-use':
            errorMsg = 'This email is already registered. Please sign in.';
            break;
          case 'auth/weak-password':
            errorMsg = 'Password is too weak. Must be at least 6 characters.';
            break;
          case 'auth/network-request-failed':
            errorMsg = 'Network error. Please check your internet connection.';
            break;
          default:
            errorMsg = err.message || errorMsg;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-surface">
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: "url('/images/backgrounds/auth-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-surface/80 z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px] bg-surface border border-border-subtle rounded-2xl p-8 md:p-10 shadow-sm"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-subtle text-terracotta font-serif text-2xl flex items-center justify-center mb-5">
            ॐ
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-text-primary mb-2">
            {isLogin ? 'Welcome, Devotee' : 'Enter the Sanctuary'}
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed px-2">
            {isLogin 
              ? 'Connect with Vedic rituals, sacred cow care, and lifelong seva.' 
              : 'Join a community of compassionate devotion and sacred sanctuary seva.'}
          </p>
        </div>

        <div className="flex bg-surface-subtle p-1 rounded-lg border border-border-subtle mb-6">
          <button 
            type="button" 
            className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors outline-none", isLogin ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button 
            type="button" 
            className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors outline-none", !isLogin ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Create Account
          </button>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-[15px] focus:outline-none focus:border-terracotta transition-colors placeholder:text-text-muted/70 text-text-primary"
              placeholder="devotee@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">Password</label>
            <input
              type="password"
              required
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-[15px] focus:outline-none focus:border-terracotta transition-colors placeholder:text-text-muted/70 text-text-primary"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 py-3 rounded-lg font-medium text-[15px]"
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5 mx-auto" />
            ) : (
              isLogin ? 'Enter App' : 'Begin Journey'
            )}
          </Button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs font-medium text-text-muted uppercase tracking-widest">Or</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <Button 
          type="button" 
          variant="outline"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full py-3 rounded-lg font-medium text-[15px] text-text-primary"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="mr-3">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>
      </motion.div>
    </div>
  );
}
