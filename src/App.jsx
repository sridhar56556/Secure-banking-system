import React, { useState, useEffect } from 'react';
import { BankProvider, useBank } from './context/BankContext';
import { 
  Wallet, User, ShieldCheck, Mail, Key, LayoutGrid, 
  History, CreditCard, Plus, ArrowUpRight, ArrowDownLeft, 
  LogOut, Bell, ChevronRight, X, Smartphone, Globe, Lock, Banknote,
  MapPin, Calendar, FileText, CheckCircle, Copy, IndianRupee, Briefcase, Coins,
  Inbox, Reply
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  useEffect(() => {
    // Inject EmailJS script for real OTP emails
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.async = true;
    script.onload = () => {
      // NOTE: Replace with your actual EmailJS Public Key
      window.emailjs.init("YOUR_PUBLIC_KEY_HERE"); 
    };
    document.body.appendChild(script);
  }, []);

  return (
    <BankProvider>
      <MainLayout />
    </BankProvider>
  );
};

const MainLayout = () => {
  const { user, notifications, accounts } = useBank();
  const [view, setView] = useState('auth'); // auth, register, otp, pin, accountSelection, kycForm, accountCreated, dashboard

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
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2">
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
    </div>
  );
};

// --- AUTH SCREENS ---

const AuthScreen = ({ setView }) => {
  const { login } = useBank();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
          <div className="text-left">
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full py-4 text-lg">Login</button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-gray-400 mb-4 text-sm">Don't have an account?</p>
          <button 
            onClick={() => setView('register')}
            className="text-primary font-semibold hover:underline flex items-center justify-center mx-auto"
          >
            Create New Account <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const RegisterScreen = ({ setView }) => {
  const { register, addNotification } = useBank();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });

  const handleRegister = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      addNotification('Please fill all required fields', 'error');
      return;
    }
    const newUser = register(formData);
    
    // Dispatch Email Securely using the genuine local Node.js Backup Server
    fetch('http://localhost:5000/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newUser.email,
        name: newUser.name,
        expectedOtp: newUser.expectedOtp
      })
    })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        addNotification('OTP sent to ' + newUser.email, 'success');
        setView('otp');
      } else {
        addNotification('Failed to send email: ' + (data.error || 'Unknown error'), 'error');
        // Still allow them to move forward if they want to use the console-logged OTP for testing
        setView('otp');
      }
    })
    .catch(err => {
      console.log('Mail Backend Error:', err);
      addNotification('Could not connect to Mail Server. Check if it is running.', 'error');
      // Still move to OTP screen so they aren't stuck (they can see OTP in console)
      setView('otp');
    });

    // LOG OTP TO CONSOLE AS FALLBACK
    console.log("=== NEOBANK SECURITY CODE ===");
    console.log("Target Email:", newUser.email);
    console.log("Verification Code:", newUser.expectedOtp);
    console.log("=============================");

    addNotification('Attempting to transmit verification code...', 'info');

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
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Phone</label>
            <input 
              type="tel" className="input-field" placeholder="+91 98765 43210"
              value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-400 ml-2 mb-1 block">Password</label>
            <input 
              type="password" className="input-field" placeholder="Create a strong password"
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={8}
            />
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
  const { user, setUser, addNotification, logout } = useBank();
  const [otp, setOtp] = useState('');

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
    panCard: '', dob: '', address: '', city: '', state: '', pincode: ''
  });

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
            />
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

// --- ACCOUNT CREATED CONFIRMATION ---

const AccountCreatedScreen = ({ setView }) => {
  const { user, accounts } = useBank();
  const [copied, setCopied] = useState(false);
  const account = accounts[0];

  const copyAccountNumber = () => {
    if (account?.accountNumber) {
      navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="glass p-10 w-full max-w-lg text-center"
      >
        {/* Success Icon */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="text-emerald-500" size={44} />
        </motion.div>

        <h2 className="text-3xl font-bold mb-2">Account Created!</h2>
        <p className="text-gray-400 mb-8">Congratulations! Your NeoBank account is ready.</p>

        {/* Account Number Display */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-6 mb-6"
        >
          <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">Your Account Number</p>
          <div className="flex items-center justify-center gap-3">
            <p className="text-2xl md:text-3xl font-mono font-bold tracking-[0.15em]">
              {account?.accountNumber.match(/.{1,4}/g)?.join(' ')}
            </p>
            <button 
              onClick={copyAccountNumber}
              className={`p-2 rounded-lg transition-all ${
                copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'
              }`}
            >
              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
            </button>
          </div>
          {copied && <p className="text-emerald-400 text-xs mt-2 font-bold">Copied to clipboard!</p>}
        </motion.div>

        {/* Account Details Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 gap-4 text-left mb-8"
        >
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Account Holder</p>
            <p className="text-sm font-bold">{user?.name}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Account Type</p>
            <p className="text-sm font-bold">{account?.type || 'Savings'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">PAN Card</p>
            <p className="text-sm font-bold font-mono">{user?.panCard || 'N/A'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">IFSC Code</p>
            <p className="text-sm font-bold font-mono">NEOB0001234</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Branch</p>
            <p className="text-sm font-bold">{user?.city || 'Digital'} Branch</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Opening Balance</p>
            <p className="text-sm font-bold text-emerald-400">₹1,000.00</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <button 
            onClick={() => setView('dashboard')}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
          >
            Go to Dashboard <ChevronRight size={20} />
          </button>
          <p className="mt-4 text-xs text-gray-500">Your account has been credited with ₹1,000 demo funds to explore.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

// --- MAIN DASHBOARD ---

const Dashboard = ({ setView }) => {
  const { user, logout, accounts, createAccount, transactions, addTransaction, validatePin, addNotification } = useBank();
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
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-black mb-2 tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">NeoBank</span>
          </h1>
          <p className="text-xl text-gray-300 flex items-center gap-2 font-medium">
             Welcome back, <span className="text-white font-bold underline decoration-primary decoration-4 underline-offset-4">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition">
            <Bell size={20} className="text-gray-400" />
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 py-3 px-4 glass border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-red-500 transition-all font-semibold"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Account Summary & Cards (Column Span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Account Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10 group-hover:bg-primary/20 transition-all duration-700"></div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Balance</p>
                <div className="flex items-baseline gap-2">
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    key={currentAccount?.balance}
                    className="text-5xl font-black"
                  >
                    ₹{currentAccount?.balance ? currentAccount.balance.toLocaleString('en-IN') : '0'}
                  </motion.span>
                  <span className="text-primary font-bold">.00</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-6">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Account &bull; {currentAccount?.type || 'Savings'}</span>
                      <span className="text-base md:text-lg font-mono tracking-widest">{currentAccount?.accountNumber.match(/.{1,4}/g)?.join(' ')}</span>
                   </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6 md:mt-0 w-full md:w-auto">
                <button 
                  onClick={() => setShowAddMoney(true)}
                  className="btn-primary flex-1 md:flex-none flex justify-center items-center gap-2 px-4 md:px-8 py-3"
                >
                  <Plus size={20} /> Add Funds
                </button>
                <button 
                  onClick={() => setShowWithdraw(true)}
                  className="glass border-white/10 hover:bg-white/5 flex-1 md:flex-none flex justify-center items-center gap-2 px-4 md:px-8 py-3"
                >
                  <ArrowUpRight size={20} /> Withdrawal
                </button>
              </div>
            </div>

            {/* Quick Account Switcher */}
            <div className="mt-12 flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {accounts.map((acc, idx) => (
                <div 
                  key={acc.id} 
                  onClick={() => setActiveAccountIdx(idx)}
                  className={`cursor-pointer min-w-[170px] p-5 rounded-2xl border transition-all duration-300 ${
                    activeAccountIdx === idx 
                      ? 'bg-gradient-to-br from-primary/30 to-primary/10 border-primary shadow-[0_10px_30px_rgba(92,98,236,0.3)]' 
                      : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
                >
                  <p className="text-[10px] uppercase font-black opacity-40 mb-1">{acc.type}</p>
                  <p className="text-sm font-mono font-bold mb-2">...{acc.accountNumber.slice(-4)}</p>
                  <p className="text-lg font-black tracking-tight">₹{acc.balance.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Graphical Representation of Active Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass p-6 bg-gradient-to-br from-[#2b2b6b] to-[#12122b] border-white/20 relative overflow-hidden group cursor-pointer"
            >
               <div className="absolute top-4 right-6 opacity-20"><Globe size={60} /></div>
               <div className="flex justify-between items-start mb-12">
                  <CreditCard size={32} className="text-white/80" />
                  <span className="text-xs font-bold text-blue-300">VISA DEBIT</span>
               </div>
               <p className="text-xl font-mono tracking-[0.2em] mb-8">4532 9012 8841 0021</p>
               <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase opacity-50">Card Holder</p>
                    <p className="text-sm font-bold uppercase">{user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase opacity-50">Expires</p>
                    <p className="text-sm font-bold">12/28</p>
                  </div>
               </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass p-6 bg-gradient-to-br from-[#4b1d3f] to-[#2b1020] border-white/20 relative overflow-hidden cursor-pointer"
            >
               <div className="absolute -bottom-6 -right-6 opacity-10"><Smartphone size={100} /></div>
               <h3 className="text-xl font-bold mb-2">Virtual Metal Card</h3>
               <p className="text-gray-400 text-sm mb-6">Manage settings, freeze card or change ATM limits instantly.</p>
               <button className="text-accent font-bold text-sm flex items-center gap-1">Manage Settings <ChevronRight size={14} /></button>
            </motion.div>
          </div>

          {/* Features & Security Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
               <div onClick={() => setShowUpiModal(true)} className="glass p-5 text-center cursor-pointer hover:scale-105 transition hover:bg-white/5">
                 <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <Smartphone size={24}/>
                 </div>
                 <span className="text-xs font-bold uppercase tracking-wider">UPI Sync</span>
               </div>
               <div onClick={() => addNotification('Savings module is coming soon!', 'info')} className="glass p-5 text-center cursor-pointer hover:scale-105 transition hover:bg-white/5">
                 <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <LayoutGrid size={24}/>
                 </div>
                 <span className="text-xs font-bold uppercase tracking-wider">Savings</span>
               </div>
               <div onClick={() => setShowStatementsModal(true)} className="glass p-5 text-center cursor-pointer hover:scale-105 transition hover:bg-white/5">
                 <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <History size={24}/>
                 </div>
                 <span className="text-xs font-bold uppercase tracking-wider">Statements</span>
               </div>
               <div onClick={() => setShowInsuranceModal(true)} className="glass p-5 text-center cursor-pointer hover:scale-105 transition hover:bg-white/5">
                 <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <ShieldCheck size={24}/>
                 </div>
                 <span className="text-xs font-bold uppercase tracking-wider">Insurance</span>
               </div>
               <div onClick={() => setShowLoanModal(true)} className="glass p-5 text-center cursor-pointer hover:scale-105 transition bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20">
                 <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <Banknote size={24}/>
                 </div>
                 <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Instant Loan</span>
               </div>
               <div onClick={() => addNotification('Server Side Security: AES-256 Enabled', 'success')} className="glass p-5 text-center cursor-pointer hover:scale-105 transition bg-primary/5 hover:bg-primary/10 border-primary/20">
                 <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <ShieldCheck size={24}/>
                 </div>
                 <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Security</span>
               </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Transactions (Column Span 4) */}
        <div className="lg:col-span-4 space-y-6">
           <div className="glass h-full flex flex-col">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2"><History size={20} /> History</h3>
                <span onClick={() => setShowStatementsModal(true)} className="text-xs text-primary font-bold cursor-pointer hover:underline">See All</span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[600px] p-6 space-y-4 no-scrollbar">
                {transactions.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-gray-500 space-y-2 opacity-50">
                    <History size={40} />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  transactions.map(t => (
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

      {/* Transaction Modals */}
      {showAddMoney && (
        <TransactionModal 
          type="credit" 
          onClose={() => setShowAddMoney(false)} 
          account={currentAccount}
          onConfirm={(amount, desc, method) => {
            addTransaction(currentAccount.id, amount, 'credit', desc, method);
            setShowAddMoney(false);
          }}
        />
      )}

      {showWithdraw && (
        <TransactionModal 
          type="debit" 
          onClose={() => setShowWithdraw(false)} 
          account={currentAccount}
          validatePin={validatePin}
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
        <GenericModal title="Link UPI App" icon={<Smartphone size={32}/>} subtitle="Open Google Pay, PhonePe, or Paytm and scan the QR code to link your NeoBank account directly." onClose={() => setShowUpiModal(false)} />
      )}
      
      {showStatementsModal && (
        <GenericModal title="Account Statements" icon={<History size={32}/>} subtitle="Download your complete account statement as a PDF securely." onClose={() => setShowStatementsModal(false)} />
      )}

      {showInsuranceModal && (
        <GenericModal title="NeoBank Protect" icon={<ShieldCheck size={32}/>} subtitle="Get insured up to ₹1,00,00,000 for as low as ₹499/year. This feature is unlocked after 30 days of active account usage." onClose={() => setShowInsuranceModal(false)} />
      )}

      {showLoanModal && (
        <LoanModal 
          account={currentAccount} 
          onClose={() => setShowLoanModal(false)} 
          onApprove={(amount) => {
            addTransaction(currentAccount.id, amount, 'credit', 'Instant Cash Loan Disbursed', 'Direct Deposit');
            setShowLoanModal(false);
          }}
        />
      )}
    </div>
  );
};

const TransactionModal = ({ type, onClose, account, onConfirm, validatePin }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState(type === 'credit' ? 'Fake Card' : 'Transfer');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (!amount || isNaN(amount) || amount <= 0) return alert('Enter valid amount');
    if (type === 'debit' && amount > account.balance) return alert('Insufficient funds');
    
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
                   {(type === 'credit' ? ['Fake Card', 'UPI', 'Net Banking'] : ['Bank Transfer', 'ATM Cash', 'UPI Pay']).map(m => (
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
  const [step, setStep] = useState(1);
  const [pan, setPan] = useState('');
  const [score, setScore] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loanOffer, setLoanOffer] = useState(0);

  const startAnalysis = () => {
    if (!pan) return alert('Please enter your PAN Card Number');
    
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      // Randomly generate score (600-900) and amount (10000-20000)
      const randomScore = Math.floor(Math.random() * (900 - 600 + 1)) + 600;
      const randomAmount = Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000;
      
      setScore(randomScore);
      setLoanOffer(randomAmount);
      setStep(2);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
       <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-sm p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[60px] rounded-full"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
             <h3 className="text-xl font-bold flex items-center gap-2"><Banknote className="text-amber-500" /> Instant Loan</h3>
             <X className="cursor-pointer opacity-50 hover:opacity-100 transition" onClick={onClose} />
          </div>

          {step === 1 ? (
            <div className="space-y-6 relative z-10">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-400 mb-4 font-medium italic">Enter your PAN Card number to check your instant loan eligibility. We will calculate your credit score automatically.</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">PAN Card Number</p>
                    <input type="text" placeholder="ABCDE1234F" className="input-field uppercase" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>

              <button 
                onClick={startAnalysis} 
                disabled={isAnalyzing}
                className="btn-primary w-full py-4 flex items-center justify-center gap-3 overflow-hidden"
              >
                {isAnalyzing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></motion.div>
                    <span>Calculating Score...</span>
                  </>
                ) : (
                  <span>Check Eligibility</span>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-8 text-center relative z-10 animate-fade-in">
               <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck size={40} />
               </div>
               
               <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Approved Loan Amount</p>
                  <h2 className="text-5xl font-black text-white">₹{loanOffer.toLocaleString('en-IN')}</h2>
                  <p className="text-xs text-emerald-400 font-bold mt-2 tracking-widest uppercase">Grade {score > 750 ? 'A+' : 'B'} Success</p>
               </div>

               <div className="p-4 bg-white/5 rounded-2xl text-left border border-white/5">
                  <div className="flex justify-between text-xs mb-2 text-gray-400"><span>Interest Rate</span><span className="text-white font-bold text-sm">0% (Special Offer)</span></div>
                  <div className="flex justify-between text-xs text-gray-400"><span>Repayment Basis</span><span className="text-white font-bold text-sm">Automated</span></div>
               </div>

               <div className="flex gap-3">
                  <button className="glass flex-1 py-4 font-bold" onClick={() => setStep(1)}>Retry</button>
                  <button className="btn-primary flex-[2] py-4 font-black" onClick={() => onApprove(loanOffer)}>Disburse Now</button>
               </div>
            </div>
          )}
       </motion.div>
    </div>
  );
};

const GenericModal = ({ title, icon, subtitle, onClose, buttonText = "Understood" }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass w-full max-w-md p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex justify-end mb-2"><X className="cursor-pointer opacity-50 hover:opacity-100" onClick={onClose} /></div>
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">{icon}</div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400 mb-8">{subtitle}</p>
        <button className="btn-primary w-full py-3" onClick={onClose}>{buttonText}</button>
      </motion.div>
    </div>
);
