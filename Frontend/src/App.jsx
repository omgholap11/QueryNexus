import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import WelcomePopup from './components/WelcomePopup';
import AuthModal from './components/AuthModal';
import { Toaster } from 'sonner';

function App() {
    const [showWelcome, setShowWelcome] = useState(true);
    const [showAuth, setShowAuth] = useState(false);

    const handleSignInClick = () => {
        setShowWelcome(false);
        setShowAuth(true);
    };

    const handleWelcomeClose = () => {
        setShowWelcome(false);
    };

    return (
        <>
            <WelcomePopup
                onSignIn={handleSignInClick}
                onClose={handleWelcomeClose}
            />
            <AuthModal
                isOpen={showAuth}
                onClose={() => setShowAuth(false)}
            />
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#000000',
                        color: '#fff',
                    },
                    success: {
                        style: {
                            background: '#000000',
                            color: '#007ACC',
                            border: '1px solid #007ACC',
                        },
                    },
                    error: {
                        style: {
                            background: '#000000',
                            color: '#EF4444',
                            border: '1px solid #EF4444',
                        },
                    },
                }}
                theme="dark"
            />
            <Layout>
                <Dashboard />
            </Layout>
        </>
    );
}

export default App;
