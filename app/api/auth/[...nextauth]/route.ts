import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "admin@ags.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                // Lookup user in Supabase
                const { data: user, error } = await supabase
                    .from('users')
                    .select('id, name, email, role, password_hash')
                    .eq('email', credentials.email)
                    .maybeSingle();

                if (error) {
                    console.error('Login Supabase error:', error);
                    return null;
                }

                if (!user) {
                    return null;
                }

                // Verify password
                const passwordsMatch = await bcrypt.compare(credentials.password, user.password_hash);

                if (passwordsMatch) {
                    return { id: user.id, name: user.name, email: user.email, role: user.role };
                }

                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role?: string }).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { role?: string; id?: string }).role = token.role as string;
                (session.user as { role?: string; id?: string }).id = token.id as string;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login', // We'll create a custom login page
    },
    session: {
        strategy: "jwt",
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
