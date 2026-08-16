/* ==========================================================================
   INTERACTIVE INVERTED PENDULUM PID CONTROL SIMULATOR
   Avionics Closed-Loop Control System Physics Engine
   ========================================================================== */

(function () {
  const canvas = document.getElementById('pidCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Simulator Physics State
  const state = {
    x: 0,              // Cart position (px relative to center)
    vx: 0,             // Cart velocity
    theta: 0.15,       // Pendulum angle in radians (0 = upright)
    omega: 0,          // Angular velocity (rad/s)
    
    // Physics constants
    cartMass: 1.2,     // kg
    poleMass: 0.25,    // kg
    poleLength: 120,   // px
    gravity: 9.81 * 80,// scaled gravity
    cartFriction: 0.94,
    rotFriction: 0.985,
    dt: 0.02,

    // PID Gains (Default tuned for stable equilibrium)
    Kp: 45.0,
    Ki: 0.8,
    Kd: 14.0,

    // PID Internal terms
    integral: 0,
    lastError: 0,
    controlEffort: 0,
    
    // Telemetry log for mini chart
    history: [],
    maxHistory: 80,
    settled: false,
    isRunning: true
  };

  // UI DOM Elements
  const kpSlider = document.getElementById('kpSlider');
  const kiSlider = document.getElementById('kiSlider');
  const kdSlider = document.getElementById('kdSlider');
  const kpVal = document.getElementById('kpVal');
  const kiVal = document.getElementById('kiVal');
  const kdVal = document.getElementById('kdVal');
  const simAngleEl = document.getElementById('simAngle');
  const simForceEl = document.getElementById('simForce');
  const simStatusEl = document.getElementById('simStatus');
  const btnDisturbLeft = document.getElementById('btnDisturbLeft');
  const btnDisturbRight = document.getElementById('btnDisturbRight');
  const btnResetSim = document.getElementById('btnResetSim');

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = Math.max(300, rect.height || 300);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Bind Slider Controls
  if (kpSlider) {
    kpSlider.addEventListener('input', (e) => {
      state.Kp = parseFloat(e.target.value);
      if (kpVal) kpVal.textContent = state.Kp.toFixed(1);
    });
  }
  if (kiSlider) {
    kiSlider.addEventListener('input', (e) => {
      state.Ki = parseFloat(e.target.value);
      if (kiVal) kiVal.textContent = state.Ki.toFixed(2);
    });
  }
  if (kdSlider) {
    kdSlider.addEventListener('input', (e) => {
      state.Kd = parseFloat(e.target.value);
      if (kdVal) kdVal.textContent = state.Kd.toFixed(1);
    });
  }

  // Disturbances
  if (btnDisturbLeft) {
    btnDisturbLeft.addEventListener('click', () => {
      state.omega -= 0.6;
      state.vx -= 40;
    });
  }
  if (btnDisturbRight) {
    btnDisturbRight.addEventListener('click', () => {
      state.omega += 0.6;
      state.vx += 40;
    });
  }
  if (btnResetSim) {
    btnResetSim.addEventListener('click', () => {
      state.x = 0;
      state.vx = 0;
      state.theta = (Math.random() - 0.5) * 0.3;
      state.omega = 0;
      state.integral = 0;
      state.lastError = 0;
      state.history = [];
    });
  }

  // Interactive Dragging on Canvas to displace pole
  let isDragging = false;
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    handlePointer(e);
  });
  window.addEventListener('mousemove', (e) => {
    if (isDragging) handlePointer(e);
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  canvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    if (e.touches[0]) handlePointer(e.touches[0]);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches[0]) handlePointer(e.touches[0]);
  }, { passive: true });
  window.addEventListener('touchend', () => { isDragging = false; });

  function handlePointer(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const centerX = canvas.width / 2 + state.x;
    const deltaX = mouseX - centerX;
    state.theta = Math.max(-1.1, Math.min(1.1, deltaX / 100));
    state.omega = 0;
  }

  // Physics Update Loop
  function updatePhysics() {
    const targetTheta = 0;
    const error = state.theta - targetTheta;

    // Integral term with anti-windup clamping
    state.integral += error * state.dt;
    state.integral = Math.max(-2, Math.min(2, state.integral));

    // Derivative term
    const derivative = (error - state.lastError) / state.dt;
    state.lastError = error;

    // Cart centering proportional term to keep robot on track
    const posCorrection = (state.x / 100) * 8.0;

    // PID Output -> Control Force applied to Cart
    let u = (state.Kp * error) + (state.Ki * state.integral) + (state.Kd * derivative) + posCorrection;
    
    // Clamping actuator torque limits
    u = Math.max(-180, Math.min(180, u));
    state.controlEffort = u;

    // Physics equations of motion
    const sinTheta = Math.sin(state.theta);
    const cosTheta = Math.cos(state.theta);

    // Angular acceleration (inverted pendulum dynamics)
    const angularAcc = (state.gravity * sinTheta - (u / state.cartMass) * cosTheta) / (state.poleLength * 0.7);
    state.omega += angularAcc * state.dt;
    state.omega *= state.rotFriction;
    state.theta += state.omega * state.dt;

    // Cart acceleration
    const cartAcc = (u / state.cartMass) - (state.poleMass * state.poleLength * angularAcc * cosTheta) / state.cartMass;
    state.vx += cartAcc * state.dt;
    state.vx *= state.cartFriction;
    state.x += state.vx * state.dt;

    // Boundaries of cart travel
    const limitX = canvas.width * 0.38;
    if (state.x > limitX) { state.x = limitX; state.vx *= -0.4; }
    if (state.x < -limitX) { state.x = -limitX; state.vx *= -0.4; }

    // Settled detection
    const isStable = Math.abs(state.theta) < 0.05 && Math.abs(state.omega) < 0.08;
    
    // Store history for waveform
    state.history.push(state.theta);
    if (state.history.length > state.maxHistory) state.history.shift();

    // Update Telemetry Displays
    if (simAngleEl) simAngleEl.textContent = `${(state.theta * 180 / Math.PI).toFixed(1)}°`;
    if (simForceEl) simForceEl.textContent = `${state.controlEffort.toFixed(0)} N`;
    if (simStatusEl) {
      if (Math.abs(state.theta) > 0.8) {
        simStatusEl.textContent = 'STATUS: UNSTABLE OVER-TILT';
        simStatusEl.style.color = '#ef4444';
      } else if (isStable) {
        simStatusEl.textContent = 'STATUS: PID STABILIZED (0.0° ERROR)';
        simStatusEl.style.color = '#10b981';
      } else {
        simStatusEl.textContent = 'STATUS: CORRECTING TRAJECTORY...';
        simStatusEl.style.color = '#38bdf8';
      }
    }
  }

  // Render Loop
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const W = canvas.width;
    const H = canvas.height;
    const groundY = H - 55;
    const cartX = W / 2 + state.x;

    // 1. Draw Technical Grid & Track
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Rail Track
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, groundY);
    ctx.lineTo(W - 30, groundY);
    ctx.stroke();

    // Track Ticks
    for (let tx = 60; tx < W - 30; tx += 60) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.moveTo(tx, groundY - 4);
      ctx.lineTo(tx, groundY + 4);
      ctx.stroke();
    }

    // 2. Draw Cart Base
    const cartW = 80;
    const cartH = 34;
    const cartY = groundY - cartH - 8;

    // Cart Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(cartX - cartW / 2 + 4, cartY + 6, cartW, cartH);

    // Cart Body
    const cartGrad = ctx.createLinearGradient(cartX - cartW / 2, cartY, cartX + cartW / 2, cartY + cartH);
    cartGrad.addColorStop(0, '#1e293b');
    cartGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = cartGrad;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(cartX - cartW / 2, cartY, cartW, cartH, 6);
    ctx.fill();
    ctx.stroke();

    // Cart Avionics Indicator LEDs
    ctx.fillStyle = Math.abs(state.theta) < 0.1 ? '#10b981' : '#f59e0b';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cartX - 24, cartY + cartH / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cart Wheels
    const wheelRadius = 7;
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;

    // Left Wheel
    ctx.beginPath();
    ctx.arc(cartX - 26, groundY - wheelRadius, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right Wheel
    ctx.beginPath();
    ctx.arc(cartX + 26, groundY - wheelRadius, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. Draw Inverted Pendulum Pole
    const pivotX = cartX;
    const pivotY = cartY + 4;
    const poleEndX = pivotX + Math.sin(state.theta) * state.poleLength;
    const poleEndY = pivotY - Math.cos(state.theta) * state.poleLength;

    // Pole Pivot Joint
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pole Stem
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(poleEndX, poleEndY);
    ctx.stroke();

    // Pole Tip Weight / Inertial Sensor
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(poleEndX, poleEndY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Target Upright Guideline (Dashed)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY - state.poleLength - 15);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Force Arrow Indicator (Visual Feedback of PID Effort)
    if (Math.abs(state.controlEffort) > 2) {
      const forceLength = (state.controlEffort / 180) * 50;
      ctx.strokeStyle = '#f59e0b';
      ctx.fillStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cartX, cartY + cartH / 2);
      ctx.lineTo(cartX + forceLength, cartY + cartH / 2);
      ctx.stroke();
      
      // Arrowhead
      const arrowHeadSize = 5;
      const dir = Math.sign(forceLength);
      ctx.beginPath();
      ctx.moveTo(cartX + forceLength, cartY + cartH / 2);
      ctx.lineTo(cartX + forceLength - dir * arrowHeadSize, cartY + cartH / 2 - 4);
      ctx.lineTo(cartX + forceLength - dir * arrowHeadSize, cartY + cartH / 2 + 4);
      ctx.closePath();
      ctx.fill();
    }

    // 5. Mini Real-Time Error Waveform Graph
    const graphW = 140;
    const graphH = 50;
    const graphX = W - graphW - 15;
    const graphY = 15;

    ctx.fillStyle = 'rgba(6, 11, 22, 0.75)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(graphX, graphY, graphW, graphH, 4);
    ctx.fill();
    ctx.stroke();

    // Graph Zero Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(graphX, graphY + graphH / 2);
    ctx.lineTo(graphX + graphW, graphY + graphH / 2);
    ctx.stroke();

    // Error Plot
    if (state.history.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < state.history.length; i++) {
        const px = graphX + (i / state.maxHistory) * graphW;
        const py = (graphY + graphH / 2) + state.history[i] * 35;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Graph Label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '9px monospace';
    ctx.fillText('θ ERROR(t)', graphX + 6, graphY + 12);
  }

  // Animation Loop
  function loop() {
    updatePhysics();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
