import React, { createContext, useContext, useState, useEffect } from 'react';

const BankContext = createContext();

export const useBank = () => useContext(BankContext);

export const BankProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('neo_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [accounts, setAccounts] = useState(() => {
    const savedAccounts = localStorage.getItem('neo_accounts');
    const parsed = savedAccounts ? JSON.parse(savedAccounts) : [];
    // Migration: generate card details for older accounts to ensure UI doesn't break
    return parsed.map(acc => {
      if (!acc.cardDetails) {
        return {
           ...acc,
           cardDetails: {
             number: Array.from({length: 4}, () => Math.floor(1000 + Math.random() * 9000)).join(' '),
             expiry: `12/${new Date().getFullYear() + 5}`,
             cvv: Math.floor(100 + Math.random() * 900).toString(),
             pin: '1234'
           }
        };
      }
      return acc;
    });
  });

  const [transactions, setTransactions] = useState(() => {
    const savedTransactions = localStorage.getItem('neo_transactions');
    return savedTransactions ? JSON.parse(savedTransactions) : [];
  });

  const [notifications, setNotifications] = useState([]);

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('neo_registered_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [emailConfig, setEmailConfig] = useState(() => {
    const saved = localStorage.getItem('neo_email_config');
    const parsed = saved ? JSON.parse(saved) : null;
    
    const defaultConfig = {
      publicKey: 'YOUR_PUBLIC_KEY_HERE',
      serviceId: 'YOUR_SERVICE_ID',
      templateId: 'YOUR_TEMPLATE_ID',
      backendUrl: 'https://neobank-9fm4.onrender.com'
    };

    // FORCE MIGRATION: If the user has the old localhost saved, update it to the live Render URL
    if (parsed && (parsed.backendUrl === 'http://localhost:5000' || !parsed.backendUrl)) {
      return { ...parsed, ...defaultConfig };
    }

    return parsed || defaultConfig;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('neo_user', JSON.stringify(user));
      // Sync active user changes (like PIN setup, KYC) back to the registered users DB
      setRegisteredUsers(prev => {
        if (!prev.find(u => u.id === user.id)) return prev;
        return prev.map(u => u.id === user.id ? user : u);
      });
    } else {
      localStorage.removeItem('neo_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('neo_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('neo_email_config', JSON.stringify(emailConfig));
  }, [emailConfig]);

  useEffect(() => {
    localStorage.setItem('neo_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('neo_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const register = (userData) => {
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      joinedAt: new Date().toISOString(),
      expectedOtp: generatedOtp,
      isVerified: false,
      isKycVerified: false,
      activeLoan: 0
    };
    setRegisteredUsers(prev => {
      // Remove any previously registered user with same email to simulate update
      const filtered = prev.filter(u => u.email !== newUser.email);
      return [...filtered, newUser];
    });
    setUser(newUser);
    return newUser;
  };

  const login = (emailOrPhone, password) => {
    const foundUser = registeredUsers.find(u => 
      (u.email === emailOrPhone || u.phone === emailOrPhone) && u.password === password
    );
    if (foundUser) {
      setUser(foundUser);
      addNotification('Logged in successfully', 'success');
      return true;
    }
    // Also fallback to current in-memory user if registeredUsers failed (edge case)
    if (user && (user.email === emailOrPhone || user.phone === emailOrPhone) && user.password === password) {
       addNotification('Logged in successfully', 'success');
       return true;
    }
    
    // Check if user exists but wrong password to accurately display error message
    const userExists = registeredUsers.some(u => u.email === emailOrPhone || u.phone === emailOrPhone) || 
                       (user && (user.email === emailOrPhone || user.phone === emailOrPhone));
                       
    if (userExists) {
       addNotification('Incorrect password', 'error');
    } else {
       addNotification('Account not found. Please register.', 'error');
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('neo_user');
    addNotification('Logged out successfully');
  };

  const generateAccountNumber = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  };

  const generateCardNumber = () => {
    return Array.from({length: 4}, () => Math.floor(1000 + Math.random() * 9000)).join(' ');
  };

  const createAccount = (type = 'Savings', initialBalance = 0) => {
    const newAccount = {
      id: Date.now().toString(),
      accountNumber: generateAccountNumber(),
      type,
      balance: initialBalance,
      currency: 'INR',
      createdAt: new Date().toISOString(),
      label: `${type} Account`,
      cardDetails: {
        number: generateCardNumber(),
        expiry: `12/${new Date().getFullYear() + 5}`, // 5 years from now
        cvv: Math.floor(100 + Math.random() * 900).toString(),
        pin: null // To be set by user
      }
    };
    setAccounts(prev => [...prev, newAccount]);
    addNotification(`${type} account created: ${newAccount.accountNumber}`, 'success');
    return newAccount;
  };

  const setCardPin = (accountId, pin) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, cardDetails: { ...acc.cardDetails, pin } };
      }
      return acc;
    }));
    addNotification('Debit Card PIN set successfully!', 'success');
  };

  const addTransaction = (accountId, amount, type, description, method = 'Internal') => {
    const transaction = {
      id: Date.now().toString(),
      accountId,
      amount,
      type, // 'credit' or 'debit'
      description,
      method,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    setTransactions(prev => [transaction, ...prev]);

    // Update account balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return {
          ...acc,
          balance: type === 'credit' ? acc.balance + amount : acc.balance - amount
        };
      }
      return acc;
    }));

    return transaction;
  };

  const validatePin = (pin) => {
    return user && user.withdrawalPin === pin;
  };

  const updateLoan = (amount, type) => {
    const change = type === 'disburse' ? amount : -amount;
    const newBalance = Math.max(0, (user.activeLoan || 0) + change);
    setUser(prev => ({ ...prev, activeLoan: newBalance }));
    return newBalance;
  };

  return (
    <BankContext.Provider value={{
      user, setUser,
      accounts, setAccounts,
      transactions, setTransactions,
      notifications, addNotification,
      register, login, logout,
      createAccount, addTransaction,
      validatePin, updateLoan, setCardPin,
      emailConfig, setEmailConfig
    }}>
      {children}
    </BankContext.Provider>
  );
};
