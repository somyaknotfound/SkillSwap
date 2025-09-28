import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown, Star, Users, Clock, BookOpen } from 'lucide-react';
import Badge from './Badge';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('alltime');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/credits/leaderboard?type=${activeTab}`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="rank-icon gold" />;
      case 2:
        return <Medal className="rank-icon silver" />;
      case 3:
        return <Award className="rank-icon bronze" />;
      default:
        return <span className="rank-number">{rank}</span>;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return '#ffd700';
      case 2:
        return '#c0c0c0';
      case 3:
        return '#cd7f32';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }

  if (!leaderboardData) {
    return (
      <div className="leaderboard-container">
        <div className="error">Unable to load leaderboard data</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>Leaderboard</h2>
        <div className="leaderboard-tabs">
          <button 
            className={`tab ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            <Clock size={16} />
            Weekly
          </button>
          <button 
            className={`tab ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            <Calendar size={16} />
            Monthly
          </button>
          <button 
            className={`tab ${activeTab === 'alltime' ? 'active' : ''}`}
            onClick={() => setActiveTab('alltime')}
          >
            <Trophy size={16} />
            All Time
          </button>
        </div>
      </div>

      <div className="leaderboard-content">
        <div className="leaderboard-info">
          <p className="leaderboard-description">
            {activeTab === 'weekly' && 'Top performers this week based on performance points earned.'}
            {activeTab === 'monthly' && 'Top performers this month based on performance points earned.'}
            {activeTab === 'alltime' && 'All-time top performers based on total performance points.'}
          </p>
          <div className="leaderboard-stats">
            <div className="stat">
              <Users size={16} />
              <span>{leaderboardData.total} participants</span>
            </div>
          </div>
        </div>

        <div className="leaderboard-list">
          {leaderboardData.leaderboard.length > 0 ? (
            leaderboardData.leaderboard.map((user, index) => (
              <div key={user.id} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
                <div className="rank-section">
                  {getRankIcon(user.rank)}
                </div>
                
                <div className="user-section">
                  <div className="user-avatar">
                    <img 
                      src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'} 
                      alt={user.username}
                    />
                  </div>
                  <div className="user-info">
                    <h4 className="username">{user.username}</h4>
                    <div className="user-badge">
                      <Badge 
                        level={user.badge.split(' ')[0]} 
                        tier={user.badge.split(' ')[1] === 'I' ? 1 : user.badge.split(' ')[1] === 'II' ? 2 : 3}
                        size="small"
                        showTooltip={false}
                      />
                    </div>
                  </div>
                </div>

                <div className="stats-section">
                  <div className="stat-item">
                    <Star size={16} />
                    <span className="stat-value">{user.performancePoints}</span>
                    <span className="stat-label">Points</span>
                  </div>
                  <div className="stat-item">
                    <BookOpen size={16} />
                    <span className="stat-value">{user.coursesCompleted}</span>
                    <span className="stat-label">Courses</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Trophy size={48} />
              <h3>No data available</h3>
              <p>No leaderboard data for this time period.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
