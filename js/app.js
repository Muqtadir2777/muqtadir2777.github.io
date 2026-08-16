/* ==========================================================================
   ABDUL MUQTADIR - MAIN APPLICATION SCRIPT
   Interactive Features, Starfield, Flight HUD, Sound FX & Modal System
   ========================================================================== */

(function () {
  'use strict';

  // --- 1. WEB AUDIO API SYNTHESIZED SOUND EFFECTS ENGINE ---
  const SoundFX = {
    enabled: false,
    ctx: null,

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
    },

    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    },

    playChime() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.05, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.15);
      });
    }
  };

  // Sound Toggle Button
  const btnSoundToggle = document.getElementById('btnSoundToggle');
  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
      SoundFX.enabled = !SoundFX.enabled;
      btnSoundToggle.innerHTML = SoundFX.enabled
        ? '<i class="fas fa-volume-up" style="color:var(--accent-cyan);"></i>'
        : '<i class="fas fa-volume-mute"></i>';
      btnSoundToggle.title = SoundFX.enabled ? 'Mute Sound FX' : 'Enable Sound FX';
      showToast(SoundFX.enabled ? 'Avionics Audio Feedback Enabled 🔊' : 'Audio Feedback Muted 🔇');
      if (SoundFX.enabled) SoundFX.playChime();
    });
  }

  // Bind subtle click sounds to buttons and links
  document.addEventListener('click', (e) => {
    if (e.target.closest('button, a, .project-card, .skill-chip, .info-chip')) {
      SoundFX.playClick();
    }
  });

  // --- 2. CELESTIAL AVIONICS STARFIELD CANVAS ---
  (function initStarfield() {
    const canvas = document.getElementById('starCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    let stars = [];
    const numStars = 140;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      createStars();
    }

    function createStars() {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.5 + 0.3,
          speed: Math.random() * 0.3 + 0.1,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.3 ? 'rgba(160, 210, 255,' : 'rgba(255, 255, 255,'
        });
      }
    }

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 30;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 30;
    });

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const time = Date.now() * 0.001;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const alpha = 0.2 + 0.7 * (0.5 + 0.5 * Math.sin(time * s.speed * 2 + s.phase));
        
        ctx.beginPath();
        ctx.arc(s.x + mouseX * 0.2, s.y + mouseY * 0.2, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color + alpha + ')';
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
  })();

  // --- 3. FLIGHT TELEMETRY HUD / ARTIFICIAL HORIZON CANVAS ---
  (function initFlightHUD() {
    const canvas = document.getElementById('horizonCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let roll = 0;
    let pitch = 0;
    let targetRoll = 0;
    let targetPitch = 0;
    let heading = 142;

    const hudPitchEl = document.getElementById('hudPitch');
    const hudRollEl = document.getElementById('hudRoll');
    const hudHeadingEl = document.getElementById('hudHeading');

    // Make HUD react to mouse movement
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetRoll = nx * 22; // max 22 deg roll
      targetPitch = -ny * 18; // max 18 deg pitch
    });

    function drawHUD() {
      const W = canvas.width = canvas.parentElement.clientWidth;
      const H = canvas.height = canvas.parentElement.clientHeight;
      const cx = W / 2;
      const cy = H / 2;

      // Smooth interpolation (spring physics)
      roll += (targetRoll - roll) * 0.08;
      pitch += (targetPitch - pitch) * 0.08;
      heading = (142 + roll * 0.8 + 360) % 360;

      // Update HUD telemetry DOM numbers
      if (hudPitchEl) hudPitchEl.textContent = `${pitch >= 0 ? '+' : ''}${pitch.toFixed(1)}°`;
      if (hudRollEl) hudRollEl.textContent = `${roll >= 0 ? '+' : ''}${roll.toFixed(1)}°`;
      if (hudHeadingEl) hudHeadingEl.textContent = `${Math.round(heading).toString().padStart(3, '0')}°`;

      ctx.clearRect(0, 0, W, H);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((roll * Math.PI) / 180);

      // Pitch vertical displacement (2 px per degree)
      const pitchOffset = pitch * 2.2;

      // Sky Background (Top)
      ctx.fillStyle = '#081a33';
      ctx.fillRect(-W, -H * 2 + pitchOffset, W * 2, H * 2);

      // Ground Background (Bottom)
      ctx.fillStyle = '#1c130c';
      ctx.fillRect(-W, pitchOffset, W * 2, H * 2);

      // Horizon Line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-W, pitchOffset);
      ctx.lineTo(W, pitchOffset);
      ctx.stroke();

      // Pitch Ladder Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';

      const ladderSteps = [-20, -10, 10, 20];
      ladderSteps.forEach((deg) => {
        const ly = pitchOffset - deg * 2.2;
        const lineW = 32;
        ctx.beginPath();
        ctx.moveTo(-lineW, ly);
        ctx.lineTo(-10, ly);
        ctx.moveTo(10, ly);
        ctx.lineTo(lineW, ly);
        ctx.stroke();
        ctx.fillText(`${Math.abs(deg)}`, -lineW - 8, ly + 3);
        ctx.fillText(`${Math.abs(deg)}`, lineW + 8, ly + 3);
      });

      ctx.restore();

      // Fixed Aircraft Reticle / Crosshair in center
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Left Wing Bar
      ctx.moveTo(cx - 40, cy);
      ctx.lineTo(cx - 15, cy);
      ctx.lineTo(cx - 15, cy + 6);
      // Right Wing Bar
      ctx.moveTo(cx + 40, cy);
      ctx.lineTo(cx + 15, cy);
      ctx.lineTo(cx + 15, cy + 6);
      // Center Pip
      ctx.moveTo(cx - 3, cy);
      ctx.lineTo(cx + 3, cy);
      ctx.stroke();

      // Avionics Corner Crosshairs
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      const corner = 10;
      ctx.strokeRect(corner, corner, W - corner * 2, H - corner * 2);

      requestAnimationFrame(drawHUD);
    }

    drawHUD();
  })();

  // --- 4. TYPING EFFECT FOR HERO TITLES ---
  (function initTypingTitle() {
    const el = document.getElementById('typingRole');
    if (!el) return;

    const titles = [
      'Avionics Engineering Undergrad @ NUST',
      'Embedded Systems & Firmware Specialist',
      'PID & State-Space Control Systems Engineer',
      'Autonomous Robotics & Hardware Builder',
      'Digital Signal Processing Enthusiast'
    ];

    let titleIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function type() {
      const current = titles[titleIdx];
      if (isDeleting) {
        el.textContent = current.substring(0, charIdx - 1);
        charIdx--;
        typingSpeed = 35;
      } else {
        el.textContent = current.substring(0, charIdx + 1);
        charIdx++;
        typingSpeed = 75;
      }

      if (!isDeleting && charIdx === current.length) {
        typingSpeed = 2200; // Pause at end
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        titleIdx = (titleIdx + 1) % titles.length;
        typingSpeed = 400; // Pause before new word
      }

      setTimeout(type, typingSpeed);
    }

    setTimeout(type, 800);
  })();

  // --- 5. NUMERICAL COUNTERS ANIMATION ---
  (function initCounters() {
    function animateCount(el, target, decimals, duration) {
      const start = performance.now();
      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const val = target * easeOut;
        el.textContent = val.toFixed(decimals);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(decimals);
      }
      requestAnimationFrame(step);
    }

    let animated = false;
    const statsSection = document.getElementById('sec-stats');
    if (statsSection) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !animated) {
          animated = true;
          const cgpa = document.getElementById('countCgpa');
          const proj = document.getElementById('countProjects');
          const exp = document.getElementById('countExp');
          const sem = document.getElementById('countSem');

          if (cgpa) animateCount(cgpa, 3.67, 2, 1600);
          if (proj) animateCount(proj, 4, 0, 1200);
          if (exp) animateCount(exp, 3, 0, 1000);
          if (sem) animateCount(sem, 5, 0, 800);
        }
      }, { threshold: 0.25 });
      observer.observe(statsSection);
    }
  })();

  // --- 6. SCROLL SPY, REVEALS & NAVBAR BEHAVIOR ---
  (function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    const scrollBar = document.getElementById('scrollProgress');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
      const top = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (top / docHeight) * 100;
      if (scrollBar) scrollBar.style.width = `${scrollPercent}%`;

      if (navbar) {
        if (top > 40) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
      }

      // Active Section Highlighter
      let currentSec = '';
      sections.forEach((sec) => {
        const secTop = sec.offsetTop - 120;
        if (top >= secTop) currentSec = sec.getAttribute('id');
      });

      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSec}`) {
          link.classList.add('active');
        }
      });
    }, { passive: true });

    // Intersection Observer for Reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('vis');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
  })();

  // --- 7. MOBILE DRAWER NAVIGATION ---
  (function initMobileDrawer() {
    const openBtn = document.getElementById('mobileMenuBtn');
    const closeBtn = document.getElementById('mobileDrawerClose');
    const drawer = document.getElementById('mobileNavDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const drawerLinks = document.querySelectorAll('.mobile-drawer-links a');

    function toggleDrawer(open) {
      if (drawer && backdrop) {
        drawer.classList.toggle('open', open);
        backdrop.classList.toggle('active', open);
        document.body.style.overflow = open ? 'hidden' : '';
      }
    }

    if (openBtn) openBtn.addEventListener('click', () => toggleDrawer(true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleDrawer(false));
    if (backdrop) backdrop.addEventListener('click', () => toggleDrawer(false));

    drawerLinks.forEach((link) => {
      link.addEventListener('click', () => toggleDrawer(false));
    });
  })();

  // --- 8. PROJECT FILTERING & RICH MODAL DATA ---
  const PROJECT_DATA = {
    'cnc-plotter': {
      title: 'CNC 2D Plotter & Handwriting Machine',
      category: 'Embedded & Control Systems',
      icon: 'fa-pen-fancy',
      lead: 'High-precision dual-axis CNC machine designed and built from ground up to render vector graphics and automated calligraphy.',
      specs: [
        { label: 'Microcontroller', val: 'Arduino Uno (ATmega328P)' },
        { label: 'Firmware', val: 'GRBL v1.1 Custom Flashed' },
        { label: 'Actuators', val: '2x NEMA 14 Stepper Motors' },
        { label: 'Drivers', val: 'A4988 Microstepping Modules' },
        { label: 'Precision', val: '0.05 mm Resolution' },
        { label: 'CAD Design', val: 'CATIA & Tinkercad Custom Mounts' }
      ],
      details: `
        <p style="margin-bottom:1rem; color:#cbd5e1;">The CNC 2D Plotter is an electro-mechanical system engineered for sub-millimeter precision handwriting and vector plotting. It converts standard G-code trajectories streamed over UART into synchronized dual-phase stepper pulses.</p>
        <h4 style="color:#38bdf8; font-size:0.95rem; margin-bottom:0.5rem;">Key Engineering Highlights:</h4>
        <ul style="padding-left:1.2rem; color:#cbd5e1; line-height:1.7; margin-bottom:1.2rem;">
          <li>Designed mechanical gantry, timing belt tensioners, and pen-lift servo assembly in CAD.</li>
          <li>Calibrated step-per-millimeter ratios in GRBL firmware EEPROM for zero backlash.</li>
          <li>Integrated limit switches for automatic homing and soft coordinate bounding.</li>
          <li>Built electrical power distribution harness isolating 12V motor rails from 5V logic.</li>
        </ul>
      `
    },
    'self-balancer': {
      title: 'Self-Balancing Inverted Pendulum Robot',
      category: 'Robotics & Control Theory',
      icon: 'fa-balance-scale',
      lead: 'Two-wheeled dynamically stabilized robot utilizing closed-loop PID control and 6-DOF IMU sensor fusion.',
      specs: [
        { label: 'Control Loop', val: 'Digital PID (100 Hz)' },
        { label: 'Sensor Suite', val: 'MPU6050 6-Axis Gyro/Accel' },
        { label: 'Filtering', val: 'Complementary / Kalman Filter' },
        { label: 'Motors', val: 'Geared DC Motors with Optical Encoders' },
        { label: 'Firmware', val: 'C++ with Low-Level Interrupts' },
        { label: 'Platform', val: 'Microcontroller with PWM H-Bridge' }
      ],
      details: `
        <p style="margin-bottom:1rem; color:#cbd5e1;">Built on the fundamental principles of control theory and inverted pendulum physics, this robot achieves autonomous balance by continuously computing tilt error and commanding corrective counter-torque.</p>
        <h4 style="color:#38bdf8; font-size:0.95rem; margin-bottom:0.5rem;">Control System Architecture:</h4>
        <ul style="padding-left:1.2rem; color:#cbd5e1; line-height:1.7; margin-bottom:1.2rem;">
          <li>Filtered high-frequency accelerometer noise and low-frequency gyroscope drift via real-time complementary filtering.</li>
          <li>Engineered custom PID control loop with anti-windup clamping to eliminate overshoot during sudden impulse disturbances.</li>
          <li>Implemented encoder position feedback to maintain zero net linear drift on level surfaces.</li>
          <li>Interactive simulation available live on this website in the PID Lab section!</li>
        </ul>
      `
    },
    'motion-wheelchair': {
      title: 'Head-Motion Controlled Assistive Wheelchair',
      category: 'Assistive Tech & Embedded',
      icon: 'fa-wheelchair',
      lead: 'Hands-free assistive mobility system governed by head-tilt angles and real-time MEMS motion processing.',
      specs: [
        { label: 'Tracking Sensor', val: 'MEMS Tri-Axis Accelerometer' },
        { label: 'Processing', val: 'Embedded C Microcontroller' },
        { label: 'Actuation', val: 'Dual Heavy-Duty DC Gearmotors' },
        { label: 'Safety Cutoff', val: 'Emergency Threshold Deadzone' },
        { label: 'Interface', val: 'Ergonomic Headset Mount' }
      ],
      details: `
        <p style="margin-bottom:1rem; color:#cbd5e1;">Designed to restore independent mobility to individuals with severe motor impairment, this wheelchair converts subtle head movements into proportional directional drive commands.</p>
        <h4 style="color:#38bdf8; font-size:0.95rem; margin-bottom:0.5rem;">Key Innovations & Safety:</h4>
        <ul style="padding-left:1.2rem; color:#cbd5e1; line-height:1.7; margin-bottom:1.2rem;">
          <li>Configured angular deadband windows to prevent unintended drive trigger from natural head nods.</li>
          <li>Smooth S-curve acceleration filtering to avoid jerky transitions and patient discomfort.</li>
          <li>Emergency tilt cutoff and watchdog failsafes for complete user safety.</li>
        </ul>
      `
    },
    'autonomous-rover': {
      title: 'Autonomous Competition Heavy Rover',
      category: 'Autonomy & Power Electronics',
      icon: 'fa-robot',
      lead: 'Rugged competition rover engineered with ESP32 telemetry, BTS7960 high-power H-bridges, and custom 4S2P Li-ion pack.',
      specs: [
        { label: 'Compute Core', val: 'ESP32 Dual-Core 240MHz' },
        { label: 'Motor Drivers', val: 'Dual BTS7960 43A H-Bridges' },
        { label: 'Motors', val: 'High-Torque JGA-25-370 All-Metal Gear' },
        { label: 'Battery Pack', val: 'Custom 4S2P 16.8V Li-Ion 18650 Pack' },
        { label: 'Telemetry', val: 'WiFi / BLE UDP Real-Time Stream' },
        { label: 'Chassis', val: 'High-Impact Reinforced Alloy' }
      ],
      details: `
        <p style="margin-bottom:1rem; color:#cbd5e1;">A high-end autonomous rover engineered for endurance robotic challenges. Featuring heavy-duty power management and high-torque drivetrain designed for rugged terrain traversal.</p>
        <h4 style="color:#38bdf8; font-size:0.95rem; margin-bottom:0.5rem;">Power & Telemetry Engineering:</h4>
        <ul style="padding-left:1.2rem; color:#cbd5e1; line-height:1.7; margin-bottom:1.2rem;">
          <li>Built custom 4S2P Lithium-Ion battery module with active BMS protection circuits.</li>
          <li>Interfaced dual BTS7960 motor driver stages capable of handling 43A peak stall current.</li>
          <li>Streamed live onboard telemetry (battery voltage, motor current, RPM) over ESP32 WebSockets.</li>
        </ul>
      `
    }
  };

  // Modal Dialog Open/Close Logic
  const modalOverlay = document.getElementById('projectModalOverlay');
  const modalContainer = document.getElementById('projectModalContainer');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalTitle = document.getElementById('modalTitle');
  const modalCategory = document.getElementById('modalCategory');
  const modalLead = document.getElementById('modalLead');
  const modalSpecs = document.getElementById('modalSpecs');
  const modalDetails = document.getElementById('modalDetails');

  function openProjectModal(key) {
    const data = PROJECT_DATA[key];
    if (!data || !modalOverlay) return;

    if (modalTitle) modalTitle.textContent = data.title;
    if (modalCategory) modalCategory.textContent = data.category;
    if (modalLead) modalLead.textContent = data.lead;
    if (modalDetails) modalDetails.innerHTML = data.details;

    if (modalSpecs) {
      modalSpecs.innerHTML = data.specs
        .map((s) => `
          <div class="spec-item">
            <div class="spec-label">${s.label}</div>
            <div class="spec-value">${s.val}</div>
          </div>
        `).join('');
    }

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    SoundFX.playChime();
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Bind Project Cards Click to open deep dive
  document.querySelectorAll('.project-card[data-project]').forEach((card) => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-project');
      openProjectModal(key);
    });
  });

  // Project Category Filtering
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      projectCards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
          setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => { card.style.display = 'none'; }, 250);
        }
      });
    });
  });

  // --- 9. TOAST NOTIFICATIONS & QUICK CONTACT TOOLS ---
  window.showToast = function (msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle" style="color:var(--accent-cyan);"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    SoundFX.playChime();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  };

  // 1-Click Copy Email & Phone
  const copyEmailBtns = document.querySelectorAll('.copy-email-btn');
  copyEmailBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText('Muqtadir0711@gmail.com').then(() => {
        showToast('Email (Muqtadir0711@gmail.com) copied to clipboard!');
      });
    });
  });

  const copyPhoneBtns = document.querySelectorAll('.copy-phone-btn');
  copyPhoneBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText('+923334547518').then(() => {
        showToast('Phone number (+92 333 454 7518) copied!');
      });
    });
  });

  // Generate & Download vCard (.vcf) for Recruiters
  const downloadVCardBtn = document.getElementById('downloadVCardBtn');
  if (downloadVCardBtn) {
    downloadVCardBtn.addEventListener('click', () => {
      const vcardData = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Abdul Muqtadir',
        'N:Muqtadir;Abdul;;;',
        'TITLE:Avionics & Embedded Systems Engineer',
        'ORG:National University of Sciences & Technology (NUST)',
        'EMAIL;TYPE=INTERNET,HOME:Muqtadir0711@gmail.com',
        'TEL;TYPE=CELL:+923334547518',
        'ADR;TYPE=HOME:;;Gujranwala;Punjab;;Pakistan',
        'NOTE:Avionics Engineering Undergrad at NUST. Embedded Systems, PID Control, DSP, Robotics.',
        'END:VCARD'
      ].join('\r\n');

      const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Abdul_Muqtadir_Avionics.vcf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloaded contact card (Abdul_Muqtadir.vcf)!');
    });
  }

  // Print CV Trigger
  const printCVBtns = document.querySelectorAll('.print-cv-btn');
  printCVBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      window.print();
    });
  });

  // Contact Form Submission Handler
  const contactForm = document.getElementById('portfolioContactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName')?.value || 'Guest';
      showToast(`Thank you, ${name}! Your transmission has been received.`);
      contactForm.reset();
    });
  }

})();
