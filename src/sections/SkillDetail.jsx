import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  Users, 
  Clock, 
  Play, 
  Download, 
  Share2, 
  Heart,
  MessageCircle,
  Award,
  MapPin,
  Calendar,
  BookOpen,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './SkillDetail.css';

const SkillDetail = () => {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCourse, setIsCourse] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First try to fetch as a skill
        let response = await fetch(`http://localhost:5000/api/skills/${skillId}`);
        
        if (response.ok) {
          let data = await response.json();
          if (data.success) {
            setSkill(data.skill);
            setIsCourse(false);
            // Check if user is enrolled
            if (user && data.skill.enrolledStudents?.includes(user._id)) {
              setIsEnrolled(true);
            }
            // Check if user has favorited this skill
            if (user && data.skill.favoritedBy?.includes(user._id)) {
              setIsFavorited(true);
            }
            return; // Exit early if skill found
          }
        }
        
        // If skill not found (404) or failed, try as a course
        response = await fetch(`http://localhost:5000/api/courses/${skillId}`);
        
        if (response.ok) {
          let data = await response.json();
          if (data.success) {
            setSkill(data.course);
            setIsCourse(true);
            // Check if user is enrolled in the course
            if (user && data.course.enrolledStudents?.includes(user._id)) {
              setIsEnrolled(true);
            }
            return; // Exit early if course found
          }
        }
        
        // If both failed, set error
        setError('Content not found');
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setError('Unable to connect to server. Please make sure the backend is running.');
        } else {
          setError('Failed to load details');
        }
      } finally {
        setLoading(false);
      }
    };

    if (skillId) {
      fetchData();
    }
  }, [skillId, user]);

  const handleEnroll = async () => {
    if (!token) {
      alert(`Please log in to enroll in this ${isCourse ? 'course' : 'skill'}`);
      return;
    }

    try {
      const endpoint = isCourse 
        ? `http://localhost:5000/api/courses/${skillId}/enroll`
        : `http://localhost:5000/api/skills/${skillId}/enroll`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setIsEnrolled(true);
        alert(`Successfully enrolled in this ${isCourse ? 'course' : 'skill'}!`);
      } else {
        alert(data.message || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Error enrolling. Please try again.');
    }
  };

  const handleFavorite = async () => {
    if (!token) {
      alert('Please log in to favorite skills');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/skills/${skillId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setIsFavorited(!isFavorited);
      } else {
        alert(data.message || 'Failed to update favorite');
      }
    } catch (error) {
      console.error('Error favoriting:', error);
      alert('Error updating favorite. Please try again.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: skill?.title,
        text: skill?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="skill-detail-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading details...</p>
        </div>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="skill-detail-page error">
        <div className="error-container">
          <h2>Skill Not Found</h2>
          <p>{error || 'The skill you are looking for does not exist.'}</p>
          <button onClick={() => navigate('/marketplace')} className="btn-primary">
            <ArrowLeft size={18} /> Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="skill-detail-page">
      {/* Header */}
      <div className="skill-header">
        <div className="container">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={20} />
            Back
          </button>
          
          <div className="skill-hero">
            <div className="skill-media">
              <div className="skill-image">
                <img src={skill.image || 'https://via.placeholder.com/600x400?text=Skill+Image'} alt={skill.title} />
                <div className="play-overlay">
                  <button className="play-btn">
                    <Play size={24} />
                  </button>
                </div>
              </div>
              
              <div className="skill-gallery">
                {/* Additional images/videos would go here */}
                <div className="gallery-item">
                  <img src={skill.image || 'https://via.placeholder.com/150x100?text=Preview'} alt="Preview" />
                </div>
                <div className="gallery-item">
                  <img src={skill.image || 'https://via.placeholder.com/150x100?text=Preview'} alt="Preview" />
                </div>
                <div className="gallery-item">
                  <img src={skill.image || 'https://via.placeholder.com/150x100?text=Preview'} alt="Preview" />
                </div>
              </div>
            </div>

            <div className="skill-info">
              <div className="skill-meta">
                <span className="category-badge">{skill.category}</span>
                <span className="level-badge">{skill.level}</span>
              </div>
              
              <h1 className="skill-title">{skill.title}</h1>
              <p className="skill-description">{skill.description}</p>
              
              <div className="instructor-info">
                <div className="instructor-avatar">
                  <img src={skill.instructor?.avatar || 'https://via.placeholder.com/50x50?text=Instructor'} alt={skill.instructor?.username} />
                </div>
                <div className="instructor-details">
                  <h3>Instructor: {skill.instructor?.username || 'Unknown'}</h3>
                  <div className="instructor-stats">
                    <span><Star size={14} /> {(Number(skill.instructor?.averageRating) || 0).toFixed(1)}</span>
                    <span><Users size={14} /> {skill.instructor?.totalStudents || 0} students</span>
                    <span><Award size={14} /> {skill.instructor?.totalCourses || 0} courses</span>
                  </div>
                </div>
              </div>

              <div className="skill-stats">
                <div className="stat">
                  <Star size={20} />
                  <div>
                    <span className="stat-value">{skill.averageRating?.toFixed(1) || 0}</span>
                    <span className="stat-label">Rating</span>
                  </div>
                </div>
                <div className="stat">
                  <Users size={20} />
                  <div>
                    <span className="stat-value">{skill.students?.length || 0}</span>
                    <span className="stat-label">Students</span>
                  </div>
                </div>
                <div className="stat">
                  <Clock size={20} />
                  <div>
                    <span className="stat-value">{skill.duration?.weeks || 0}</span>
                    <span className="stat-label">Weeks</span>
                  </div>
                </div>
                <div className="stat">
                  <Calendar size={20} />
                  <div>
                    <span className="stat-value">{new Date(skill.createdAt).toLocaleDateString()}</span>
                    <span className="stat-label">Created</span>
                  </div>
                </div>
              </div>

              <div className="skill-actions">
                <div className="price-section">
                  {isCourse && user && user.badge_level && user.badge_level !== 'Bronze' ? (
                    <div className="pricing-with-discount">
                      <div className="original-price">{skill.price} credits</div>
                      <div className="discounted-price">
                        {Math.max(1, Math.floor(skill.price * (1 - (user.badge_level === 'Silver' ? 5 : user.badge_level === 'Gold' ? 10 : user.badge_level === 'Platinum' ? 15 : user.badge_level === 'Diamond' ? 20 : user.badge_level === 'Master' ? 25 : 30) / 100)))} credits
                      </div>
                      <div className="discount-info">
                        <span className="discount-badge">
                          {user.badge_level} {user.badge_tier === 1 ? 'I' : user.badge_tier === 2 ? 'II' : 'III'} Discount
                        </span>
                        <span className="discount-percentage">
                          {user.badge_level === 'Silver' ? 5 : user.badge_level === 'Gold' ? 10 : user.badge_level === 'Platinum' ? 15 : user.badge_level === 'Diamond' ? 20 : user.badge_level === 'Master' ? 25 : 30}% off
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="standard-pricing">
                      <span className="price">{skill.price} credits</span>
                      <span className="price-label">One-time payment</span>
                    </div>
                  )}
                </div>
                
                <div className="action-buttons">
                  {isEnrolled ? (
                    <button className="btn-success enrolled-btn">
                      <CheckCircle size={18} />
                      Enrolled
                    </button>
                  ) : (
                    <button onClick={handleEnroll} className="btn-primary enroll-btn">
                      <BookOpen size={18} />
                      {isCourse ? 'Join Course' : 'Enroll Now'}
                    </button>
                  )}
                  
                  <button onClick={handleFavorite} className={`btn-secondary favorite-btn ${isFavorited ? 'favorited' : ''}`}>
                    <Heart size={18} />
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </button>
                  
                  <button onClick={handleShare} className="btn-secondary share-btn">
                    <Share2 size={18} />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="skill-content">
        <div className="container">
          <div className="content-tabs">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
              onClick={() => setActiveTab('curriculum')}
            >
              Curriculum
            </button>
            <button 
              className={`tab-btn ${activeTab === 'instructor' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructor')}
            >
              Instructor
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-content">
                <h3>What you'll learn</h3>
                <ul className="learning-objectives">
                  <li>Master the fundamentals of {skill.title}</li>
                  <li>Build practical projects and applications</li>
                  <li>Understand best practices and industry standards</li>
                  <li>Develop problem-solving skills</li>
                  <li>Create a portfolio of work</li>
                </ul>

                <h3>Requirements</h3>
                <ul className="requirements">
                  <li>Basic computer skills</li>
                  <li>Internet connection</li>
                  <li>Dedication to learning</li>
                </ul>

                <h3>Description</h3>
                <p>{skill.description}</p>
                <p>This comprehensive course will take you from beginner to advanced level in {skill.title}. You'll learn through hands-on projects, real-world examples, and practical exercises.</p>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="curriculum-content">
                <h3>Course Curriculum</h3>
                <div className="curriculum-sections">
                  <div className="curriculum-section">
                    <h4>Section 1: Introduction</h4>
                    <div className="curriculum-items">
                      <div className="curriculum-item">
                        <Play size={16} />
                        <span>Welcome to the course</span>
                        <span className="duration">5 min</span>
                      </div>
                      <div className="curriculum-item">
                        <Play size={16} />
                        <span>Course overview and objectives</span>
                        <span className="duration">10 min</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="curriculum-section">
                    <h4>Section 2: Fundamentals</h4>
                    <div className="curriculum-items">
                      <div className="curriculum-item">
                        <Play size={16} />
                        <span>Basic concepts and terminology</span>
                        <span className="duration">15 min</span>
                      </div>
                      <div className="curriculum-item">
                        <Play size={16} />
                        <span>Setting up your environment</span>
                        <span className="duration">20 min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'instructor' && (
              <div className="instructor-content">
                <div className="instructor-profile">
                  <img src={skill.instructor?.avatar || 'https://via.placeholder.com/150x150?text=Instructor'} alt={skill.instructor?.username} />
                  <div className="instructor-bio">
                    <h3>{skill.instructor?.username || 'Unknown Instructor'}</h3>
                    <p className="instructor-title">Expert in {skill.category}</p>
                    <p>{skill.instructor?.bio || 'Experienced instructor with years of teaching experience.'}</p>
                    
                    <div className="instructor-achievements">
                      <div className="achievement">
                        <Award size={20} />
                        <span>Certified Professional</span>
                      </div>
                      <div className="achievement">
                        <Users size={20} />
                        <span>{skill.instructor?.totalStudents || 0} Students Taught</span>
                      </div>
                      <div className="achievement">
                        <Star size={20} />
                        <span>{skill.instructor?.averageRating?.toFixed(1) || 0} Average Rating</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-content">
                <div className="reviews-summary">
                  <div className="rating-overview">
                    <span className="rating-number">{skill.averageRating?.toFixed(1) || 0}</span>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={20} className={star <= (skill.averageRating || 0) ? 'filled' : ''} />
                      ))}
                    </div>
                    <span className="rating-count">({skill.totalRatings || 0} reviews)</span>
                  </div>
                </div>

                <div className="reviews-list">
                  <div className="review-item">
                    <div className="reviewer-info">
                      <img src="https://via.placeholder.com/40x40?text=User" alt="Reviewer" />
                      <div>
                        <h4>John Doe</h4>
                        <div className="review-rating">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} size={14} className="filled" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="review-text">"Excellent course! The instructor explains everything clearly and the projects are very practical."</p>
                    <span className="review-date">2 weeks ago</span>
                  </div>

                  <div className="review-item">
                    <div className="reviewer-info">
                      <img src="https://via.placeholder.com/40x40?text=User" alt="Reviewer" />
                      <div>
                        <h4>Jane Smith</h4>
                        <div className="review-rating">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} size={14} className="filled" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="review-text">"Great learning experience. I was able to apply what I learned immediately in my work."</p>
                    <span className="review-date">1 month ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillDetail;
