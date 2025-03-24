import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
    LiveReload,
} from '@remix-run/react';
import { json } from '@remix-run/node';
import { AuthProvider } from './lib/auth';
import './styles/globals.css';
import type { LinksFunction } from "@remix-run/node";

// Loader function to expose environment variables to the client
export async function loader() {
    return json({
        ENV: {
            FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
            FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
            FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
            FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
            FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
            FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
            FIREBASE_VAPID_KEY: process.env.FIREBASE_VAPID_KEY,
        },
    });
}

export const links: LinksFunction = () => {
    return [
        {
            rel: "stylesheet",
            href: "/styles/globals.css",
        },
        {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap",
        },
    ];
};

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="h-full">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body className="h-full">
                {children}
                <ScrollRestoration />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    );
}

export default function App() {
    const data = useLoaderData<typeof loader>();
    
    return (
        <AuthProvider>
            <Outlet />
            <script
                dangerouslySetInnerHTML={{
                    __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
                }}
            />
        </AuthProvider>
    );
}
