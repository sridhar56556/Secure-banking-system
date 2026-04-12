import React, { useState, useEffect } from 'react';
import { BankProvider, useBank } from './context/BankContext';
import { 
  Wallet, User, ShieldCheck, Mail, Key, LayoutGrid, 
  History, CreditCard, Plus, ArrowUpRight, ArrowDownLeft, 
  LogOut, Bell, ChevronRight, X, Smartphone, Globe, Lock, Banknote,
  MapPin, Calendar, FileText, CheckCircle, Copy, IndianRupee, Briefcase, Coins,
  Inbox, Reply, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  return (
    <BankProvider>
      <MainLayout />
    </BankProvider>
  );
};

const MainLayout = () => {
  const { user, notifications, accounts, emailConfig, setEmailConfig } = useBank();
  const [view, setView] = useState('auth'); 
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    // EmailJS is initialized via index.html script tag
    if (window.emailjs && emailConfig?.publicKey && emailConfig.publicKey !== 'YOUR_PUBLIC_KEY_HERE') {
      window.emailjs.init(emailConfig.publicKey); 
    }
  }, [emailConfig?.publicKey]);

  // Logic to determine view based on user state changes
  useEffect(() => {
    // If no user, default to auth unless we are in the middle of registration
    if (!user) {
      if (view !== 'register') setView('auth');
      return;
    }

    // Force verified users away from the OTP screen
    if (user.isVerified && view === 'otp') {
      if (user.withdrawalPin) {
        setView(accounts.length === 0 ? 'accountSelection' : 'dashboard');
      } else {
        setView('pin');
      }
      return;
    }

    // Auto-route from the auth screen once logged in
    if (view === 'auth') {
      if (user.isVerified) {
        if (user.withdrawalPin) {
          setView(accounts.length === 0 ? 'accountSelection' : 'dashboard');
        } else {
          setView('pin');
        }
      } else {
        setView('otp');
      }
    }
  }, [user, accounts.length, view]);

  return (
    <div className="min-h-screen">
      {/* Notifications Toast */}
      <div className="fixed top-6 right-6 z-[110] flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`glass px-4 py-3 min-w-[250px] flex items-center justify-between border-l-4 ${
                n.type === 'success' ? 'border-l-green-500' : 
                n.type === 'error' ? 'border-l-red-500' : 'border-l-blue-500'
              }`}
            >
              <span className="text-sm font-medium">{n.message}</span>
              <X size={14} className="cursor-pointer opacity-50 hover:opacity-100" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <main className="container mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {view === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <AuthScreen setView={setView} />
            </motion.div>
          )}
          {view === 'register' && (
            <motion.div key="register" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <RegisterScreen setView={setView} />
            </motion.div>
          )}
          {view === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
              <OtpScreen setView={setView} />
            </motion.div>
          )}
          {view === 'pin' && (
            <motion.div key="pin" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
              <PinScreen setView={setView} />
            </motion.div>
          )}
          {view === 'accountSelection' && (
            <motion.div key="accountSelection" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
              <AccountSelectionScreen setView={setView} />
            </motion.div>
          )}
          {view === 'kycForm' && (
            <motion.div key="kycForm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <KycFormScreen setView={setView} />
            </motion.div>
          )}
          {view === 'accountCreated' && (
            <motion.div key="accountCreated" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <AccountCreatedScreen setView={setView} />
            </motion.div>
          )}
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard setView={setView} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Config Button (Visible in Auth/Register/OTP) */}
      {['auth', 'register', 'otp'].includes(view) && (
        <button 
          onClick={() => setShowConfig(true)}
          className="fixed bottom-6 right-6 p-4 glass rounded-full hover:bg-white/10 transition shadow-2xl z-50 group"
        >
          <Settings size={20} className="text-gray-400 group-hover:rotate-90 group-hover:text-primary transition-all duration-500" />
        </button>
      )}

      {/* Email Config Modal */}
      {showConfig && (
        <EmailConfigModal 
           config={emailConfig} 
           onSave={(newConfig) => { setEmailConfig(newConfig); setShowConfig(false); }}
           onClose={() => setShowConfig(false)} 
        />
      )}
    </div>
  );
};

// --- AUTH SCREENS ---

const AuthScreen = ({ setView }) => {
  const { login, emailConfig } = useBank();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const url = emailConfig?.backendUrl || 'http://localhost:5000';
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.ok) setBackendStatus('online');
        else setBackendStatus('offline');
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, [emailConfig?.backendUrl]);

  const handleLogin = (e) => {
    e.preventDefault();
    login(email, password);
    // Routing is handled natively by MainLayout's useEffect based on login success
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="glass p-10 w-full max-w-md text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <Wallet className="text-primary" size={40} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome to NeoBank</h1>
        <p className="text-gray-400 mb-8">Secure, Swift, Seamless.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="text-left">
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Email or Phone Number</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="name@example.com or +91..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="text-left relative">
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              className="input-field pr-12" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-gray-500 hover:text-white transition"
            >
              {showPassword ? <X size={18} /> : <Lock size={18} />}
            </button>
          </div>
          <button type="submit" className="btn-primary w-full py-4 text-lg mt-2">Login to Account</button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center">
          <p className="text-gray-400 mb-4 text-sm">Don't have an account?</p>
          <button 
            onClick={() => setView('register')}
            className="text-primary font-semibold hover:underline flex items-center justify-center mx-auto mb-6"
          >
            Create New Account <ChevronRight size={16} />
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <div className={`w-2 h-2 rounded-full ${
              backendStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
              backendStatus === 'offline' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
              'bg-gray-500 animate-pulse'
            }`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Backend Server: {backendStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to send OTP email (used by both Register and OTP Resend)
const sendOtpEmail = (userObj, emailConfig, addNotification) => {
  const useRealEmail = window.emailjs && emailConfig?.serviceId !== 'YOUR_SERVICE_ID' && emailConfig?.serviceId;

  // LOG OTP TO CONSOLE AS FALLBACK
  console.log("=== NEOBANK SECURITY CODE ===");
  console.log("Target Email:", userObj.email);
  console.log("Verification Code:", userObj.expectedOtp);
  console.log("=============================");

  if (useRealEmail) {
    const templateParams = {
      email: userObj.email,
      to_name: userObj.name,
      otp_code: userObj.expectedOtp
    };

    addNotification('Sending verification code via EmailJS...', 'info');

    return window.emailjs.send(
      emailConfig.serviceId,
      emailConfig.templateId,
      templateParams,
      emailConfig.publicKey
    )
    .then(() => {
      addNotification('✅ OTP sent successfully to ' + userObj.email, 'success');
    })
    .catch((err) => {
      console.error('EmailJS Error:', err);
      addNotification('EmailJS failed. Check console for OTP code.', 'error');
    });
  } else {
    // Send OTP via Node.js backend
    addNotification('Sending OTP to ' + userObj.email + '...', 'info');
    const backendUrl = emailConfig?.backendUrl || 'http://localhost:5000';
    return fetch(`${backendUrl}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userObj.email, name: userObj.name, expectedOtp: userObj.expectedOtp })
    })
    .then(res => {
      if (!res.ok) throw new Error('Backend error: ' + res.status);
      return res.json();
    })
    .then(() => {
      addNotification('✅ OTP sent to ' + userObj.email, 'success');
    })
    .catch(err => {
      console.error('Email Error:', err);
      // If it's a CORS issue or connection refused, this helps debug
      const errorMsg = err.message.includes('Failed to fetch') 
        ? 'Cannot connect to email server at ' + backendUrl 
        : 'Email server error. Check console.';
      addNotification(errorMsg, 'error');
    });
  }
};

const RegisterScreen = ({ setView }) => {
  const { register, addNotification, emailConfig } = useBank();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', dob: '' });
  const [phoneError, setPhoneError] = useState('');
  const [dobError, setDobError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone number handler: only allow digits, max 10, must start with 6/7/8/9
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({...formData, phone: value});

    if (value.length > 0 && !/^[6-9]/.test(value)) {
      setPhoneError('Mobile number must start with 6, 7, 8, or 9');
    } else if (value.length > 0 && value.length < 10) {
      setPhoneError(`Enter ${10 - value.length} more digit(s)`);
    } else {
      setPhoneError('');
    }
  };

  // Date of birth handler: validate 18+ age
  const handleDobChange = (e) => {
    const value = e.target.value;
    setFormData({...formData, dob: value});

    if (value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        setDobError('You must be at least 18 years old to open an account');
      } else if (age > 120) {
        setDobError('Please enter a valid date of birth');
      } else {
        setDobError('');
      }
    } else {
      setDobError('');
    }
  };

  // Calculate max date (18 years ago from today) for the date picker
  const getMaxDobDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.dob) {
      addNotification('Please fill all required fields', 'error');
      return;
    }

    // Mobile number validation: exactly 10 digits starting with 6/7/8/9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      addNotification('Mobile number must be 10 digits and start with 6, 7, 8, or 9', 'error');
      return;
    }

    // Date of birth: must be 18+
    const birthDate = new Date(formData.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      addNotification('You must be at least 18 years old to register', 'error');
      return;
    }

    // Strong Password Validation: min 8 chars, 1 letter, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      addNotification('Password must be 8+ chars with letters, numbers, and special characters (e.g. @, #, $)', 'error');
      return;
    }

    const newUser = register(formData);
    
    // Send OTP email
    await sendOtpEmail(newUser, emailConfig, addNotification);
    setView('otp');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="glass p-10 w-full max-w-lg">
        <button onClick={() => setView('auth')} className="text-gray-400 mb-6 hover:text-white flex items-center gap-1 text-sm">
          <X size={14} /> Cancel
        </button>
        <h2 className="text-3xl font-bold mb-8">Sign Up</h2>
        
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Full Name</label>
            <input 
              type="text" className="input-field" placeholder="John Doe" 
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Email</label>
            <input 
              type="email" className="input-field" placeholder="john@bank.com"
              value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Mobile Number</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold tracking-tight">+91</span>
              <input 
                type="tel" className="input-field" 
                style={{ paddingLeft: '3.5rem' }}
                placeholder="9876543210"
                value={formData.phone} onChange={handlePhoneChange} required
                maxLength={10}
              />
            </div>
            {phoneError && <p className="text-red-400 text-xs mt-1 ml-2">{phoneError}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Date of Birth</label>
            <input 
              type="date" className="input-field" 
              value={formData.dob} onChange={handleDobChange} required
              max={getMaxDobDate()}
            />
            {dobError && <p className="text-red-400 text-xs mt-1 ml-2">{dobError}</p>}
          </div>
          <div className="md:col-span-2 relative">
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Password</label>
            <input 
              type={showPassword ? "text" : "password"} className="input-field pr-12" placeholder="Create a strong password"
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={8}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[34px] text-gray-500 hover:text-white transition"
            >
              {showPassword ? <X size={18} /> : <Lock size={18} />}
            </button>
            <p className="text-gray-600 text-[10px] mt-1 ml-2">Min 8 chars with letters, numbers & special characters</p>
          </div>
          <div className="md:col-span-2 mt-4">
            <button type="submit" className="btn-primary w-full py-4 text-lg">Continue to Verification</button>
          </div>
        </form>
      </div>

    </div>
  );
};

const OtpScreen = ({ setView }) => {
  const { user, setUser, addNotification, logout, emailConfig } = useBank();
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // AUTO-SEND ON MOUNT: Corrected logic to ensure OTP is sent when user returns to the app
  useEffect(() => {
    const triggerAutoSend = async () => {
      if (!user || user.isVerified) return;

      // Check if this is a fresh registration (joined in last 10 seconds)
      // If it is, handleRegister already sent the OTP, so we skip to avoid double-mailing.
      const joinedAt = new Date(user.joinedAt).getTime();
      const now = new Date().getTime();
      const isNewRegistration = (now - joinedAt) < 10000;

      if (!isNewRegistration) {
        console.log("Detected returning unverified user. Auto-sending fresh OTP...");
        await handleResendOtp();
      }
    };
    
    triggerAutoSend();
  }, []); // Run once on component mount

  const handleVerify = (e) => {
    e.preventDefault();
    if (user && otp === user.expectedOtp) {
      setUser({ ...user, isVerified: true });
      addNotification('Email verified successfully!', 'success');
      setView('pin');
    } else {
      addNotification(`Invalid OTP. Please check your email.`, 'error');
    }
  };

  // Resend OTP handler - generates a new OTP and sends it
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSending || !user) return;
    
    setIsSending(true);
    // Generate a new OTP
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const updatedUser = { ...user, expectedOtp: newOtp };
    setUser(updatedUser);
    
    try {
      await sendOtpEmail(updatedUser, emailConfig, addNotification);
    } catch (err) {
      console.error('Resend OTP Error:', err);
    }
    
    setIsSending(false);
    setResendCooldown(30); // 30 second cooldown
  };

  // Mask email for display
  const maskedEmail = user?.email ? 
    user.email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c) : 
    '***@***.com';

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="glass p-10 w-full max-w-md text-center relative">
        <button onClick={() => { logout(); setView('register'); }} className="text-gray-400 mb-6 hover:text-white flex items-center gap-1 text-sm absolute top-6 left-6">
          <X size={14} /> Back
        </button>
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mt-4 mb-6">
          <Mail className="text-blue-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Verify your Email</h2>
        <p className="text-gray-400 mb-8 text-sm">We've securely sent a 4-digit verification code to <br/><span className="text-white font-medium">{user?.email || maskedEmail}</span></p>

        <form onSubmit={handleVerify} className="space-y-6">
          <input 
            type="text" 
            className="input-field text-center text-2xl tracking-[1em] font-bold" 
            maxLength="4" 
            placeholder="0000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <button type="submit" className="btn-primary w-full py-4 text-lg">Verify & Continue</button>
          
          {/* Resend OTP Button */}
          <div className="pt-2">
            <p className="text-gray-500 text-xs mb-2">Didn't receive the code?</p>
            <button 
              type="button" 
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || isSending}
              className={`text-sm font-semibold transition ${
                resendCooldown > 0 || isSending
                  ? 'text-gray-600 cursor-not-allowed' 
                  : 'text-primary hover:text-white hover:underline'
              }`}
            >
              {isSending ? 'Sending...' : resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>

          <div className="pt-2 border-t border-white/5">
            <p className="text-gray-600 text-[10px] mb-2 uppercase tracking-wider font-bold">Can't receive email?</p>
            <button type="button" onClick={() => { setUser({ ...user, isVerified: true }); setView('pin'); addNotification('Bypassed Email for Testing', 'info'); }} className="text-gray-500 hover:text-white text-xs underline">
               [DEV] Skip Verification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PinScreen = ({ setView }) => {
  const { user, setUser, addNotification, logout } = useBank();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSetPin = (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      addNotification('PIN must be 4 digits', 'error');
      return;
    }
    if (pin !== confirmPin) {
      addNotification('PINs do not match', 'error');
      return;
    }

    // Set PIN. We don't create account yet.
    setUser({ ...user, withdrawalPin: pin });
    addNotification('Security PIN set successfully', 'success');
    setShowSuccess(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      {showSuccess && (
        <GenericModal 
           title="Registration Successful!" 
           icon={<CheckCircle size={32} />} 
           subtitle="Your account profile is created successfully. Please login to continue to finalize your account selection." 
           buttonText="Go to Login"
           onClose={() => {
             setShowSuccess(false);
             logout();
             setView('auth');
           }} 
        />
      )}
      <div className="glass p-10 w-full max-w-md text-center relative">
        <button onClick={() => { logout(); setView('auth'); }} className="text-gray-400 mb-6 hover:text-white flex items-center gap-1 text-sm absolute top-6 left-6">
          <X size={14} /> Back
        </button>
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mt-4 mb-6">
          <ShieldCheck className="text-emerald-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Set Withdrawal PIN</h2>
        <p className="text-gray-400 mb-8">You'll need this 4-digit PIN for every transaction to keep your funds safe.</p>
        
        <form onSubmit={handleSetPin} className="space-y-4">
          <div className="text-left">
            <label className="text-sm text-gray-400 ml-2 mb-1 block">New PIN</label>
            <input 
              type="password" maxLength="4" className="input-field text-center text-3xl tracking-[0.5em]" 
              placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className="text-left">
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Confirm PIN</label>
            <input 
              type="password" maxLength="4" className="input-field text-center text-3xl tracking-[0.5em]" 
              placeholder="••••" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <button type="submit" className="btn-primary w-full py-4">Save & Continue</button>
        </form>
      </div>
    </div>
  );
};

// --- ACCOUNT SELECTION & KYC ---

const AccountSelectionScreen = ({ setView }) => {
  const { user, setUser } = useBank();

  const handleSelect = (type) => {
    setUser({ ...user, selectedAccountType: type });
    setView('kycForm');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8">
      <div className="glass p-10 w-full max-w-4xl relative">
        <button onClick={() => { logout(); setView('auth'); }} className="text-gray-400 mb-6 hover:text-white flex items-center gap-1 text-sm absolute top-6 left-6">
          <X size={14} /> Logout
        </button>
        <div className="text-center mb-12 mt-4">
          <h2 className="text-3xl font-bold mb-2">Choose Your Account Type</h2>
          <p className="text-gray-400 mb-8">Select the type of account you want to open with NeoBank.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="glass p-8 cursor-pointer hover:bg-white/5 border border-white/5 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition text-left group" onClick={() => handleSelect('Savings')}>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Wallet className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Savings Account</h3>
              <p className="text-sm text-gray-400">Earn up to 6% interest on your daily balances. Perfect for building wealth.</p>
           </div>
           <div className="glass p-8 cursor-pointer hover:bg-white/5 border border-white/5 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition text-left group" onClick={() => handleSelect('Current')}>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Briefcase className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Current Account</h3>
              <p className="text-sm text-gray-400">Zero balance requirements. Unlimited transactions for your business needs.</p>
           </div>
           <div className="glass p-8 cursor-pointer hover:bg-white/5 border border-white/5 hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition text-left group" onClick={() => handleSelect('Salary')}>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Coins className="text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Salary Account</h3>
              <p className="text-sm text-gray-400">Special benefits, zero maintenance fees, and instant loan approvals.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const KycFormScreen = ({ setView }) => {
  const { user, setUser, createAccount, addNotification } = useBank();
  const [formData, setFormData] = useState({
    panCard: '', dob: user?.dob || '', address: '', city: '', state: '', pincode: ''
  });

  // Calculate max date (18 years ago from today) for the date picker
  const getMaxDobDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.panCard || !formData.dob || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      addNotification('Please fill all KYC details', 'error');
      return;
    }
    // Validate PAN format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.panCard.toUpperCase())) {
      addNotification('Invalid PAN card format (e.g. ABCDE1234F)', 'error');
      return;
    }
    if (formData.pincode.length !== 6) {
      addNotification('Pincode must be 6 digits', 'error');
      return;
    }
    
    // Validate age 18+
    const birthDate = new Date(formData.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      addNotification('You must be at least 18 years old to open a bank account', 'error');
      return;
    }

    // Complete KYC and create account
    const updatedUser = { ...user, ...formData, panCard: formData.panCard.toUpperCase(), isKycVerified: true };
    setUser(updatedUser);
    createAccount(user.selectedAccountType || 'Savings', 1000); 
    addNotification('Account created successfully!', 'success');
    setView('accountCreated');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8">
      <div className="glass p-10 w-full max-w-2xl">
        <button onClick={() => setView('accountSelection')} className="text-gray-400 mb-6 hover:text-white flex items-center gap-1 text-sm">
          <X size={14} /> Back
        </button>
        <h2 className="text-3xl font-bold mb-2">Provide KYC Details</h2>
        <p className="text-gray-400 mb-8 text-sm">Required to open your {user?.selectedAccountType} account.</p>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-400 ml-2 mb-1 block">PAN Card Number</label>
            <input 
              type="text" className="input-field font-mono tracking-widest uppercase" placeholder="ABCDE1234F" maxLength={10}
              value={formData.panCard} onChange={(e) => setFormData({...formData, panCard: e.target.value.toUpperCase()})} required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Date of Birth</label>
            <input 
              type="date" className="input-field"
              value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} required
              max={getMaxDobDate()}
            />
            <p className="text-gray-600 text-xs mt-1 ml-2">Must be 18 years or older</p>
          </div>
          <div className="md:col-span-2 mt-4">
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Residential Address</label>
            <input 
              type="text" className="input-field" placeholder="House/Flat No., Street, Locality"
              value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 ml-2 mb-1 block">City</label>
            <input 
              type="text" className="input-field" placeholder="Hyderabad"
              value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 ml-2 mb-1 block">State</label>
            <select 
              className="input-field" 
              value={formData.state} 
              onChange={(e) => setFormData({...formData, state: e.target.value})} required
            >
              <option value="">Select State</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Telangana">Telangana</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Delhi">Delhi</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Kerala">Kerala</option>
              <option value="Bihar">Bihar</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Punjab">Punjab</option>
              <option value="Haryana">Haryana</option>
              <option value="Odisha">Odisha</option>
              <option value="Jharkhand">Jharkhand</option>
              <option value="Chhattisgarh">Chhattisgarh</option>
              <option value="Assam">Assam</option>
              <option value="Goa">Goa</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Pincode</label>
            <input 
              type="text" className="input-field font-mono" placeholder="500001" maxLength={6}
              value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})} required
            />
          </div>

          <div className="md:col-span-2 mt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required className="mt-1 accent-primary" />
              <span className="text-xs text-gray-400">I agree to the Terms & Conditions and authorize NeoBank to verify my identity.</span>
            </label>
          </div>
          <div className="md:col-span-2 mt-4">
            <button type="submit" className="btn-primary w-full py-4 text-lg">Verify KYC & Open Account</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ACCOUNT CREATED CONFIRMATION & CARD PIN ---

const AccountCreatedScreen = ({ setView }) => {
  const { user, accounts, setCardPin } = useBank();
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1); // 1: Card Display, 2: PIN Setup, 3: Success
  const [copied, setCopied] = useState(false);
  const account = accounts[accounts.length - 1];

  const handleSetPin = () => {
    if (pin.length !== 4) return alert('PIN must be 4 digits');
    setCardPin(account.id, pin);
    setStep(3);
  };

  const copyAccountNumber = () => {
    if (account?.accountNumber) {
      navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!account) return <div className="text-center p-20 glass">Initializing Account...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8">
      <div className="glass p-10 w-full max-w-lg text-center relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full"></div>
        
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
               <CheckCircle size={32} />
            </div>
            <h2 className="text-3xl font-bold">Account Ready!</h2>
            <p className="text-gray-400 text-sm">Your {account.type} account has been created. We've issued your virtual debit card.</p>
            
            <VirtualCard card={account.cardDetails} name={user.name} />

            <button onClick={() => setStep(2)} className="btn-primary w-full py-4 text-lg font-bold">Set Virtual PIN</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
             <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                <Key size={32} />
             </div>
             <h3 className="text-2xl font-bold">Activate Your Card</h3>
             <p className="text-gray-400 text-sm px-8">Set a 4-digit PIN for your visa card. You will need this for all card-based transactions.</p>
             
             <div className="max-w-[180px] mx-auto">
               <input 
                 type="password" maxLength="4" className="input-field text-center text-4xl tracking-[0.6em]" 
                 autoFocus placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
               />
             </div>

             <button onClick={handleSetPin} className="btn-primary w-full py-4 font-bold">Activate My Card Now</button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
             <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
               <CheckCircle size={40} />
             </div>
             <div>
                <h3 className="text-2xl font-bold mb-2 tracking-tight">Setup Complete!</h3>
                <p className="text-gray-400 text-sm">Your account and card are fully active. Welcome to NeoBank.</p>
             </div>
             <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
                <div className="flex justify-between items-center text-xs mb-3">
                   <span className="text-gray-500 uppercase font-bold tracking-widest">Account ID</span>
                   <div className="flex items-center gap-2">
                      <span className="text-white font-mono font-bold">{account.accountNumber}</span>
                      <button onClick={copyAccountNumber} className="text-primary hover:text-white transition">
                        {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                      </button>
                   </div>
                </div>
                <div className="flex justify-between text-xs">
                   <span className="text-gray-500 uppercase font-bold tracking-widest">Initial Balance</span>
                   <span className="text-emerald-400 font-bold">₹1,000.00 Credits</span>
                </div>
             </div>
             <button onClick={() => setView('dashboard')} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 font-black">
               Open Dashboard <ChevronRight size={18} />
             </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const VirtualCard = ({ card, name, hideCvv = true }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="w-full h-48 rounded-[24px] bg-gradient-to-br from-[#1a1c2e] to-[#0f101a] p-6 shadow-2xl relative overflow-hidden border border-white/10"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full -mr-10 -mt-10"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full -ml-10 -mb-10"></div>
      
      <div className="flex justify-between items-start relative z-10">
        <CreditCard size={24} className="text-gray-500" />
        <div className="text-right">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5">Visa Debit</p>
          <div className="flex justify-end gap-0.5">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500/60 blur-[1px]"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500/60 -ml-2 blur-[1px]"></div>
          </div>
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <p className="text-xl font-bold tracking-[0.25em] text-white/90 font-mono">
           {card?.number || '0000 0000 0000 0000'}
        </p>
      </div>

      <div className="mt-8 flex justify-between items-end relative z-10">
        <div className="space-y-0.5 text-left">
          <p className="text-[7px] text-gray-500 uppercase font-black tracking-widest">Card Holder</p>
          <p className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[150px]">{name || 'Neo User'}</p>
        </div>
        <div className="flex gap-4">
           <div className="space-y-0.5 text-right">
             <p className="text-[7px] text-gray-500 uppercase font-black tracking-widest">Expires</p>
             <p className="text-[10px] font-bold text-white uppercase">{card?.expiry || '12/28'}</p>
           </div>
           {!hideCvv && (
             <div className="space-y-0.5 text-right">
               <p className="text-[7px] text-gray-500 uppercase font-black tracking-widest">CVV</p>
               <p className="text-[10px] font-bold text-white uppercase">{card?.cvv || '***'}</p>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN DASHBOARD ---

const Dashboard = ({ setView }) => {
  const { user, logout, accounts, createAccount, transactions, addTransaction, validatePin, addNotification, updateLoan } = useBank();
  const [activeAccountIdx, setActiveAccountIdx] = useState(0);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showStatementsModal, setShowStatementsModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  
  const currentAccount = accounts[activeAccountIdx] || null;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in px-4">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 pt-8">
        <div>
          <h1 className="text-5xl font-black mb-2 tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">NeoBank</span>
          </h1>
          <p className="text-xl text-gray-300 font-medium tracking-tight">
             Hello, <span className="text-white font-black italic underline decoration-primary decoration-4 underline-offset-4">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user?.activeLoan > 0 && (
             <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl hidden md:flex flex-col items-end">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest leading-tight">Outstanding Loan</span>
                <span className="text-sm font-black text-white">₹{user.activeLoan.toLocaleString('en-IN')}</span>
             </div>
          )}
          <button onClick={() => addNotification('System: Encrypted Session Active', 'success')} className="p-3 glass rounded-full hover:bg-white/10 transition">
             <ShieldCheck size={20} className="text-emerald-500" />
          </button>
          <button onClick={logout} className="flex items-center gap-2 py-3 px-4 glass border-white/5 hover:bg-red-500/10 text-red-500 transition-all font-bold">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        
        {/* LEFT COLUMN: Account & Card Details (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
           <VirtualCard card={currentAccount?.cardDetails} name={user?.name} hideCvv={false} />
           
           <div className="glass p-6 space-y-5">
              <div className="flex justify-between items-center">
                 <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em]">Active Account</h4>
                 <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                    currentAccount?.type === 'Savings' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                 }`}>
                    {currentAccount?.type} Active
                 </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group transition hover:border-white/20">
                 <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Account ID</p>
                    <p className="text-sm font-mono tracking-wider font-bold">{currentAccount?.accountNumber}</p>
                 </div>
                 <Copy size={16} className="text-gray-600 cursor-pointer hover:text-white transition" onClick={() => {
                    navigator.clipboard.writeText(currentAccount?.accountNumber);
                    addNotification('Account ID copied', 'success');
                 }} />
              </div>
              <button 
                onClick={() => addNotification('Card freeze feature available in mobile app', 'info')}
                className="w-full py-4 glass text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition flex items-center justify-center gap-2"
              >
                <Lock size={12} /> Manage Card Limits
              </button>
           </div>
        </div>

        {/* RIGHT COLUMN: Balance & History (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* Main Balance Container */}
           <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10 group-hover:bg-primary/20 transition-all duration-700"></div>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
                <div>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Available Balance</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-black tracking-tighter shadow-sm">₹{currentAccount?.balance.toLocaleString('en-IN')}</span>
                    <span className="text-primary font-black text-2xl">.00</span>
                  </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                  <button onClick={() => setShowAddMoney(true)} className="btn-primary flex-1 px-8 py-4 font-black text-sm flex items-center justify-center gap-3 transition hover:shadow-[0_0_20px_rgba(92,98,236,0.4)]">
                    <Plus size={20} /> Add Funds
                  </button>
                  <button onClick={() => setShowWithdraw(true)} className="glass flex-1 px-8 py-4 font-black text-sm flex items-center justify-center gap-3 hover:bg-white/5 transition border-white/10">
                    <ArrowUpRight size={20} /> Withdrawal
                  </button>
                </div>
              </div>
           </motion.div>

           {/* Quick Actions Grid */}
           <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
               <div onClick={() => setShowUpiModal(true)} className="glass p-5 text-center cursor-pointer hover:bg-white/5 transition-all duration-300 transform hover:-translate-y-1">
                 <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <Smartphone size={22}/>
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">UPI Pay</span>
               </div>
               <div onClick={() => addNotification('Investments: Stocks & Mutual Funds coming soon', 'info')} className="glass p-5 text-center cursor-pointer hover:bg-white/5 transition-all duration-300 transform hover:-translate-y-1">
                 <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <IndianRupee size={22}/>
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Equity</span>
               </div>
               <div onClick={() => setShowStatementsModal(true)} className="glass p-5 text-center cursor-pointer hover:bg-white/5 transition-all duration-300 transform hover:-translate-y-1">
                 <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <FileText size={22}/>
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">E-Statements</span>
               </div>
               <div onClick={() => setShowInsuranceModal(true)} className="glass p-5 text-center cursor-pointer hover:bg-white/5 transition-all duration-300 transform hover:-translate-y-1">
                 <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <ShieldCheck size={22}/>
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Insurance</span>
               </div>
                <div onClick={() => setShowLoanModal(true)} className="glass p-5 text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10">
                 <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <Banknote size={22}/>
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Loans</span>
               </div>
               <div onClick={() => addNotification('Dashboard Security: 2FA & Biometrics Enabled', 'success')} className="glass p-5 text-center cursor-pointer hover:bg-white/5 transition-all duration-300 transform hover:-translate-y-1">
                 <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <Lock size={22}/>
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Security</span>
               </div>
           </div>

           {/* History Display */}
           <div className="glass p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold flex items-center gap-2"><History size={20} /> History</h3>
                 <span onClick={() => setShowStatementsModal(true)} className="text-xs text-primary font-bold cursor-pointer hover:underline">See All</span>
              </div>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-gray-500 space-y-2 opacity-50">
                    <History size={40} />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  transactions.slice().reverse().map(t => (
                    <motion.div 
                      key={t.id} 
                      whileHover={{ x: 5 }}
                      onClick={() => setViewingTransaction(t)} 
                      className="flex items-center justify-between group cursor-pointer bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          t.type === 'credit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {(t.description || "T").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-base leading-tight">{t.description}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{new Date(t.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {t.method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-lg ${t.type === 'credit' ? 'text-emerald-500' : 'text-white'}`}>
                          {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                        </p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${t.status === 'completed' ? 'text-emerald-400/50' : 'text-amber-400'}`}>
                          {t.status || 'Success'}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
           </div>
        </div>
      </div>

      {/* Shared Modals Portal */}
      <AnimatePresence>
        {showAddMoney && (
          <TransactionModal 
            type="credit" onClose={() => setShowAddMoney(false)} account={currentAccount}
            onConfirm={(amount, desc, method) => {
              addTransaction(currentAccount.id, amount, 'credit', desc, method);
              setShowAddMoney(false);
            }}
          />
        )}
        {showWithdraw && (
          <TransactionModal 
            type="debit" onClose={() => setShowWithdraw(false)} account={currentAccount} validatePin={validatePin}
            onConfirm={(amount, desc, method) => {
              addTransaction(currentAccount.id, amount, 'debit', desc, method);
              setShowWithdraw(false);
            }}
          />
        )}
        {viewingTransaction && (
          <TransactionDetailsModal transaction={viewingTransaction} onClose={() => setViewingTransaction(null)} />
        )}
        {showUpiModal && (
          <GenericModal 
            title="Link UPI App" icon={<Smartphone size={32} className="text-primary"/>} 
            subtitle="Link your account to GPay, PhonePe or Paytm instantly to start paying anywhere." onClose={() => setShowUpiModal(false)} 
          />
        )}
        {showStatementsModal && (
          <GenericModal 
            title="Download Statement" icon={<FileText size={32} className="text-amber-500"/>} 
            subtitle="Get your complete transaction history as a digitally signed PDF for the last 6 months." onClose={() => setShowStatementsModal(false)} 
          />
        )}
        {showInsuranceModal && (
          <GenericModal 
            title="NeoBank Shield" icon={<ShieldCheck size={32} className="text-purple-500"/>} 
            subtitle="Insurance protection up to ₹1 Crore for accidental or medical emergencies. Activates after 30 days." onClose={() => setShowInsuranceModal(false)} 
          />
        )}
        {showLoanModal && (
          <LoanModal 
            account={currentAccount} onClose={() => setShowLoanModal(false)} 
            onApprove={(amount) => {
              addTransaction(currentAccount.id, amount, 'credit', 'Instant Cash Loan Disbursed', 'Direct Deposit');
              updateLoan(amount, 'disburse');
              setShowLoanModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const TransactionModal = ({ type, onClose, account, onConfirm, validatePin }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState(type === 'credit' ? 'Card' : 'Bank Transfer');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Payment Method Specific States
  const [cardNum, setCardNum] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [upiId, setUpiId] = useState('');
  const [netBankAcc, setNetBankAcc] = useState('');

  const handleNext = () => {
    if (!amount || isNaN(amount) || amount <= 0) return alert('Enter valid amount');
    if (type === 'debit' && amount > account.balance) return alert('Insufficient funds');
    
    // Realistic Validation for Credit (Add Funds)
    if (type === 'credit') {
       if (method === 'Card') {
          if (cardNum.length < 16) return alert('Please enter a valid 16-digit Card Number');
          if (cardPin.length < 4) return alert('Please enter a valid 4-digit PIN');
       } else if (method === 'UPI') {
          if (!upiId.includes('@')) return alert('Enter a valid UPI ID (e.g. user@okhdfc)');
       } else if (method === 'Net Banking') {
          if (netBankAcc.length < 10) return alert('Enter a valid Bank Account Number');
       }
    }

    if (type === 'debit') setStep(2);
    else handleSubmit();
  };

  const handleSubmit = () => {
    if (type === 'debit' && !validatePin(pin)) return alert('Incorrect Secure PIN');
    
    setIsLoading(true);
    setTimeout(() => {
      onConfirm(parseFloat(amount), description || (type === 'credit' ? 'Deposit' : 'Withdrawal'), method);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
       <motion.div 
         initial={{ opacity: 0, scale: 0.9, y: 20 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         className="glass w-full max-w-sm p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
       >
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-bold">{type === 'credit' ? 'Add Funds' : 'Withdrawal'}</h3>
             <X className="cursor-pointer opacity-50" onClick={onClose} />
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] uppercase font-black text-gray-500 mb-2">Select Method</p>
                <div className="grid grid-cols-2 gap-2">
                   {(type === 'credit' ? ['Card', 'UPI', 'Net Banking'] : ['Bank Transfer', 'ATM Cash', 'UPI Pay']).map(m => (
                     <button 
                      key={m} onClick={() => setMethod(m)}
                      className={`text-xs py-2 px-3 rounded-lg border transition ${
                        method === m ? 'bg-primary/20 border-primary text-white' : 'border-white/5 text-gray-400'
                      }`}
                     >
                       {m}
                     </button>
                   ))}
                </div>
              </div>

              {/* Dynamic Payment Details Fields */}
              {type === 'credit' && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                   {method === 'Card' && (
                     <div className="space-y-3">
                        <div>
                          <p className="text-[10px] uppercase font-black text-gray-500 mb-1 ml-1">Card Number (16 Digits)</p>
                          <input type="text" maxLength="16" placeholder="0000 0000 0000 0000" className="input-field" value={cardNum} onChange={e => setCardNum(e.target.value.replace(/\D/g,''))} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-black text-gray-500 mb-1 ml-1">ATM PIN</p>
                          <input type="password" maxLength="4" placeholder="••••" className="input-field text-center tracking-[0.5em]" value={cardPin} onChange={e => setCardPin(e.target.value.replace(/\D/g,''))} />
                        </div>
                     </div>
                   )}
                   {method === 'UPI' && (
                     <div>
                        <p className="text-[10px] uppercase font-black text-gray-500 mb-1 ml-1">UPI ID</p>
                        <input type="text" placeholder="username@upi" className="input-field" value={upiId} onChange={e => setUpiId(e.target.value)} />
                     </div>
                   )}
                   {method === 'Net Banking' && (
                     <div>
                        <p className="text-[10px] uppercase font-black text-gray-500 mb-1 ml-1">Account Number</p>
                        <input type="text" placeholder="123456789012" className="input-field" value={netBankAcc} onChange={e => setNetBankAcc(e.target.value.replace(/\D/g,''))} />
                     </div>
                   )}
                </div>
              )}
              
              <div>
                <p className="text-[10px] uppercase font-black text-gray-500 mb-2">Amount (₹)</p>
                <input 
                  type="number" className="input-field text-2xl font-black" 
                  autoFocus placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <p className="text-[10px] uppercase font-black text-gray-500 mb-2">Description (Optional)</p>
                <input 
                  type="text" className="input-field text-sm" 
                  placeholder="Rent, Shopping, etc." value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button className="btn-primary w-full py-4" onClick={handleNext}>
                {type === 'debit' ? 'Proceed to PIN' : 'Confirm Deposit'}
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center">
               <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                 <ShieldCheck className="text-primary" />
               </div>
               <h4 className="text-lg font-bold">Secure PIN Required</h4>
               <p className="text-xs text-gray-400">Enter your 4-digit PIN to authorize this ₹{parseFloat(amount).toLocaleString()} debit.</p>
               
               <input 
                 type="password" maxLength="4" className="input-field text-center text-3xl tracking-[0.5em]" 
                 autoFocus placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)}
               />

               <div className="flex gap-2">
                  <button className="glass flex-1 py-3" onClick={() => setStep(1)}>Back</button>
                  <button className="btn-primary flex-[2] py-3 flex items-center justify-center" onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Verify & Pay'}
                  </button>
               </div>
            </div>
          )}
       </motion.div>
    </div>
  );
};

export default App;

const TransactionDetailsModal = ({ transaction, onClose }) => {
  if (!transaction) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="bg-[#0f0f1a] w-full max-w-md rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
      >
        {/* Statement Header */}
        <div className="bg-primary p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-40 h-40 border-8 border-white rounded-full"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 border-8 border-white rounded-full"></div>
           </div>
           <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 backdrop-blur-sm">
              <ShieldCheck className="text-white" size={32} />
           </div>
           <h3 className="text-2xl font-black text-white tracking-tight">E-Receipt</h3>
           <p className="text-xs text-white/70 uppercase tracking-[0.2em] font-bold">Transaction Successfully Verified</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="text-center">
             <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Amount Transacted</p>
             <span className={`text-5xl font-black ${transaction.type === 'credit' ? 'text-emerald-500' : 'text-white'}`}>
                {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
             </span>
          </div>

          <div className="grid grid-cols-2 gap-y-6 pt-4 border-t border-white/5">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Status</p>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-sm font-bold text-white uppercase tracking-wider">Completed</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Method</p>
              <span className="text-sm font-bold text-white">{transaction.method}</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Trans. ID</p>
              <span className="text-[10px] font-mono text-gray-300">#NB-{transaction.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Date</p>
              <span className="text-sm font-bold text-white">{new Date(transaction.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="col-span-2 pt-4 border-t border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Payment For / Remarks</p>
              <p className="text-base font-bold text-white italic">"{transaction.description}"</p>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                   <Lock size={14} className="text-primary" />
                </div>
                <div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase">Secured By</p>
                   <p className="text-xs font-black text-white">NeoBank Guard v2.0</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Account</p>
                <p className="text-xs font-black text-white">**8146</p>
             </div>
          </div>

          <button 
            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10 hover:border-white/20" 
            onClick={onClose}
          >
            Download PDF Statement
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const LoanModal = ({ account, onClose, onApprove }) => {
  const { user, updateLoan, addTransaction, validatePin } = useBank();
  const hasActiveLoan = user?.activeLoan > 0;

  const [step, setStep] = useState(hasActiveLoan ? 3 : 1); // 3 is Repayment
  const [pan, setPan] = useState('');
  const [score, setScore] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loanOffer, setLoanOffer] = useState(0);
  const [repayAmount, setRepayAmount] = useState('');
  const [pin, setPin] = useState('');

  const startAnalysis = () => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!pan) return alert('Please enter your PAN Card Number');
    if (!panRegex.test(pan)) return alert('Invalid PAN Card Format. Example: ABCDE1234F');
    
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      const randomScore = Math.floor(Math.random() * (900 - 600 + 1)) + 600;
      const randomAmount = Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000;
      setScore(randomScore);
      setLoanOffer(randomAmount);
      setStep(2);
    }, 3000);
  };

  const handleRepayment = () => {
    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0) return alert('Enter a valid amount');
    if (amount > account.balance) return alert('Insufficient balance in your account');
    if (amount > user.activeLoan) return alert('Amount exceeds your loan balance');
    
    if (step === 3) {
      setStep(4); // Pin verification for repayment
      return;
    }

    if (!validatePin(pin)) return alert('Incorrect Secure PIN');

    addTransaction(account.id, amount, 'debit', 'Loan Repayment', 'Internal Transfer');
    updateLoan(amount, 'repay');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
       <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f0f1a] w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative overflow-hidden border border-white/10">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[60px] rounded-full"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
             <h3 className="text-xl font-bold flex items-center gap-2">
                <Banknote className="text-amber-500" /> 
                {hasActiveLoan ? 'Loan Payment' : 'Instant Loan'}
             </h3>
             <X className="cursor-pointer opacity-50 hover:opacity-100 transition" onClick={onClose} />
          </div>

          {step === 1 && (
            <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-400 mb-4 font-medium italic leading-relaxed">Enter your PAN Card number to check your instant loan eligibility. We will calculate your credit score automatically.</p>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 ml-1">PAN Card Number</p>
                  <input type="text" placeholder="ABCDE1234F" className="input-field uppercase" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} />
                </div>
              </div>

              <button onClick={startAnalysis} disabled={isAnalyzing} className="btn-primary w-full py-4 flex items-center justify-center gap-3">
                {isAnalyzing ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></motion.div><span>Calculating Score...</span></> : <span>Check Eligibility</span>}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 text-center relative z-10 animate-in zoom-in-95">
               <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <ShieldCheck size={40} />
               </div>
               <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Approved Loan Amount</p>
                  <h2 className="text-5xl font-black text-white">₹{loanOffer.toLocaleString('en-IN')}</h2>
                  <p className="text-xs text-emerald-400 font-bold mt-2 tracking-widest uppercase">Credit Grade {score > 750 ? 'A+' : 'B'} Success</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl text-left border border-white/5">
                  <div className="flex justify-between text-xs mb-2 text-gray-400"><span>Interest Rate</span><span className="text-white font-bold">0% (Limited Offer)</span></div>
                  <div className="flex justify-between text-xs text-gray-400"><span>Duration</span><span className="text-white font-bold">Unlimited</span></div>
               </div>
               <div className="flex gap-3">
                  <button className="glass flex-1 py-4 font-bold" onClick={() => setStep(1)}>Retry</button>
                  <button className="btn-primary flex-[2] py-4 font-black" onClick={() => onApprove(loanOffer)}>Disburse Now</button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 relative z-10 animate-in fade-in">
               <div className="bg-amber-500/10 p-5 rounded-3xl border border-amber-500/20 text-center">
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-1">Total Outstanding</p>
                  <h2 className="text-3xl font-black text-white">₹{user.activeLoan.toLocaleString('en-IN')}</h2>
               </div>

               <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 ml-1">Repayment Amount (₹)</p>
                    <input 
                      type="number" placeholder="Enter amount to pay" className="input-field text-xl font-bold" 
                      value={repayAmount} onChange={e => setRepayAmount(e.target.value)} 
                    />
                  </div>

                  <div className="flex justify-between px-1">
                     <button onClick={() => setRepayAmount(user.activeLoan)} className="text-[10px] font-black text-primary uppercase hover:underline">Pay Full Amount</button>
                     <p className="text-[10px] font-bold text-gray-600 uppercase">Balance: ₹{account.balance.toLocaleString()}</p>
                  </div>
               </div>

               <button onClick={handleRepayment} className="btn-primary w-full py-4 font-black">
                  Next Step
               </button>
               
               <p className="text-[10px] text-center text-gray-500 font-medium px-4">Pay back your loan to increase your future credit eligibility.</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 text-center animate-in zoom-in-95">
               <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
                  <Lock size={32} />
               </div>
               <h4 className="text-lg font-bold">Secure Authorisation</h4>
               <p className="text-xs text-gray-400 px-4">Enter your 4-digit Secure PIN to repay ₹{parseFloat(repayAmount).toLocaleString()}.</p>
               
               <input 
                 type="password" maxLength="4" className="input-field text-center text-3xl tracking-[0.8em]" 
                 autoFocus placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)}
               />

               <div className="flex gap-3">
                  <button className="glass flex-1 py-4 font-bold" onClick={() => setStep(3)}>Back</button>
                  <button className="btn-primary flex-[2] py-4 font-black" onClick={handleRepayment}>
                    Confirm & Pay
                  </button>
               </div>
            </div>
          )}
       </motion.div>
    </div>
  );
};

// --- MODAL COMPONENTS ---

const EmailConfigModal = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
       <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass w-full max-w-md p-8 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-bold flex items-center gap-2">
                <Settings className="text-primary" size={20} /> Email System Setup
             </h3>
             <X className="cursor-pointer opacity-50 hover:opacity-100" onClick={onClose} />
          </div>
          
          <div className="space-y-5">
             <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 ml-1">EmailJS Public Key</p>
                <input type="text" className="input-field" value={localConfig.publicKey} onChange={e => setLocalConfig({...localConfig, publicKey: e.target.value})} />
             </div>
             <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 ml-1">Service ID</p>
                <input type="text" className="input-field" value={localConfig.serviceId} onChange={e => setLocalConfig({...localConfig, serviceId: e.target.value})} />
             </div>
             <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 ml-1">Template ID</p>
                <input type="text" className="input-field" value={localConfig.templateId} onChange={e => setLocalConfig({...localConfig, templateId: e.target.value})} />
             </div>
             <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 ml-1">Node.js Backend URL (Simulation)</p>
                <input type="text" className="input-field" value={localConfig.backendUrl} onChange={e => setLocalConfig({...localConfig, backendUrl: e.target.value})} />
             </div>
          </div>

          <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
             <p className="text-[10px] text-primary-light font-medium italic">
                Tips: Create a free account at emailjs.com, connect your Gmail, and paste your keys above to enable real email deliveries.
             </p>
          </div>

          <button onClick={() => onSave(localConfig)} className="btn-primary w-full py-4 mt-8 font-black">
             Save Configuration
          </button>
       </motion.div>
    </div>
  );
};

const GenericModal = ({ title, subtitle, icon, buttonText, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
       <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass w-full max-w-sm p-8 text-center relative overflow-hidden">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
             {icon}
          </div>
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
             {subtitle}
          </p>
          <button onClick={onClose} className="btn-primary w-full py-4 font-black">
             {buttonText || "Continue"}
          </button>
       </motion.div>
    </div>
  );
};
