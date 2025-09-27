import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Download, Search, Coins, TrendingUp, Award, DollarSign, Clock, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Transactions.css';

const Transactions = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);

      const response = await fetch(`http://localhost:5000/api/credits/transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
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

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'enroll':
        return <BookOpen className="transaction-icon" />;
      case 'earn':
        return <TrendingUp className="transaction-icon" />;
      case 'bonus':
        return <Award className="transaction-icon" />;
      case 'cashout':
        return <DollarSign className="transaction-icon" />;
      case 'onboarding':
        return <Award className="transaction-icon" />;
      case 'refund':
        return <Coins className="transaction-icon" />;
      default:
        return <Coins className="transaction-icon" />;
    }
  };

  const formatAmount = (amount, type) => {
    const prefix = ['enroll', 'cashout', 'refund'].includes(type) ? '-' : '+';
    return `${prefix}${amount}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.relatedCourse?.title?.toLowerCase().includes(searchLower) ||
      formatTransactionType(transaction.type).toLowerCase().includes(searchLower)
    );
  });

  if (!user) {
    return (
      <div className="transactions-page">
        <div className="container">
          <div className="auth-required">
            <h2>Authentication Required</h2>
            <p>Please log in to view your transaction history.</p>
            <Link to="/login" className="btn-primary">Log In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <div className="container">
        {/* Header */}
        <div className="transactions-header">
          <div className="header-left">
            <Link to="/profile" className="back-btn">
              <ArrowLeft size={20} />
              Back to Profile
            </Link>
            <h1>Transaction History</h1>
          </div>
          <div className="header-actions">
            <button className="export-btn">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="transactions-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange({ type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="enroll">Enrollments</option>
              <option value="earn">Earnings</option>
              <option value="bonus">Bonuses</option>
              <option value="cashout">Cashouts</option>
              <option value="onboarding">Onboarding</option>
              <option value="refund">Refunds</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="transactions-content">
          {loading ? (
            <div className="loading">Loading transactions...</div>
          ) : filteredTransactions.length > 0 ? (
            <>
              <div className="transactions-list">
                {filteredTransactions.map((transaction, index) => (
                  <div key={index} className="transaction-item">
                    <div className="transaction-icon-container">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    
                    <div className="transaction-details">
                      <div className="transaction-header">
                        <h3 className="transaction-type">
                          {formatTransactionType(transaction.type)}
                        </h3>
                        <span className="transaction-date">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </div>
                      
                      <p className="transaction-description">
                        {transaction.description}
                      </p>
                      
                      {transaction.relatedCourse && (
                        <div className="transaction-course">
                          <BookOpen size={14} />
                          <span>{transaction.relatedCourse.title}</span>
                        </div>
                      )}
                      
                      {transaction.meta && Object.keys(transaction.meta).length > 0 && (
                        <div className="transaction-meta">
                          {transaction.meta.badgeUpgraded && (
                            <span className="meta-badge">Badge Upgraded!</span>
                          )}
                          {transaction.meta.discountApplied && (
                            <span className="meta-discount">
                              {transaction.meta.discountApplied}% discount applied
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="transaction-amount">
                      <div className={`amount ${transaction.type === 'enroll' || transaction.type === 'cashout' ? 'negative' : 'positive'}`}>
                        {formatAmount(transaction.net_credits, transaction.type)}
                      </div>
                      {transaction.fee_credits > 0 && (
                        <div className="fee">
                          Fee: {transaction.fee_credits}
                        </div>
                      )}
                      <div className="status">
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </button>
                  
                  <div className="pagination-info">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Coins size={48} />
              <h3>No transactions found</h3>
              <p>You don't have any transactions yet. Start by enrolling in a course!</p>
              <Link to="/courses" className="btn-primary">Browse Courses</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
