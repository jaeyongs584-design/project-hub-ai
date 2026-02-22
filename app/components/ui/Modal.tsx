'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, size = 'md', children, footer }: ModalProps) => {
    const handleEsc = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleEsc]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className={cn(styles.modal, styles[size])}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <div className={styles.body}>
                    {children}
                </div>
                {footer && (
                    <div className={styles.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
