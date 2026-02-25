'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { LogIn } from 'lucide-react';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const isRegistered = searchParams.get('registered') === 'true';
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
            callbackUrl,
        });

        if (res?.error) {
            setError('Invalid credentials. Please try again.');
            setIsLoading(false);
        } else {
            router.push(callbackUrl);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome to ProjectHub AI</h1>
                    <p className={styles.subtitle}>Sign in to your intelligent workspace</p>
                </div>

                {isRegistered && <div className={styles.success} style={{ color: 'var(--success)', marginBottom: '1rem', textAlign: 'center' }}>Account created successfully! Please sign in.</div>}
                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" variant="default" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }} disabled={isLoading}>
                        {isLoading ? 'Signing in...' : (
                            <>
                                <LogIn size={18} style={{ marginRight: '0.5rem' }} />
                                Sign In
                            </>
                        )}
                    </Button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--foreground-muted)' }}>Don&apos;t have an account? </span>
                    <a href="/signup" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600 }}>
                        Create one now
                    </a>
                </div>
            </div>
        </div>
    );
}
