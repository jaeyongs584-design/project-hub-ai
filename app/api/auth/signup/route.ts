import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (checkError) {
            console.error('Supabase check error:', checkError);
            return NextResponse.json({ error: 'Database error while checking user' }, { status: 500 });
        }

        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const { error } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    name,
                    role: role || 'Member',
                    password_hash: hashedPassword
                }
            ]);

        if (error) {
            console.error('Signup insert error:', error);
            return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
        }

        return NextResponse.json({ message: 'User created successfully' }, { status: 201 });

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
