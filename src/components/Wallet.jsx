import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, CreditCard, TrendingUp, TrendingDown, History, Plus, Coins, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Wallet.css';

const Wallet = () => {
  const { user, token } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(100);
  const [purchasing, setPurchasing] = useState(false);

  const creditPackages = [
    { amount: 100, price: 200, bonus: 0, popular: false },
    { amount: 500, price: 900, bonus: 50, popular: true },
    { amount: 1000, price: 1700, bonus: 150, popular: false },
    { amount: 2500, price: 4000, bonus: 500, popular: false },
    { amount: 5000, price: 7500, bonus: 1250, popular: false }
  ];

  useEffect(() => {
    if (token) {
      fetchWalletData();
    }
  }, [token]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/credits/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setWalletData(data.data);
        setTransactions(data.data.recentTransactions);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async (amount) => {
    try {
      setPurchasing(true);
      const response = await fetch('http://localhost:5000/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          paymentMethod: 'card'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully purchased ${amount} credits for ₹${amount * 2}! New balance: ${data.data.newBalance} credits`);
        fetchWalletData(); // Refresh wallet data
        setShowPurchaseModal(false);
      } else {
        alert(data.message || 'Failed to purchase credits');
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('Error purchasing credits. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const formatTransactionType = (type) => {
    const typeMap = {
      'enroll': 'Course Enrollment',
      'earn': 'Course Earnings',
      'bonus': 'Bonus Credits',
      'cashout': 'Cashout Request',
      'onboarding': 'Welcome Bonus',
      'refund': 'Refund',
      'wallet_purchase': 'Credit Purchase',
      'wallet_transfer': 'Wallet Transfer',
      'admin_fee': 'Platform Fee'
    };
    return typeMap[type] || type;
  };

  const formatTransactionAmount = (amount, type) => {
    const prefix = ['enroll', 'cashout', 'refund'].includes(type) ? '-' : '+';
    return `${prefix}${amount}`;
  };

  if (loading) {
    return (
      <div className="wallet-container">
        <div className="loading">Loading wallet...</div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="wallet-container">
        <div className="error">Unable to load wallet data</div>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      {/* Wallet Header */}
      <div className="wallet-header">
        <div className="wallet-title">
          <WalletIcon size={24} />
          <h2>My Wallet</h2>
        </div>
        <button 
          className="purchase-btn"
          onClick={() => setShowPurchaseModal(true)}
        >
          <Plus size={16} />
          Buy Credits
        </button>
      </div>

      {/* Wallet Balance Cards */}
      <div className="wallet-cards">
        <div className="balance-card primary">
          <div className="card-icon">
            <Coins size={24} />
          </div>
          <div className="card-content">
            <h3>Current Balance</h3>
            <div className="balance-amount">{walletData.wallet.balance}</div>
            <div className="balance-label">Credits Available</div>
          </div>
        </div>

        <div className="balance-card">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <h3>Total Earned</h3>
            <div className="balance-amount">{walletData.wallet.totalEarned}</div>
            <div className="balance-label">From Teaching</div>
          </div>
        </div>

        <div className="balance-card">
          <div className="card-icon">
            <CreditCard size={24} />
          </div>
          <div className="card-content">
            <h3>Total Purchased</h3>
            <div className="balance-amount">{walletData.wallet.totalPurchased}</div>
            <div className="balance-label">Credits Bought</div>
          </div>
        </div>

        <div className="balance-card">
          <div className="card-icon">
            <TrendingDown size={24} />
          </div>
          <div className="card-content">
            <h3>Total Spent</h3>
            <div className="balance-amount">{walletData.wallet.totalSpent}</div>
            <div className="balance-label">On Courses</div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="transactions-section">
        <div className="section-header">
          <h3>Recent Transactions</h3>
          <button className="view-all-btn">
            <History size={16} />
            View All
          </button>
        </div>
        
        <div className="transactions-list">
          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((transaction, index) => (
              <div key={index} className="transaction-item">
                <div className="transaction-icon">
                  {transaction.type === 'wallet_purchase' && <CreditCard size={16} />}
                  {transaction.type === 'enroll' && <Coins size={16} />}
                  {transaction.type === 'earn' && <TrendingUp size={16} />}
                  {transaction.type === 'bonus' && <DollarSign size={16} />}
                  {transaction.type === 'admin_fee' && <DollarSign size={16} />}
                </div>
                <div className="transaction-details">
                  <div className="transaction-type">
                    {formatTransactionType(transaction.type)}
                  </div>
                  <div className="transaction-description">
                    {transaction.description}
                  </div>
                  <div className="transaction-date">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="transaction-amount">
                  <span className={`amount ${transaction.type === 'enroll' || transaction.type === 'cashout' ? 'negative' : 'positive'}`}>
                    {formatTransactionAmount(transaction.net_credits, transaction.type)}
                  </span>
                  <div className="fiat-amount">
                    ₹{(transaction.net_credits * 2).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Buy Credits</h3>
              <button 
                className="close-btn"
                onClick={() => setShowPurchaseModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="credit-packages">
                {creditPackages.map((pkg, index) => (
                  <div 
                    key={index} 
                    className={`credit-package ${pkg.popular ? 'popular' : ''}`}
                    onClick={() => setPurchaseAmount(pkg.amount)}
                  >
                    {pkg.popular && <div className="popular-badge">Most Popular</div>}
                    <div className="package-amount">{pkg.amount}</div>
                    <div className="package-credits">Credits</div>
                    {pkg.bonus > 0 && (
                      <div className="package-bonus">+{pkg.bonus} Bonus</div>
                    )}
                    <div className="package-price">₹{pkg.price}</div>
                  </div>
                ))}
              </div>
              
              <div className="custom-amount">
                <label>Custom Amount (10-10000 credits) - ₹{purchaseAmount * 2}</label>
                <input
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 10)}
                  min="10"
                  max="10000"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowPurchaseModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={() => handlePurchaseCredits(purchaseAmount)}
                disabled={purchasing}
              >
                {purchasing ? 'Processing...' : `Buy ${purchaseAmount} Credits`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
