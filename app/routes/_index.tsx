import { useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import type { LinksFunction, MetaFunction } from '@remix-run/node';
import { useAuth } from '~/lib/auth';

export const links: LinksFunction = () => {
    return [
        {
            rel: 'stylesheet',
            href: 'styles/globals.css',
        }
    ]
}

export const meta: MetaFunction = () => {
    return [
        { title: 'Places AI' },
        { name: 'description', content: 'A multiplayer virtual space where you can interact with other players and AI agents.' },
    ];
};

export default function Index() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (user) {
                navigate('/game');
            } else {
                navigate('/landing');
            }
        }
    }, [user, loading, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );
}
