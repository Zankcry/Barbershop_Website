/**
 * auth.js — Charlie's Barber Sign-In System
 * ==========================================
 * Firebase Authentication (Google + Email/Password) with GA4 user_id tracking.
 *
 * SETUP: Replace the firebaseConfig object below with your own project's config
 * from: Firebase Console → Project Settings → Your apps → SDK setup & configuration
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ─── Firebase Config ──────────────────────────────────────────────────────────
// TODO: Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyC8Bj-haFHr39vMNXpoT-NawD4glpYZyW8",
    authDomain: "charlies-barbershop.firebaseapp.com",
    projectId: "charlies-barbershop",
    storageBucket: "charlies-barbershop.firebasestorage.app",
    messagingSenderId: "798896438564",
    appId: "1:798896438564:web:2d7edf73445b2eaa4c47b1",
    measurementId: "G-DJ3ZRWYSXG"
};

// ─── GA4 Measurement ID ───────────────────────────────────────────────────────
const GA_MEASUREMENT_ID = 'G-EDWNDSJW1P';

// ─── Init Firebase ────────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ─── GA4 Helpers ──────────────────────────────────────────────────────────────
function gaSetUser(uid) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('set', { user_id: uid });
    window.gtag('config', GA_MEASUREMENT_ID, { user_id: uid });
    console.log(`📊 GA4 User ID Set: ${uid}`);
}

function gaEvent(eventName, params = {}) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, params);
    console.log(`📊 GA4 Event (Auth): ${eventName}`, params);
}

// ─── UI Elements ─────────────────────────────────────────────────────────────
const overlay = document.getElementById('auth-modal-overlay');
const signInTabBtn = document.getElementById('auth-tab-signin');
const signUpTabBtn = document.getElementById('auth-tab-signup');
const signInPanel = document.getElementById('auth-panel-signin');
const signUpPanel = document.getElementById('auth-panel-signup');

const signinGoogleBtn = document.getElementById('auth-signin-google');
const signinEmailInput = document.getElementById('auth-signin-email');
const signinPasswordInput = document.getElementById('auth-signin-password');
const signinSubmitBtn = document.getElementById('auth-signin-submit');
const signinMessage = document.getElementById('auth-signin-message');

const signupNameInput = document.getElementById('auth-signup-name');
const signupEmailInput = document.getElementById('auth-signup-email');
const signupPasswordInput = document.getElementById('auth-signup-password');
const signupSubmitBtn = document.getElementById('auth-signup-submit');
const signupMessage = document.getElementById('auth-signup-message');

const navSigninBtn = document.getElementById('nav-signin-btn');
const navUserMenu = document.getElementById('nav-user-menu');
const navUserAvatar = document.getElementById('nav-user-avatar');
const navUserInitials = document.getElementById('nav-user-initials');
const navUserName = document.getElementById('nav-user-name');
const navUserEmail = document.getElementById('nav-user-email');
const navSignoutBtn = document.getElementById('nav-signout-btn');

// ─── Modal Open / Close ───────────────────────────────────────────────────────
function openModal(tab = 'signin') {
    overlay.classList.add('auth-modal--open');
    document.body.style.overflow = 'hidden';
    switchTab(tab);
    clearMessages();
}

function closeModal() {
    overlay.classList.remove('auth-modal--open');
    document.body.style.overflow = '';
    clearMessages();
}

function switchTab(tab) {
    const isSignIn = tab === 'signin';
    signInTabBtn?.classList.toggle('active', isSignIn);
    signUpTabBtn?.classList.toggle('active', !isSignIn);
    signInPanel?.classList.toggle('active', isSignIn);
    signUpPanel?.classList.toggle('active', !isSignIn);
}

function showMessage(el, text, type = 'error') {
    if (!el) return;
    el.textContent = text;
    el.className = `auth-message ${type}`;
}

function clearMessages() {
    [signinMessage, signupMessage].forEach(el => {
        if (el) el.className = 'auth-message';
    });
}

function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
        btn.dataset.originalText = btn.textContent;
        btn.innerHTML = '<i class="ri-loader-4-line" style="animation:spin 0.7s linear infinite;display:inline-block;"></i> Loading…';
    } else {
        btn.textContent = btn.dataset.originalText || btn.textContent;
    }
}

// ─── Friendly error messages ──────────────────────────────────────────────────
function friendlyError(code) {
    const map = {
        'auth/user-not-found': 'No account found with that email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/invalid-credential': 'Invalid email or password.',
    };
    return map[code] || 'Something went wrong. Please try again.';
}

// ─── Auth Actions ─────────────────────────────────────────────────────────────
async function signInWithGoogle() {
    try {
        setLoading(signinGoogleBtn, true);
        const result = await signInWithPopup(auth, googleProvider);
        const isNewUser = result._tokenResponse?.isNewUser;
        gaSetUser(result.user.uid);
        gaEvent(isNewUser ? 'sign_up' : 'login', { method: 'Google' });
        closeModal();
    } catch (err) {
        showMessage(signinMessage, friendlyError(err.code));
    } finally {
        setLoading(signinGoogleBtn, false);
    }
}

async function signInWithEmail() {
    const email = signinEmailInput?.value.trim();
    const password = signinPasswordInput?.value;
    if (!email || !password) {
        showMessage(signinMessage, 'Please enter your email and password.');
        return;
    }
    try {
        setLoading(signinSubmitBtn, true);
        const result = await signInWithEmailAndPassword(auth, email, password);
        gaSetUser(result.user.uid);
        gaEvent('login', { method: 'Email' });
        closeModal();
    } catch (err) {
        showMessage(signinMessage, friendlyError(err.code));
    } finally {
        setLoading(signinSubmitBtn, false);
    }
}

async function signUpWithEmail() {
    const name = signupNameInput?.value.trim();
    const email = signupEmailInput?.value.trim();
    const password = signupPasswordInput?.value;
    if (!name || !email || !password) {
        showMessage(signupMessage, 'Please fill in all fields.');
        return;
    }
    try {
        setLoading(signupSubmitBtn, true);
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        gaSetUser(result.user.uid);
        gaEvent('sign_up', { method: 'Email' });
        showMessage(signupMessage, 'Account created! Welcome 🎉', 'success');
        setTimeout(closeModal, 1200);
    } catch (err) {
        showMessage(signupMessage, friendlyError(err.code));
    } finally {
        setLoading(signupSubmitBtn, false);
    }
}

async function handleSignOut() {
    try {
        await firebaseSignOut(auth);
        gaSetUser(null);
        gaEvent('sign_out');
    } catch (err) {
        console.error('Sign-out error:', err);
    }
}

// ─── Navbar UI Update ─────────────────────────────────────────────────────────
function updateNavUI(user) {
    if (!navSigninBtn || !navUserMenu) return;

    if (user) {
        navSigninBtn.style.display = 'none';
        navUserMenu.style.display = 'flex';

        // Avatar: photo URL or initials
        const initials = (user.displayName || user.email || '?')
            .split(' ')
            .map(w => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        if (navUserAvatar) {
            if (user.photoURL) {
                navUserAvatar.src = user.photoURL;
                navUserAvatar.style.display = 'block';
                if (navUserInitials) navUserInitials.style.display = 'none';
            } else {
                navUserAvatar.style.display = 'none';
                if (navUserInitials) {
                    navUserInitials.style.display = 'flex';
                    navUserInitials.textContent = initials;
                }
            }
        }

        if (navUserName) {
            navUserName.textContent = user.displayName?.split(' ')[0] || 'Account';
        }
        if (navUserEmail) {
            navUserEmail.textContent = user.email || '';
        }
    } else {
        navSigninBtn.style.display = 'inline-flex';
        navUserMenu.style.display = 'none';
    }
}

// ─── Auth State Listener ──────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
    updateNavUI(user);
    if (user) {
        // Re-set user_id in GA on every page load for cross-page tracking
        gaSetUser(user.uid);
    }
});

// ─── Event Listeners ──────────────────────────────────────────────────────────
// Open modal from navbar
navSigninBtn?.addEventListener('click', () => openModal('signin'));

// Close modal (backdrop click)
overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
});

// Close button inside modal
document.getElementById('auth-modal-close')?.addEventListener('click', closeModal);

// Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// Tabs
signInTabBtn?.addEventListener('click', () => switchTab('signin'));
signUpTabBtn?.addEventListener('click', () => switchTab('signup'));

// Google sign-in (works for both tabs)
signinGoogleBtn?.addEventListener('click', signInWithGoogle);
document.getElementById('auth-signup-google')?.addEventListener('click', signInWithGoogle);

// Email sign-in
signinSubmitBtn?.addEventListener('click', signInWithEmail);
signinPasswordInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') signInWithEmail();
});

// Email sign-up
signupSubmitBtn?.addEventListener('click', signUpWithEmail);
signupPasswordInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') signUpWithEmail();
});

// Sign out
navSignoutBtn?.addEventListener('click', handleSignOut);

// Toggle dropdown on avatar click (for touch/keyboard)
document.getElementById('auth-avatar-btn')?.addEventListener('click', () => {
    const dropdown = document.getElementById('auth-dropdown');
    dropdown?.classList.toggle('open');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('nav-user-menu');
    if (menu && !menu.contains(e.target)) {
        document.getElementById('auth-dropdown')?.classList.remove('open');
    }
});

// Inject spin keyframe if not already present
if (!document.getElementById('auth-keyframes')) {
    const style = document.createElement('style');
    style.id = 'auth-keyframes';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
}
