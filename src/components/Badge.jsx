import React from 'react';
import { Award, Star, Crown, Gem, Zap, Flame, Trophy } from 'lucide-react';
import './Badge.css';

const Badge = ({ level, tier, size = 'medium', showTooltip = true, className = '' }) => {
  const getBadgeIcon = (level) => {
    switch (level) {
      case 'Bronze':
        return <Award className="badge-icon" />;
      case 'Silver':
        return <Star className="badge-icon" />;
      case 'Gold':
        return <Crown className="badge-icon" />;
      case 'Platinum':
        return <Gem className="badge-icon" />;
      case 'Diamond':
        return <Zap className="badge-icon" />;
      case 'Master':
        return <Flame className="badge-icon" />;
      case 'Legend':
        return <Trophy className="badge-icon" />;
      default:
        return <Award className="badge-icon" />;
    }
  };

  const getBadgeColor = (level) => {
    switch (level) {
      case 'Bronze':
        return '#cd7f32';
      case 'Silver':
        return '#c0c0c0';
      case 'Gold':
        return '#ffd700';
      case 'Platinum':
        return '#e5e4e2';
      case 'Diamond':
        return '#b9f2ff';
      case 'Master':
        return '#ff6b35';
      case 'Legend':
        return '#8a2be2';
      default:
        return '#cd7f32';
    }
  };

  const getTierName = (tier) => {
    switch (tier) {
      case 1:
        return 'I';
      case 2:
        return 'II';
      case 3:
        return 'III';
      default:
        return 'I';
    }
  };

  const getDiscountPercentage = (level, tier) => {
    const levelDiscounts = {
      'Bronze': 0,
      'Silver': 5,
      'Gold': 10,
      'Platinum': 15,
      'Diamond': 20,
      'Master': 25,
      'Legend': 30
    };
    
    const tierMultiplier = tier === 1 ? 1.5 : tier === 2 ? 1.25 : 1;
    return Math.min(levelDiscounts[level] * tierMultiplier, 50);
  };

  const badgeColor = getBadgeColor(level);
  const tierName = getTierName(tier);
  const discount = getDiscountPercentage(level, tier);

  const badgeContent = (
    <div className={`badge ${size} ${className}`} style={{ '--badge-color': badgeColor }}>
      <div className="badge-icon-container">
        {getBadgeIcon(level)}
      </div>
      <div className="badge-text">
        <span className="badge-level">{level}</span>
        <span className="badge-tier">{tierName}</span>
      </div>
    </div>
  );

  if (showTooltip) {
    return (
      <div className="badge-tooltip-container">
        {badgeContent}
        <div className="badge-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-title">{level} {tierName}</span>
            <span className="tooltip-discount">{discount}% discount</span>
          </div>
          <div className="tooltip-body">
            <p>Earn performance points to upgrade your badge and unlock better discounts on courses!</p>
            <div className="tooltip-stats">
              <div className="stat">
                <span className="stat-label">Current Tier:</span>
                <span className="stat-value">{tierName}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Discount:</span>
                <span className="stat-value">{discount}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return badgeContent;
};

export default Badge;
