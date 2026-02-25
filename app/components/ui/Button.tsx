import React from 'react';
import { cn } from '@/lib/utils';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export const Button = ({
    className,
    variant = 'default',
    size = 'md',
    loading = false,
    children,
    ...props
}: ButtonProps) => {
    return (
        <button
            type={props.type || 'button'}
            className={cn(
                styles.button,
                styles[variant],
                styles[size],
                loading && styles.loading,
                className
            )}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading && <span className={styles.spinner} />}
            {children}
        </button>
    );
};
