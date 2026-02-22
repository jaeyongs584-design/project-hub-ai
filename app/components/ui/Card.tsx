import React from 'react';
import { cn } from '@/lib/utils';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    glass?: boolean;
    glow?: boolean;
}

export const Card = ({ className, glass = false, glow = false, children, ...props }: CardProps) => {
    return (
        <div
            className={cn(
                styles.card,
                glass && styles.glass,
                glow && styles.glow,
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn(styles.header, className)} {...props}>{children}</div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn(styles.title, className)} {...props}>{children}</h3>
);

export const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn(styles.description, className)} {...props}>{children}</p>
);

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn(styles.content, className)} {...props}>{children}</div>
);
