import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UserProfile from './pages/UserProfile';
import About from './pages/About';
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
                        background: '#0A0A0A',
                        color: '#fff',
                    },
                    success: {
                        style: {
                            background: '#171717',
                            color: '#FF6B35',
                            border: '1px solid #FF6B35',
                        },
                    },
                    error: {
                        style: {
                            background: '#0A0A0A',
                            color: '#EF4444',
                            border: '1px solid #EF4444',
                        },
                    },
                }}
                theme="dark"
            />
            <Routes>
                <Route path="/" element={
                    <Layout>
                        <Dashboard />
                    </Layout>
                } />
                <Route path="/chat/:sessionId" element={
                    <Layout>
                        <Dashboard />
                    </Layout>
                } />
                <Route path="/user-profile" element={<UserProfile />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </>
    );
}

export default App;

