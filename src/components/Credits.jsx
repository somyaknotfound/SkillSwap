import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, History, Award, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Credits.css';

const Credits = ({ showTransactions = false, compact = false }) => {
  const { user, token } = useAuth();
  const [creditsData, setCreditsData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  useEffect(() => {
    const fetchCreditsData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/credits/wallet', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setCreditsData(data.data);
        }
      } catch (error) {
        console.error('Error fetching credits data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreditsData();
  }, [token]);

  const fetchTransactions = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/credits/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleViewTransactions = () => {
    setShowTransactionModal(true);
    fetchTransactions();
  };

  const formatTransactionType = (type) => {
    const typeMap = {
      'enroll': 'Course Enrollment',
      'earn': 'Course Earnings',
      'bonus': 'Bonus Points',
      'cashout': 'Cashout Request',
      'onboarding': 'Welcome Bonus',
      'refund': 'Refund'
    };
    return typeMap[type] || type;
  };

  const formatTransactionAmount = (amount, type) => {
    const prefix = ['enroll', 'cashout', 'refund'].includes(type) ? '-' : '+';
    return `${prefix}${amount}`;
  };

  if (loading) {
    return (
      <div className={`credits-container ${compact ? 'compact' : ''}`}>
        <div className="loading">Loading credits...</div>
      </div>
    );
  }

  if (!creditsData) {
    return (
      <div className={`credits-container ${compact ? 'compact' : ''}`}>
        <div className="error">Unable to load credits data</div>
      </div>
    );
  }

  return (
    <>
      <div className={`credits-container ${compact ? 'compact' : ''}`}>
        <div className="credits-header">
          <div className="credits-icon">
            <Coins size={compact ? 20 : 24} />
          </div>
          <div className="credits-info">
            <h3>Credits</h3>
            <div className="credits-balance">
              <span className="balance-amount">{creditsData.wallet.balance}</span>
              <span className="balance-label">credits</span>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="credits-details">
            <div className="detail-item">
              <TrendingUp size={16} />
              <span>Performance Points: {creditsData.performancePoints}</span>
            </div>
            <div className="detail-item">
              <Award size={16} />
              <span>Badge: {creditsData.badge.displayName}</span>
            </div>
            <div className="detail-item">
              <DollarSign size={16} />
              <span>Discount: {creditsData.badge.discount}%</span>
            </div>
          </div>
        )}

        {showTransactions && (
          <button 
            className="view-transactions-btn"
            onClick={handleViewTransactions}
          >
            <History size={16} />
            View Transactions
          </button>
        )}
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Transaction History</h3>
              <button 
                className="close-btn"
                onClick={() => setShowTransactionModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="transactions-list">
                {transactions.length > 0 ? (
                  transactions.map((transaction, index) => (
                    <div key={index} className="transaction-item">
                      <div className="transaction-icon">
                        {transaction.type === 'enroll' && <Coins size={16} />}
                        {transaction.type === 'earn' && <TrendingUp size={16} />}
                        {transaction.type === 'bonus' && <Award size={16} />}
                        {transaction.type === 'cashout' && <DollarSign size={16} />}
                        {transaction.type === 'onboarding' && <Award size={16} />}
                        {transaction.type === 'refund' && <Coins size={16} />}
                      </div>
                      <div className="transaction-details">
                        <div className="transaction-type">
                          {formatTransactionType(transaction.type)}
                        </div>
                        <div className="transaction-description">
                          {transaction.description}
                        </div>
                        <div className="transaction-meta">
                          {transaction.relatedCourse && (
                            <span className="course-name">
                              {transaction.relatedCourse.title}
                            </span>
                          )}
                          <span className="transaction-date">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="transaction-amount">
                        <span className={`amount ${transaction.type === 'enroll' || transaction.type === 'cashout' ? 'negative' : 'positive'}`}>
                          {formatTransactionAmount(transaction.net_credits, transaction.type)}
                        </span>
                        {transaction.fee_credits > 0 && (
                          <span className="fee">
                            Fee: {transaction.fee_credits}
                          </span>
                        )}
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
          </div>
        </div>
      )}
    </>
  );
};

export default Credits;
