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
    return savedAccounts ? JSON.parse(savedAccounts) : [];
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
      isKycVerified: false
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

  const createAccount = (type = 'Savings', initialBalance = 0) => {
    const newAccount = {
      id: Date.now().toString(),
      accountNumber: generateAccountNumber(),
      type,
      balance: initialBalance,
      currency: 'INR',
      createdAt: new Date().toISOString(),
      label: `${type} Account`
    };
    setAccounts(prev => [...prev, newAccount]);
    addNotification(`${type} account created: ${newAccount.accountNumber}`, 'success');
    return newAccount;
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

  return (
    <BankContext.Provider value={{
      user, setUser,
      accounts, setAccounts,
      transactions, setTransactions,
      notifications, addNotification,
      register, login, logout,
      createAccount, addTransaction,
      validatePin
    }}>
      {children}
    </BankContext.Provider>
  );
};
