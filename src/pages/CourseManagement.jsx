import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Image, Users, Star, Clock, Edit, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './CourseManagement.css';

const CourseManagement = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
      fetchReviews();
      fetchStudents();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCourse(data.course);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // Sort reviews by date (most recent first)
        const sortedReviews = data.reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReviews(sortedReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const embedVideo = (url) => {
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert Vimeo URLs to embed format
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    // For other URLs, return as is
    return url;
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="course-info">
        <div className="course-header">
          <img src={course.image} alt={course.title} className="course-image" />
          <div className="course-details">
            <h2>{course.title}</h2>
            <p className="course-description">{course.description}</p>
            <div className="course-meta">
              <div className="meta-item">
                <Users size={16} />
                <span>{course.enrollmentCount || 0} students</span>
              </div>
              <div className="meta-item">
                <Star size={16} />
                <span>{course.averageRating?.toFixed(1) || 0} rating</span>
              </div>
              <div className="meta-item">
                <Clock size={16} />
                <span>{course.duration?.weeks || 0} weeks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {course.images && course.images.length > 0 && (
        <div className="course-images">
          <h3>Course Images</h3>
          <div className="images-grid">
            {course.images.map((image, index) => (
              <div key={index} className="image-item">
                <img src={image} alt={`Course image ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {course.videos && course.videos.length > 0 && (
        <div className="course-videos">
          <h3>Course Videos</h3>
          <div className="videos-grid">
            {course.videos.map((video, index) => (
              <div key={index} className="video-item">
                <iframe
                  src={embedVideo(video)}
                  title={`Course video ${index + 1}`}
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCurriculum = () => (
    <div className="curriculum-content">
      <div className="curriculum-section">
        <h3>Prerequisites</h3>
        {course.requirements && course.requirements.length > 0 ? (
          <ul className="requirements-list">
            {course.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        ) : (
          <p className="no-content">No prerequisites specified</p>
        )}
      </div>

      <div className="curriculum-section">
        <h3>Learning Outcomes</h3>
        {course.learningOutcomes && course.learningOutcomes.length > 0 ? (
          <ul className="outcomes-list">
            {course.learningOutcomes.map((outcome, index) => (
              <li key={index}>{outcome}</li>
            ))}
          </ul>
        ) : (
          <p className="no-content">No learning outcomes specified</p>
        )}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="reviews-content">
      <div className="reviews-header">
        <h3>Student Reviews</h3>
        <div className="reviews-summary">
          <div className="rating-summary">
            <span className="average-rating">{course.averageRating?.toFixed(1) || 0}</span>
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={i < Math.floor(course.averageRating || 0) ? 'filled' : ''} />
              ))}
            </div>
            <span className="total-reviews">({reviews.length} reviews)</span>
          </div>
        </div>
      </div>

      <div className="reviews-list">
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <div key={index} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <img src={review.student.avatar || 'https://via.placeholder.com/40'} alt={review.student.username} />
                  <div>
                    <h4>{review.student.username}</h4>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? 'filled' : ''} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="review-text">{review.comment}</p>
            </div>
          ))
        ) : (
          <div className="no-reviews">
            <p>No reviews yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="students-content">
      <div className="students-header">
        <h3>Enrolled Students ({students.length})</h3>
      </div>
      
      <div className="students-list">
        {students.length > 0 ? (
          students.map((student, index) => (
            <div key={index} className="student-item">
              <img src={student.avatar || 'https://via.placeholder.com/40'} alt={student.username} />
              <div className="student-info">
                <h4>{student.username}</h4>
                <p>Enrolled: {new Date(student.enrolledAt).toLocaleDateString()}</p>
              </div>
              <div className="student-progress">
                <span>{student.progress || 0}% Complete</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-students">
            <p>No students enrolled yet</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="course-management">
        <div className="loading">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-management">
        <div className="error">Course not found</div>
      </div>
    );
  }

  return (
    <div className="course-management">
      <div className="course-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft size={20} />
          Back to Profile
        </button>
        <h1>Manage Course: {course.title}</h1>
      </div>

      <div className="course-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'curriculum' ? 'active' : ''}`}
          onClick={() => setActiveTab('curriculum')}
        >
          Curriculum
        </button>
        <button 
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({reviews.length})
        </button>
        <button 
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Students ({students.length})
        </button>
      </div>

      <div className="course-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'curriculum' && renderCurriculum()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'students' && renderStudents()}
      </div>
    </div>
  );
};

export default CourseManagement;
