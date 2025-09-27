import React, { useState, useEffect } from 'react';
import { User, BookOpen, Users, Award, Clock, Star, TrendingUp, Plus, Edit, Trash2, X, Save, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MyProfile.css';

const MyProfile = () => {
  const [activeTab, setActiveTab] = useState('my-skills');
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  
  // Use real user data or fallback to default
  const userProfile = user || {
    firstName: 'Guest',
    lastName: 'User',
    username: 'guest',
    email: 'guest@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    joinDate: 'January 2023',
    totalSkills: 0,
    teachingHours: 0,
    learningHours: 0,
    rating: 0
  };

  // Create display name from available fields
  const displayName = userProfile.firstName && userProfile.lastName 
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : userProfile.username || userProfile.email || 'Guest User';
  
  // Modal states
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBrowseCoursesModal, setShowBrowseCoursesModal] = useState(false);
  
  // Form states
  const [newSkill, setNewSkill] = useState({
    title: '',
    category: 'programming',
    level: 'beginner'
  });
  
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'programming',
    level: 'beginner',
    price: 0,
    duration: {
      weeks: 1
    },
    image: '',
    images: [],
    videos: [],
    testimonials: [],
    requirements: [],
    learningOutcomes: []
  });
  
  const [editProfile, setEditProfile] = useState({
    name: userProfile.name,
    email: userProfile.email,
    avatar: userProfile.avatar
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Media upload states
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    text: '',
    rating: 5
  });
  const [newRequirement, setNewRequirement] = useState('');
  const [newLearningOutcome, setNewLearningOutcome] = useState('');

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user's skills
        const skillsResponse = await fetch('http://localhost:5000/api/skills/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const skillsData = await skillsResponse.json();
        if (skillsData.success) {
          setSkills(skillsData.skills);
        }

        // Fetch user's courses (teaching)
        const coursesResponse = await fetch('http://localhost:5000/api/courses/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const coursesData = await coursesResponse.json();
        if (coursesData.success) {
          setCourses(coursesData.teachingCourses);
          setEnrolledCourses(coursesData.enrolledCourses);
        }

        // Fetch all available courses
        const availableCoursesResponse = await fetch('http://localhost:5000/api/courses');
        const availableCoursesData = await availableCoursesResponse.json();
        if (availableCoursesData.success) {
          setAvailableCourses(availableCoursesData.courses);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Handler functions
  const handleAddSkill = async () => {
    if (!newSkill.title.trim()) {
      alert('Please enter a skill title');
      return;
    }

    if (!token) {
      alert('Please log in to add skills');
      return;
    }

    try {
      console.log('Adding skill:', newSkill);
      const response = await fetch('http://localhost:5000/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSkill)
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setSkills([...skills, data.skill]);
        setNewSkill({ title: '', category: 'programming', level: 'beginner' });
        setShowAddSkillModal(false);
        alert('Skill added successfully!');
      } else {
        alert(data.message || 'Failed to add skill');
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Error adding skill. Please try again.');
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim() || !newCourse.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!token) {
      alert('Please log in to create courses');
      return;
    }

    try {
      console.log('Creating course:', newCourse);
      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCourse)
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
             if (data.success) {
               setCourses([...courses, data.course]);
               setNewCourse({ 
                 title: '', 
                 description: '', 
                 category: 'programming', 
                 level: 'beginner', 
                 price: 0, 
                 duration: { weeks: 1 },
                 image: '',
                 images: [],
                 videos: [],
                 testimonials: [],
                 requirements: [],
                 learningOutcomes: []
               });
               setShowCreateCourseModal(false);
               alert('Course created successfully!');
             } else {
               alert(data.message || 'Failed to create course');
             }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course. Please try again.');
    }
  };

  const handleEditProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editProfile)
      });
      
      const data = await response.json();
      if (data.success) {
        setShowEditProfileModal(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleEnrollCourse = async (courseId) => {
    if (!token) {
      alert('Please log in to enroll in courses');
      return;
    }

    try {
      console.log('Enrolling in course:', courseId);
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        alert('Successfully enrolled in course!');
        // Refresh the available courses to update enrollment status
        const availableCoursesResponse = await fetch('http://localhost:5000/api/courses');
        const availableCoursesData = await availableCoursesResponse.json();
        if (availableCoursesData.success) {
          setAvailableCourses(availableCoursesData.courses);
        }
      } else {
        alert(data.message || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Error enrolling in course. Please try again.');
    }
  };

  // Media and content management functions
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setNewCourse({
      ...newCourse,
      images: [...newCourse.images, ...imageUrls]
    });
  };

  const handleVideoUpload = (event) => {
    const files = Array.from(event.target.files);
    const videoUrls = files.map(file => URL.createObjectURL(file));
    setNewCourse({
      ...newCourse,
      videos: [...newCourse.videos, ...videoUrls]
    });
  };

  const removeImage = (index) => {
    const newImages = newCourse.images.filter((_, i) => i !== index);
    setNewCourse({ ...newCourse, images: newImages });
  };

  const removeVideo = (index) => {
    const newVideos = newCourse.videos.filter((_, i) => i !== index);
    setNewCourse({ ...newCourse, videos: newVideos });
  };

  const addTestimonial = () => {
    if (newTestimonial.name && newTestimonial.text) {
      setNewCourse({
        ...newCourse,
        testimonials: [...newCourse.testimonials, { ...newTestimonial }]
      });
      setNewTestimonial({ name: '', text: '', rating: 5 });
    }
  };

  const removeTestimonial = (index) => {
    const newTestimonials = newCourse.testimonials.filter((_, i) => i !== index);
    setNewCourse({ ...newCourse, testimonials: newTestimonials });
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setNewCourse({
        ...newCourse,
        requirements: [...newCourse.requirements, newRequirement.trim()]
      });
      setNewRequirement('');
    }
  };

  const removeRequirement = (index) => {
    const newRequirements = newCourse.requirements.filter((_, i) => i !== index);
    setNewCourse({ ...newCourse, requirements: newRequirements });
  };

  const addLearningOutcome = () => {
    if (newLearningOutcome.trim()) {
      setNewCourse({
        ...newCourse,
        learningOutcomes: [...newCourse.learningOutcomes, newLearningOutcome.trim()]
      });
      setNewLearningOutcome('');
    }
  };

  const removeLearningOutcome = (index) => {
    const newLearningOutcomes = newCourse.learningOutcomes.filter((_, i) => i !== index);
    setNewCourse({ ...newCourse, learningOutcomes: newLearningOutcomes });
  };

  // Skills are now fetched from the database via the skills state

  // Teaching and learning courses are now fetched from the database


  const renderMySkills = () => (
    <div className="skills-content">
      <div className="content-header">
        <h2>My Learning Journey</h2>
        <button 
          className="add-skill-btn"
          onClick={() => setShowAddSkillModal(true)}
        >
          <Plus size={20} />
          Add New Skill
        </button>
      </div>
      
      <div className="skills-grid">
        {loading ? (
          <div className="loading-message">Loading skills...</div>
        ) : skills.length > 0 ? (
          skills.map(skill => (
          <div key={skill._id} className="skill-card">
            <div className="skill-header">
              <div className="skill-info">
                <h3>{skill.title}</h3>
                <span className="skill-category">{skill.category}</span>
              </div>
              <div className="skill-level">{skill.level}</div>
            </div>
            
            <div className="skill-details">
              <div className="detail-item">
                <Clock size={16} />
                <span>Added: {new Date(skill.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="skill-actions">
              <button className="edit-btn">
                <Edit size={16} />
              </button>
              <button className="delete-btn">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No skills yet. Add your first skill to get started!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTeaching = () => (
    <div className="teaching-content">
      <div className="content-header">
        <h2>My Teaching</h2>
        <button 
          className="create-course-btn"
          onClick={() => setShowCreateCourseModal(true)}
        >
          <Plus size={20} />
          Create New Course
        </button>
      </div>
      
      <div className="teaching-stats">
        <div className="stat-card">
          <Users size={24} />
          <div>
            <h3>105</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={24} />
          <div>
            <h3>156</h3>
            <p>Teaching Hours</p>
          </div>
        </div>
        <div className="stat-card">
          <Star size={24} />
          <div>
            <h3>4.8</h3>
            <p>Average Rating</p>
          </div>
        </div>
      </div>
      
      <div className="courses-grid">
        {loading ? (
          <div className="loading-message">Loading courses...</div>
        ) : courses.length > 0 ? (
          courses.map(course => (
          <div key={course._id} className="course-card">
            <div className="course-header">
              <h3>{course.title}</h3>
              <span className="status-badge active">
                Active
              </span>
            </div>
            
            <div className="course-stats">
              <div className="stat">
                <Users size={16} />
                <span>{course.enrolledStudents?.length || 0} students</span>
              </div>
              <div className="stat">
                <Star size={16} />
                <span>{course.averageRating?.toFixed(1) || 0} rating</span>
              </div>
              <div className="stat">
                <TrendingUp size={16} />
                <span>${course.price}</span>
              </div>
            </div>
            
            <div className="course-details">
              <div className="detail-item">
                <Clock size={16} />
                <span>Duration: {course.duration?.weeks || 0} weeks</span>
              </div>
            </div>
            
            <div className="course-actions">
              <button className="manage-btn">Manage Course</button>
              <button className="edit-btn">
                <Edit size={16} />
              </button>
            </div>
          </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No courses yet. Create your first course to start teaching!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLearning = () => (
    <div className="learning-content">
      <div className="content-header">
        <h2>My Learning</h2>
        <button 
          className="browse-courses-btn"
          onClick={() => setShowBrowseCoursesModal(true)}
        >
          <BookOpen size={20} />
          Browse Courses
        </button>
      </div>
      
      <div className="learning-stats">
        <div className="stat-card">
          <BookOpen size={24} />
          <div>
            <h3>3</h3>
            <p>Active Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={24} />
          <div>
            <h3>89</h3>
            <p>Learning Hours</p>
          </div>
        </div>
        <div className="stat-card">
          <Award size={24} />
          <div>
            <h3>5</h3>
            <p>Certificates</p>
          </div>
        </div>
      </div>
      
      <div className="courses-grid">
        {loading ? (
          <div className="loading-message">Loading enrolled courses...</div>
        ) : enrolledCourses.length > 0 ? (
          enrolledCourses.map(course => (
          <div key={course._id} className="course-card">
            <div className="course-header">
              <h3>{course.title}</h3>
              <span className="instructor">by {course.instructor?.username || 'Unknown'}</span>
            </div>
            
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${course.progress || 0}%` }}
                ></div>
              </div>
              <span className="progress-text">{course.progress || 0}% Complete</span>
            </div>
            
            <div className="course-details">
              <div className="detail-item">
                <BookOpen size={16} />
                <span>Category: {course.category}</span>
              </div>
              <div className="detail-item">
                <Clock size={16} />
                <span>Duration: {course.duration?.weeks || 0} weeks</span>
              </div>
            </div>
            
            <div className="course-actions">
              <button className="continue-btn">Continue Learning</button>
              <button className="view-btn">View Details</button>
            </div>
          </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No enrolled courses yet. Browse and enroll in courses to start learning!</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="my-profile-page">
      {/* Profile Header */}
      <section className="profile-header">
        <div className="container">
          <div className="profile-info">
            <div className="avatar-section">
              <img src={userProfile.avatar} alt={displayName} className="avatar" />
              <button className="edit-avatar-btn">
                <Edit size={16} />
              </button>
            </div>
            <div className="profile-details">
              <h1>{displayName}</h1>
              <p className="email">{userProfile.email}</p>
              <p className="join-date">Member since {userProfile.joinDate}</p>
              <button 
                className="edit-profile-btn"
                onClick={() => setShowEditProfileModal(true)}
              >
                <Edit size={16} />
                Edit Profile
              </button>
            </div>
          </div>
          
          <div className="profile-stats">
            <div className="stat">
              <BookOpen size={20} />
              <div>
                <h3>{userProfile.totalSkills}</h3>
                <p>Skills</p>
              </div>
            </div>
            <div className="stat">
              <Users size={20} />
              <div>
                <h3>{userProfile.teachingHours}</h3>
                <p>Teaching Hours</p>
              </div>
            </div>
            <div className="stat">
              <Clock size={20} />
              <div>
                <h3>{userProfile.learningHours}</h3>
                <p>Learning Hours</p>
              </div>
            </div>
            <div className="stat">
              <Star size={20} />
              <div>
                <h3>{userProfile.rating}</h3>
                <p>Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="profile-navigation">
        <div className="container">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'my-skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-skills')}
            >
              <BookOpen size={20} />
              My Skills
            </button>
            <button 
              className={`nav-tab ${activeTab === 'teaching' ? 'active' : ''}`}
              onClick={() => setActiveTab('teaching')}
            >
              <Users size={20} />
              Teaching
            </button>
            <button 
              className={`nav-tab ${activeTab === 'learning' ? 'active' : ''}`}
              onClick={() => setActiveTab('learning')}
            >
              <BookOpen size={20} />
              Learning
            </button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="profile-content">
        <div className="container">
          {activeTab === 'my-skills' && renderMySkills()}
          {activeTab === 'teaching' && renderTeaching()}
          {activeTab === 'learning' && renderLearning()}
        </div>
      </section>

      {/* Add Skill Modal */}
      {showAddSkillModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Skill</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddSkillModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Skill Title</label>
                <input
                  type="text"
                  value={newSkill.title}
                  onChange={(e) => setNewSkill({...newSkill, title: e.target.value})}
                  placeholder="e.g., JavaScript, Photography, Cooking"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({...newSkill, category: e.target.value})}
                >
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="music">Music</option>
                  <option value="business">Business</option>
                  <option value="languages">Languages</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Level</label>
                <select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({...newSkill, level: e.target.value})}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowAddSkillModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleAddSkill}
              >
                <Save size={16} />
                Add Skill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateCourseModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Course</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateCourseModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body enhanced-course-modal">
              {/* Basic Information */}
              <div className="form-section">
                <h4>Basic Information</h4>
                <div className="form-group">
                  <label>Course Title</label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    placeholder="e.g., Advanced React Patterns"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    placeholder="Describe what students will learn..."
                    rows="4"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                    >
                      <option value="programming">Programming</option>
                      <option value="design">Design</option>
                      <option value="music">Music</option>
                      <option value="business">Business</option>
                      <option value="languages">Languages</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Level</label>
                    <select
                      value={newCourse.level}
                      onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse({...newCourse, price: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (weeks)</label>
                    <input
                      type="number"
                      value={newCourse.duration.weeks}
                      onChange={(e) => setNewCourse({...newCourse, duration: { weeks: parseInt(e.target.value) || 1 }})}
                      placeholder="1"
                      min="1"
                      max="52"
                    />
                  </div>
                </div>
              </div>

              {/* Course Image */}
              <div className="form-section">
                <h4>Course Image</h4>
                <div className="form-group">
                  <label>Main Course Image URL</label>
                  <input
                    type="url"
                    value={newCourse.image}
                    onChange={(e) => setNewCourse({...newCourse, image: e.target.value})}
                    placeholder="https://example.com/course-image.jpg"
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div className="form-section">
                <h4>Additional Media</h4>
                <div className="media-upload-section">
                  <div className="upload-group">
                    <label>Course Images</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file-input"
                    />
                    <div className="image-preview-grid">
                      {newCourse.images.map((image, index) => (
                        <div key={index} className="image-preview">
                          <img src={image} alt={`Preview ${index + 1}`} />
                          <button type="button" onClick={() => removeImage(index)} className="remove-btn">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="upload-group">
                    <label>Course Videos</label>
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="file-input"
                    />
                    <div className="video-preview-grid">
                      {newCourse.videos.map((video, index) => (
                        <div key={index} className="video-preview">
                          <video controls>
                            <source src={video} type="video/mp4" />
                          </video>
                          <button type="button" onClick={() => removeVideo(index)} className="remove-btn">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="form-section">
                <h4>Course Requirements</h4>
                <div className="list-management">
                  <div className="add-item-form">
                    <input
                      type="text"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      placeholder="Add a requirement (e.g., Basic HTML knowledge)"
                      onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                    />
                    <button type="button" onClick={addRequirement} className="add-btn">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="item-list">
                    {newCourse.requirements.map((requirement, index) => (
                      <div key={index} className="list-item">
                        <span>{requirement}</span>
                        <button type="button" onClick={() => removeRequirement(index)} className="remove-btn">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Learning Outcomes */}
              <div className="form-section">
                <h4>Learning Outcomes</h4>
                <div className="list-management">
                  <div className="add-item-form">
                    <input
                      type="text"
                      value={newLearningOutcome}
                      onChange={(e) => setNewLearningOutcome(e.target.value)}
                      placeholder="Add a learning outcome (e.g., Build responsive web applications)"
                      onKeyPress={(e) => e.key === 'Enter' && addLearningOutcome()}
                    />
                    <button type="button" onClick={addLearningOutcome} className="add-btn">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="item-list">
                    {newCourse.learningOutcomes.map((outcome, index) => (
                      <div key={index} className="list-item">
                        <span>{outcome}</span>
                        <button type="button" onClick={() => removeLearningOutcome(index)} className="remove-btn">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Testimonials */}
              <div className="form-section">
                <h4>Student Testimonials</h4>
                <div className="testimonial-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Student Name</label>
                      <input
                        type="text"
                        value={newTestimonial.name}
                        onChange={(e) => setNewTestimonial({...newTestimonial, name: e.target.value})}
                        placeholder="Student name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Rating</label>
                      <select
                        value={newTestimonial.rating}
                        onChange={(e) => setNewTestimonial({...newTestimonial, rating: parseInt(e.target.value)})}
                      >
                        <option value={5}>5 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={2}>2 Stars</option>
                        <option value={1}>1 Star</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Testimonial Text</label>
                    <textarea
                      value={newTestimonial.text}
                      onChange={(e) => setNewTestimonial({...newTestimonial, text: e.target.value})}
                      placeholder="What did the student say about your course?"
                      rows="3"
                    />
                  </div>
                  <button type="button" onClick={addTestimonial} className="add-testimonial-btn">
                    <Plus size={16} /> Add Testimonial
                  </button>
                </div>
                
                <div className="testimonials-list">
                  {newCourse.testimonials.map((testimonial, index) => (
                    <div key={index} className="testimonial-item">
                      <div className="testimonial-header">
                        <span className="student-name">{testimonial.name}</span>
                        <div className="rating">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < testimonial.rating ? 'filled' : ''} />
                          ))}
                        </div>
                        <button type="button" onClick={() => removeTestimonial(index)} className="remove-btn">
                          <X size={14} />
                        </button>
                      </div>
                      <p className="testimonial-text">{testimonial.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowCreateCourseModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreateCourse}
              >
                <Save size={16} />
                Create Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button 
                className="close-btn"
                onClick={() => setShowEditProfileModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editProfile.name}
                  onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editProfile.email}
                  onChange={(e) => setEditProfile({...editProfile, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Avatar URL</label>
                <input
                  type="url"
                  value={editProfile.avatar}
                  onChange={(e) => setEditProfile({...editProfile, avatar: e.target.value})}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowEditProfileModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditProfile}
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browse Courses Modal */}
      {showBrowseCoursesModal && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>Browse Available Courses</h3>
              <button 
                className="close-btn"
                onClick={() => setShowBrowseCoursesModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="search-section">
                <div className="search-bar">
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="courses-grid">
                {availableCourses
                  .filter(course => 
                    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    course.instructor?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    course.category.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(course => (
                    <div key={course._id} className="course-card">
                      <Link to={`/skill/${course._id}`} className="course-link">
                        <img src={course.image || 'https://via.placeholder.com/300x200?text=Course'} alt={course.title} />
                        <div className="course-info">
                          <h4>{course.title}</h4>
                          <p>By {course.instructor?.username || 'Unknown'}</p>
                          <div className="course-meta">
                            <span><Star size={14} /> {course.averageRating?.toFixed(1) || 0}</span>
                            <span><Users size={14} /> {course.enrolledStudents?.length || 0}</span>
                            <span><Clock size={14} /> {course.duration?.weeks || 0} weeks</span>
                          </div>
                          <div className="course-price">${course.price}</div>
                        </div>
                      </Link>
                      <button className="enroll-btn" onClick={() => handleEnrollCourse(course._id)}>Enroll Now</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
