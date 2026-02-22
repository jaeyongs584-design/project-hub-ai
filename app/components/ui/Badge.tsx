import React from 'react';
import { cn } from '@/lib/utils';
import styles from './Badge.module.css';

type BadgeVariant = 's1' | 's2' | 's3' | 's4' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
    variant: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

export const Badge = ({ variant, children, className }: BadgeProps) => {
    return (
        <span className={cn(styles.badge, styles[variant], className)}>
            {children}
        </span>
    );
};
