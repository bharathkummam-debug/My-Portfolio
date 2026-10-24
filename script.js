/* ==========================================================================
   BHARATH UI/UX DESIGNER PORTFOLIO - JAVASCRIPT LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Hero Typewriter Animation ("UI/UX Designer")
  const heroTypewriterEl = document.getElementById('heroTypewriter');
  if (heroTypewriterEl) {
    const textToType = "UI/UX Designer";
    const typeSpeed = 80;    // ~80ms per character typing
    const deleteSpeed = 45;  // 45ms per character deleting
    const pauseEnd = 2200;   // 2.2s pause when full text is typed
    const pauseStart = 600;  // 600ms pause after deleting before typing again

    let charIndex = 0;
    let isDeleting = false;

    function typeLoop() {
      if (!isDeleting) {
        heroTypewriterEl.textContent = textToType.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === textToType.length) {
          isDeleting = true;
          setTimeout(typeLoop, pauseEnd);
          return;
        }
        setTimeout(typeLoop, typeSpeed);

      } else {
        heroTypewriterEl.textContent = textToType.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          setTimeout(typeLoop, pauseStart);
          return;
        }
        setTimeout(typeLoop, deleteSpeed);
      }
    }

    setTimeout(typeLoop, 400);
  }

  // 0. Handle Video Playback & Sound Control
  const heroVideo = document.getElementById('heroVideo');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundLabel = document.getElementById('soundLabel');

  if (heroVideo) {
    // Attempt unmuted play first
    heroVideo.muted = false;

    const mutedMicSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
      <line x1="2" y1="2" x2="22" y2="22" stroke="#EF4444" stroke-width="2.5" />
    </svg>`;

    const unmutedMicSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>`;

    const updateSoundUI = () => {
      if (soundIcon && soundLabel) {
        if (heroVideo.muted) {
          soundIcon.innerHTML = mutedMicSvg;
          soundLabel.textContent = 'Muted';
        } else {
          soundIcon.innerHTML = unmutedMicSvg;
          soundLabel.textContent = 'Live Audio';
        }
      }
    };

    heroVideo.play().catch(() => {
      // Browser blocked unmuted autoplay -> start muted & unmute on first user click
      heroVideo.muted = true;
      updateSoundUI();
      heroVideo.play();

      const unmuteOnInteraction = () => {
        heroVideo.muted = false;
        updateSoundUI();
        document.removeEventListener('click', unmuteOnInteraction);
      };
      document.addEventListener('click', unmuteOnInteraction);
    });

    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        heroVideo.muted = !heroVideo.muted;
        if (!heroVideo.muted) {
          heroVideo.play();
        }
        updateSoundUI();
      });
    }
  }

  // 1. Header Sticky Effect on Scroll
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 2. Active Navigation Link on Scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const highlightNavOnScroll = () => {
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNavOnScroll);

  // 3. Mobile Navigation Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    // Close menu when clicking link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  // 4. Real-Time Production Contact Form Messaging & API Integration
  const contactForm = document.getElementById('contactForm');
  const toast = document.getElementById('toast');

  if (contactForm) {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const submitBtn = contactForm.querySelector('.form-submit');

    const originalBtnHtml = `Send Message <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;

    // Inline Error Helpers
    const clearFieldErrors = () => {
      contactForm.querySelectorAll('.form-control').forEach(input => {
        input.classList.remove('is-invalid');
      });
      contactForm.querySelectorAll('.field-error-msg').forEach(msg => msg.remove());
    };

    const showFieldError = (input, msgText) => {
      input.classList.add('is-invalid');
      let errSpan = input.parentNode.querySelector('.field-error-msg');
      if (!errSpan) {
        errSpan = document.createElement('span');
        errSpan.className = 'field-error-msg';
        input.parentNode.appendChild(errSpan);
      }
      errSpan.textContent = msgText;
    };

    // Keyboard shortcut: Shift+Enter = new line, Enter = submit
    if (messageInput) {
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          contactForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      });
    }

    // Input blur clear error
    [nameInput, emailInput, messageInput].forEach(input => {
      if (input) {
        input.addEventListener('input', () => {
          input.classList.remove('is-invalid');
          const errSpan = input.parentNode.querySelector('.field-error-msg');
          if (errSpan) errSpan.remove();
        });
      }
    });

    // Form Submission Handler
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFieldErrors();

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      // Client-Side Validation
      let hasError = false;

      if (!name || name.length < 2) {
        showFieldError(nameInput, 'Name must be at least 2 characters long.');
        hasError = true;
      } else if (name.length > 100) {
        showFieldError(nameInput, 'Name cannot exceed 100 characters.');
        hasError = true;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showFieldError(emailInput, 'Please enter a valid email address.');
        hasError = true;
      }

      if (!message || message.length < 10) {
        showFieldError(messageInput, 'Message must be at least 10 characters long.');
        hasError = true;
      } else if (message.length > 3000) {
        showFieldError(messageInput, 'Message cannot exceed 3000 characters.');
        hasError = true;
      }

      if (hasError) return;

      // Submitting State
      submitBtn.disabled = true;
      submitBtn.classList.remove('submit-success', 'submit-error');
      submitBtn.innerHTML = `<span class="btn-spinner"></span> Sending...`;

      // Determine API Endpoint (supports standalone port 5000 or relative endpoint)
      const apiEndpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api/contact'
        : '/api/contact';

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, message }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Success State
          submitBtn.classList.add('submit-success');
          submitBtn.innerHTML = `Message Sent ✓`;
          contactForm.reset();

          // Show Toast Notification
          if (toast) {
            const toastSpan = toast.querySelector('span');
            if (toastSpan) toastSpan.textContent = 'Thanks! Your message has been sent successfully.';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 4500);
          }

          // Reset button to normal after 3.5s
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.classList.remove('submit-success');
            submitBtn.innerHTML = originalBtnHtml;
          }, 3500);

        } else {
          // Server Validation Error or Failure
          if (result.details) {
            Object.keys(result.details).forEach(field => {
              const inputEl = document.getElementById(field);
              if (inputEl) showFieldError(inputEl, result.details[field]);
            });
          }

          throw new Error(result.error || 'Something went wrong. Please try again.');
        }

      } catch (err) {
        console.error('Contact Form Error:', err.message);

        // Error State (Retain values!)
        submitBtn.disabled = false;
        submitBtn.classList.add('submit-error');
        submitBtn.innerHTML = `Try Again`;

        if (toast) {
          const toastSpan = toast.querySelector('span');
          if (toastSpan) toastSpan.textContent = err.message || 'Something went wrong. Please try again.';
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 4500);
        }

        setTimeout(() => {
          submitBtn.classList.remove('submit-error');
          submitBtn.innerHTML = originalBtnHtml;
        }, 3500);
      }
    });
  }

  // 5. Download CV Resume Trigger
  const downloadCvBtn = document.getElementById('downloadCvBtn');
  if (downloadCvBtn) {
    downloadCvBtn.addEventListener('click', () => {
      if (toast) {
        const toastSpan = toast.querySelector('span');
        const originalMsg = toastSpan ? toastSpan.textContent : '';
        if (toastSpan) toastSpan.textContent = 'Bharath Resume downloaded successfully!';
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
          if (toastSpan) toastSpan.textContent = originalMsg;
        }, 4000);
      }
    });
  }

  // 6. Project Filter Functionality, Slider Navigation & Case Study Modal
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const prevBtn = document.getElementById('projectsPrevBtn');
  const nextBtn = document.getElementById('projectsNextBtn');
  const dotsContainer = document.getElementById('projectsDots');

  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        projectCards.forEach(card => {
          const categories = card.getAttribute('data-category') || '';
          if (filterValue === 'all' || categories.includes(filterValue)) {
            card.style.display = 'flex';
            card.style.opacity = '1';
          } else {
            card.style.display = 'none';
            card.style.opacity = '0';
          }
        });
      });
    });
  }

  // Slider Dots & Arrow Navigation Interactivity
  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll('.fw-dot');
    let activeDotIndex = 0;

    const updateDots = (index) => {
      dots.forEach((dot, i) => {
        if (i === index) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });

      if (projectCards[index]) {
        projectCards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        projectCards[index].style.transform = 'translateY(-10px)';
        setTimeout(() => {
          projectCards[index].style.transform = '';
        }, 600);
      }
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        activeDotIndex = (activeDotIndex - 1 + dots.length) % dots.length;
        updateDots(activeDotIndex);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        activeDotIndex = (activeDotIndex + 1) % dots.length;
        updateDots(activeDotIndex);
      });
    }

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        activeDotIndex = index;
        updateDots(activeDotIndex);
      });
    });
  }

  // --- Project Case Study Modal Data & Interactive Handlers ---
  const projectDetailsData = {
    vr: {
      title: "Virtual Reality Spatial Experience",
      subtitle: "Next-Gen Spatial Computing & WebXR Product Landing Page",
      category: "UI/UX Design • WebXR",
      image: "assets/project_vr_experience.jpg",
      fullImage: "assets/Plugin.png",
      overview: "An award-standard landing page concept engineered for an ultra-premium spatial computing headset. The interface combines hyper-minimalist cyber typography, sleek 3D asset integration, and intuitive spatial computing UI cues to deliver an immersive hardware showcase.",
      highlights: [
        { title: "3D Product Staging", desc: "Interactive WebXR presentation with high-resolution humanoid render and 360-degree spatial hardware inspection." },
        { title: "Ergonomic UI Flow", desc: "Clear separation between system navigation, sensory specs, and direct-to-consumer purchase paths." },
        { title: "Futuristic OLED Aesthetic", desc: "Deep blacks paired with precision luminescent accents to simulate true spatial immersion." }
      ],
      meta: {
        client: "Spatial Hardware Concept",
        role: "Lead UI/UX Designer & 3D Web Stylist",
        deliverables: "High-Fidelity UI, WebXR Spec, Design System",
        tools: "Figma, Blender 3D, Webflow, WebGL"
      }
    },
    furniture: {
      title: "Luxury Furniture Living Architecture",
      subtitle: "Architectural Interior Commerce & Spatial Room Experience",
      category: "Web Design • E-Commerce UI",
      image: "assets/project_luxury_furniture.jpg",
      fullImage: "assets/file cover - 6.png",
      overview: "An editorial, high-end interior platform crafted for bespoke luxury furniture studios. The interface empowers discerning homeowners and interior architects to explore furniture pieces directly within spatial lifestyle settings, backed by interactive material hotspot annotations and proof-of-craftsmanship metric storytelling.",
      highlights: [
        { title: "Interactive Spec Hotspots", desc: "Precision interactive callouts highlighting cotton fabric breathability, balanced lumbar support, and solid structural integrity." },
        { title: "Spatial Living Room Architecture", desc: "Harmonious composition connecting living room and dining room spaces in a seamless, fluid layout." },
        { title: "Trust & Conversion Metrics", desc: "Prominent bottom metric bar showcasing 18K+ loyal clients, 700+ manufactured designs, and a 95% repeat purchase rate." }
      ],
      meta: {
        client: "Bespoke Interior Studio",
        role: "Product Designer & Creative Director",
        deliverables: "Design System, Interactive Hotspots, E-Commerce UI",
        tools: "Figma, Design Tokens, Spatial UX, Typography"
      }
    },
    apex: {
      title: "Apex Vault Financial Analytics",
      subtitle: "Real-time Multi-Asset Portfolio & Crypto Intelligence Dashboard",
      category: "SaaS Dashboard • FinTech",
      image: "assets/project_apex_vault.jpg",
      fullImage: "assets/project_apex_vault.jpg",
      overview: "A comprehensive FinTech dashboard platform designed to simplify complex algorithmic trading, multi-currency crypto tracking, and wealth management into actionable, high-clarity visualizations.",
      highlights: [
        { title: "High-Density Visual Analytics", desc: "Real-time responsive performance charts, asset allocation donut graphs, and live market volatility trackers." },
        { title: "Institutional-Grade UX", desc: "Rapid keyboard shortcut navigation, instant asset swaps, and multi-tier security authorization." }
      ],
      meta: {
        client: "Apex FinTech Labs",
        role: "UI/UX & Data Visualization Designer",
        deliverables: "Dashboard Architecture, Design System, Charting Specs",
        tools: "Figma, D3.js, Chart.js, React UI"
      }
    },
    luxe: {
      title: "Luxe Store Mobile App",
      subtitle: "Luxury Fashion & Curated Accessories Mobile Application",
      category: "Mobile App UI • iOS & Android",
      image: "assets/project_luxe_store.jpg",
      fullImage: "assets/project_luxe_store.jpg",
      overview: "A sleek mobile commerce application built for luxury retail. Designed with one-hand ergonomics, tactile gesture-based shopping, and personalized AI styling recommendations.",
      highlights: [
        { title: "Fluid Gesture Navigation", desc: "Seamless swipe-to-preview, tactile haptic cues, and instant bag drawer interactions." },
        { title: "One-Tap Frictionless Checkout", desc: "Integrated Apple Pay and biometrics for zero-friction luxury purchasing." }
      ],
      meta: {
        client: "Luxe Boutique Group",
        role: "Lead Mobile UX Designer",
        deliverables: "iOS & Android App UI, Interactive Prototypes",
        tools: "Figma, Principle, Mobile Design System"
      }
    }
  };

  const projectModal = document.getElementById('projectModal');
  const projectModalContent = document.getElementById('projectModalContent');
  const projectModalClose = document.getElementById('projectModalClose');
  const projectModalBackdrop = document.getElementById('projectModalBackdrop');

  function openProjectModal(projectId) {
    const data = projectDetailsData[projectId];
    if (!data || !projectModal || !projectModalContent) return;

    projectModalContent.innerHTML = `
      <div class="project-modal-image-wrap">
        <img src="${data.image}" alt="${data.title}">
      </div>
      <div class="project-modal-content-inner">
        <div class="project-modal-header-meta">
          <span class="project-modal-badge">${data.category}</span>
          <a href="${data.fullImage}" target="_blank" rel="noopener noreferrer" class="project-modal-view-full">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            View Full High-Res Design
          </a>
        </div>
        <h3 class="project-modal-title">${data.title}</h3>
        <p class="project-modal-subtitle">${data.subtitle}</p>

        <div class="project-modal-grid">
          <div class="project-modal-main">
            <h4>Case Study Overview</h4>
            <p class="project-modal-overview-text">${data.overview}</p>

            <h4>Key Highlights &amp; Innovations</h4>
            <div class="project-modal-highlights">
              ${data.highlights.map(item => `
                <div class="project-modal-highlight-item">
                  <span class="project-modal-highlight-dot"></span>
                  <p><strong>${item.title}:</strong> ${item.desc}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="project-modal-side">
            <h4>Project Specs</h4>
            <div class="project-modal-meta-list">
              <div class="project-modal-meta-row">
                <span class="project-modal-meta-label">Client / Domain</span>
                <span class="project-modal-meta-val">${data.meta.client}</span>
              </div>
              <div class="project-modal-meta-row">
                <span class="project-modal-meta-label">My Role</span>
                <span class="project-modal-meta-val">${data.meta.role}</span>
              </div>
              <div class="project-modal-meta-row">
                <span class="project-modal-meta-label">Key Deliverables</span>
                <span class="project-modal-meta-val">${data.meta.deliverables}</span>
              </div>
              <div class="project-modal-meta-row">
                <span class="project-modal-meta-label">Tools &amp; Stack</span>
                <span class="project-modal-meta-val">${data.meta.tools}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="project-modal-action-bar">
          <a href="#contact" class="project-modal-cta-btn" id="modalContactBtn">
            <span>Discuss This Project</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
          <button type="button" class="project-modal-view-full" id="modalCloseActionBtn" style="background:none;border:none;cursor:pointer;">
            Close Preview
          </button>
        </div>
      </div>
    `;

    projectModal.classList.add('active');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const modalContactBtn = document.getElementById('modalContactBtn');
    if (modalContactBtn) {
      modalContactBtn.addEventListener('click', () => {
        closeProjectModal();
      });
    }
    const modalCloseActionBtn = document.getElementById('modalCloseActionBtn');
    if (modalCloseActionBtn) {
      modalCloseActionBtn.addEventListener('click', () => {
        closeProjectModal();
      });
    }
  }

  function closeProjectModal() {
    if (!projectModal) return;
    projectModal.classList.remove('active');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (projectModalClose) {
    projectModalClose.addEventListener('click', closeProjectModal);
  }
  if (projectModalBackdrop) {
    projectModalBackdrop.addEventListener('click', closeProjectModal);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModal && projectModal.classList.contains('active')) {
      closeProjectModal();
    }
  });

  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const proj = btn.getAttribute('data-open-modal');
      openProjectModal(proj);
    });
  });

  document.querySelectorAll('[data-project-trigger]').forEach(visual => {
    visual.addEventListener('click', () => {
      const proj = visual.getAttribute('data-project-trigger');
      openProjectModal(proj);
    });
  });

  // 7. Interactive 3D Tilt & Drag-and-Hold for Modern Designer ID Card
  const idBadgeCard = document.querySelector('.id-card-landscape') || document.querySelector('.id-badge-card');

  if (idBadgeCard) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;

    // --- 3D Tilt on Mouse Move (Hover state) ---
    const handleTilt = (e) => {
      if (isDragging) return;

      const rect = idBadgeCard.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const mouseX = clientX - cardCenterX;
      const mouseY = clientY - cardCenterY;

      // Calculate subtle tilt toward cursor (max +-10 deg)
      const rotateX = ((-mouseY / (rect.height / 2)) * 10).toFixed(2);
      const rotateY = ((mouseX / (rect.width / 2)) * 10).toFixed(2);

      idBadgeCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    };

    // --- Reset Card Position on Mouse Leave ---
    const resetTilt = () => {
      if (isDragging) return;
      idBadgeCard.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0) scale(1)`;
    };

    // --- Drag Start (MouseDown / TouchStart) ---
    const startDrag = (e) => {
      if (e.button && e.button !== 0) return;

      isDragging = true;
      idBadgeCard.classList.add('is-dragging');

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      startX = clientX - currentX;
      startY = clientY - currentY;

      if (e.cancelable) e.preventDefault();
    };

    // --- Dragging (MouseMove / TouchMove Window Event) ---
    const doDrag = (e) => {
      if (!isDragging) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      currentX = clientX - startX;
      currentY = clientY - startY;

      // Calculate dynamic rotation based on drag movement velocity/direction
      const dragRotation = (currentX * 0.05).toFixed(2);
      const pitchRotation = Math.min(Math.max((-currentY * 0.06), -12), 12).toFixed(2);

      // Lift card slightly in 3D space with stronger shadow
      idBadgeCard.style.transform = `perspective(1000px) translate3d(${currentX}px, ${currentY}px, 40px) rotate(${dragRotation}deg) rotateX(${pitchRotation}deg) scale(1.04)`;

      if (e.cancelable) e.preventDefault();
    };

    // --- Drag Release (MouseUp / TouchEnd Window Event) ---
    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      idBadgeCard.classList.remove('is-dragging');

      currentX = 0;
      currentY = 0;

      // Return card to original resting position & rotation
      idBadgeCard.style.transform = `perspective(1000px) rotate(0deg) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0) scale(1)`;
    };

    // Event Listeners
    idBadgeCard.addEventListener('mousemove', handleTilt);
    idBadgeCard.addEventListener('mouseleave', resetTilt);
    idBadgeCard.addEventListener('mousedown', startDrag);
    idBadgeCard.addEventListener('touchstart', startDrag, { passive: false });

    window.addEventListener('mousemove', doDrag, { passive: false });
    window.addEventListener('touchmove', doDrag, { passive: false });
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
  }

});


