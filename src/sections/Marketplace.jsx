import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Clock, Users, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Marketplace.css';

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const categories = [
    { id: 'all', name: 'All Skills', icon: '🎯' },
    { id: 'programming', name: 'Programming', icon: '💻' },
    { id: 'design', name: 'Design', icon: '🎨' },
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'languages', name: 'Languages', icon: '🗣️' }
  ];

  // Fetch courses from database
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/courses');
        const data = await response.json();
        
        if (data.success) {
          // Filter out courses created by the current user
          const otherUsersCourses = data.courses.filter(course => 
            course.instructor._id !== user?._id
          );
          setCourses(otherUsersCourses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  // Filter courses based on search and category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="marketplace-page">
      {/* Header Section */}
      <section className="marketplace-header">
        <div className="container">
          <h1>Skill Marketplace</h1>
          <p>Discover and learn new skills from expert instructors worldwide</p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="search-section">
        <div className="container">
          <div className="search-bar">
            <div className="search-input">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search skills, instructors, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="filter-btn">
              <Filter size={20} />
              Filters
            </button>
          </div>

          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="category-icon">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Grid */}
      <section className="skills-section">
        <div className="container">
          <div className="skills-grid">
            {loading ? (
              <div className="loading-message">Loading courses...</div>
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map(course => (
              <Link key={course._id} to={`/course/${course._id}`} className="skill-card-link">
                <div className="skill-card">
                  <div className="skill-image">
                    <img src={course.image || 'https://via.placeholder.com/400x300?text=Course'} alt={course.title} />
                    <div className="skill-category">{course.category}</div>
                  </div>
                  <div className="skill-content">
                    <h3 className="skill-title">{course.title}</h3>
                    <p className="skill-instructor">by {course.instructor?.username || 'Unknown'}</p>
                    <p className="skill-description">{course.description}</p>
                    
                    <div className="skill-stats">
                      <div className="stat">
                        <Star size={16} />
                        <span>{course.averageRating?.toFixed(1) || 0}</span>
                      </div>
                      <div className="stat">
                        <Users size={16} />
                        <span>{course.enrollmentCount || 0}</span>
                      </div>
                      <div className="stat">
                        <Clock size={16} />
                        <span>{course.duration?.weeks || 0} weeks</span>
                      </div>
                    </div>

                    <div className="skill-footer">
                      <div className="skill-price">{course.price} credits</div>
                      <button className="enroll-btn" onClick={(e) => e.preventDefault()}>View Details</button>
                    </div>
                  </div>
                </div>
              </Link>
              ))
            ) : (
              <div className="empty-state">
                <p>No courses found. Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Marketplace;
