import React, { useEffect, useRef } from 'react';
import Prism from '../components/Prism';
import TiltedCard from '../components/TiltedCard';
import { Code, Palette, Music, Star } from 'lucide-react';
import './Landingpage.css';

const LandingPage = () => {
  const statsRef = useRef(null);
  const exploreRef = useRef(null);

  useEffect(() => {
    const animateCounters = () => {
      const counters = document.querySelectorAll('.stat-number');
      
      counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target'));
        const increment = target / 100; // Animation duration control
        let current = 0;
        
        const updateCounter = () => {
          if (current < target) {
            current += increment;
            counter.textContent = Math.ceil(current);
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target;
          }
        };
        
        updateCounter();
      });
    };

    // Use Intersection Observer to trigger animation when stats section comes into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounters();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation for Explore title
  useEffect(() => {
    const exploreObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const title = entry.target.querySelector('h2');
            if (title) {
              title.classList.add('animate');
            }
            exploreObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (exploreRef.current) {
      exploreObserver.observe(exploreRef.current);
    }

    return () => exploreObserver.disconnect();
  }, []);

  return (
    <div className="landing-page">
      {/* First Section with Prism Background */}
      <section className="hero-section">
        <div className="prism-background">
          <Prism
            height={3.5}
            baseWidth={5.5}
            animationType="3drotate"
            glow={1.2}
            noise={0.3}
            transparent={true}
            scale={2.8}
            hueShift={0.1}
            colorFrequency={1.2}
            hoverStrength={1.5}
            inertia={0.08}
            bloom={1.1}
            suspendWhenOffscreen={true}
            timeScale={0.6}
          />
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Welcome to SkillSwap</h1>
            <p className="hero-subtitle">
              Connect, Learn, and Share Skills with a Global Community
            </p>
            <div className="hero-buttons">
              <button className="btn-primary">Start Learning</button>
              <button className="btn-secondary">Teach a Skill</button>
            </div>
          </div>
        </div>
      </section>

      {/* Regular sections without prism */}
      <section className="features-section" ref={exploreRef}>
        <div className="container">
          <h2 id='explore'>Explore</h2>
          <div className="features-grid">
            <TiltedCard
              imageSrc="https://i.ibb.co/xKm8PzGF/gradient-1.png"
              altText="Skill Marketplace"
              captionText="Discover and trade skills in our marketplace"
              containerHeight="350px"
              containerWidth="100%"
              imageHeight="300px"
              imageWidth="300px"
              scaleOnHover={1.05}
              rotateAmplitude={12}
              showMobileWarning={false}
              showTooltip={true}
              displayOverlayContent={true}
              overlayContent={
                <div className="card-content">
                  <h3 className="card-title">Skill Marketplace</h3>
                  <p className="card-description">Discover and trade skills in our marketplace</p>
                </div>
              }
            />
            <TiltedCard
              imageSrc="https://i.ibb.co/xKm8PzGF/gradient-1.png"
              altText="Leaderboard"
              captionText="Compete and climb the leaderboards"
              containerHeight="350px"
              containerWidth="100%"
              imageHeight="300px"
              imageWidth="300px"
              scaleOnHover={1.05}
              rotateAmplitude={12}
              showMobileWarning={false}
              showTooltip={true}
              displayOverlayContent={true}
              overlayContent={
                <div className="card-content">
                  <h3 className="card-title">Leaderboard</h3>
                  <p className="card-description">Compete and climb the leaderboards</p>
                </div>
              }
            />
            <TiltedCard
              imageSrc="https://i.ibb.co/xKm8PzGF/gradient-1.png"
              altText="Learning Paths"
              captionText="Structured learning experiences"
              containerHeight="350px"
              containerWidth="100%"
              imageHeight="300px"
              imageWidth="300px"
              scaleOnHover={1.05}
              rotateAmplitude={12}
              showMobileWarning={false}
              showTooltip={true}
              displayOverlayContent={true}
              overlayContent={
                <div className="card-content">
                  <h3 className="card-title">Learning Paths</h3>
                  <p className="card-description">Structured learning experiences</p>
                </div>
              }
            />
          </div>
          
          {/* Statistics Section */}
          <div className="stats-section" ref={statsRef}>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">
                  <Code size={32} />
                </div>
                <div className="stat-number" data-target="124">0</div>
                <div className="stat-label">Programming Skills</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">
                  <Palette size={32} />
                </div>
                <div className="stat-number" data-target="89">0</div>
                <div className="stat-label">Design Skills</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">
                  <Music size={32} />
                </div>
                <div className="stat-number" data-target="67">0</div>
                <div className="stat-label">Music Skills</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">
                  <Star size={32} />
                </div>
                <div className="stat-number" data-target="4.8">0</div>
                <div className="stat-label">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <h2>About SkillSwap</h2>
          <p>Join thousands of learners and teachers in our skill-sharing community.</p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
