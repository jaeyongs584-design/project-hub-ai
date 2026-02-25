'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import styles from '../login/page.module.css';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Member'
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create account.');
            }

            // Immediately redirect to login on success
            router.push('/login?registered=true');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred during registration.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Create an Account</h1>
                    <p className={styles.subtitle}>Join ProjectHub AI</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Role</label>
                        <select
                            className={styles.input}
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="Admin">Admin</option>
                            <option value="PM">Project Manager (PM)</option>
                            <option value="Member">Team Member</option>
                            <option value="Client">Client</option>
                        </select>
                    </div>

                    <Button type="submit" variant="default" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }} disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : (
                            <>
                                <UserPlus size={18} style={{ marginRight: '0.5rem' }} />
                                Sign Up
                            </>
                        )}
                    </Button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    <Link href="/login" style={{ color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={14} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
