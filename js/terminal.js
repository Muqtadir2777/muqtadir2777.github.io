/* ==========================================================================
   INTERACTIVE AVIONICS CLI TERMINAL
   Interactive Shell for Technical Recruiters & Engineers
   ========================================================================== */

(function () {
  const cliOutput = document.getElementById('cliOutput');
  const cliInput = document.getElementById('cliInput');
  if (!cliOutput || !cliInput) return;

  const commandHistory = [];
  let historyIdx = -1;

  const COMMANDS = {
    help: () => `
<div style="color: #38bdf8; font-weight: 700; margin-bottom: 0.3rem;">AVAILABLE SYSTEM COMMANDS:</div>
  <span style="color: #a7f3d0;">skills</span>       - List RF/Microwave, embedded, control & CAD proficiencies
  <span style="color: #a7f3d0;">projects</span>     - Explore antennas, SDR telemetry, robotics & control builds
  <span style="color: #a7f3d0;">edu</span>          - View academic record (NUST CAE, 3.73 CGPA, Sem 7)
  <span style="color: #a7f3d0;">exp</span>          - Work experience, consulting & leadership
  <span style="color: #a7f3d0;">contact</span>      - Display email, phone, location & profiles
  <span style="color: #a7f3d0;">pid-sim</span>      - Jump to interactive PID Control Simulator
  <span style="color: #a7f3d0;">download-cv</span>  - Launch ATS-optimized Print/PDF CV mode
  <span style="color: #a7f3d0;">whoami</span>       - Engineer identity profile summary
  <span style="color: #a7f3d0;">clear</span>        - Clear terminal console window
`,

    whoami: () => `
<div style="color: #fff; font-weight: 700;">Abdul Muqtadir</div>
<div style="color: #38bdf8;">Avionics, RF &amp; Embedded Systems Engineer · Semester 7</div>
<div style="color: #cbd5e1; margin-top: 0.3rem;">
  Undergraduate at <strong>NUST College of Aeronautical Engineering (CAE)</strong>.
  <strong>CGPA: 3.73 / 4.00</strong> (Semester 7).
  Specialist in RF/Microwave 3D EM modeling (CST Studio Suite, Keysight ADS),
  SDR Telemetry (ADALM-Pluto), Closed-Loop Digital PID/LQR Control, and Embedded Firmware (C/C++).
</div>
`,

    skills: () => `
<div style="color: #38bdf8; font-weight: 700;">TECHNICAL ARSENAL:</div>
  <span style="color: #f59e0b;">▸ RF &amp; Antennas:</span>   CST Studio Suite 2025, Keysight ADS, LineCalc, S-Parameters (S11, S21), Vivaldi / Conformal Arrays
  <span style="color: #f59e0b;">▸ Comms &amp; SDR:</span>     ADALM-Pluto SDR, 915 MHz FM Telemetry, Quadrature Demod, IIR Filters
  <span style="color: #f59e0b;">▸ Control Theory:</span>  Closed-Loop PID, State-Space, LQR, MATLAB/Simulink, IMU Sensor Fusion
  <span style="color: #f59e0b;">▸ Languages:</span>       C/C++, Embedded C, Python (NumPy, SciPy, Pandas), MATLAB, G-Code
  <span style="color: #f59e0b;">▸ Hardware:</span>        ESP32 Dual-Core, STM32, Arduino Uno, MPU6050, BTS7960 43A, A4988
  <span style="color: #f59e0b;">▸ CAD &amp; PCB:</span>       CATIA V5 (3D CAD), AutoCAD, KiCAD / EasyEDA
`,

    projects: () => `
<div style="color: #38bdf8; font-weight: 700;">FEATURED ENGINEERING BUILDS:</div>
  <span style="color: #10b981;">[1] SWB Vivaldi Antenna (3-18 GHz):</span> Conformal planar array for EW/UAV radar (CST Studio Suite)
  <span style="color: #10b981;">[2] HIL UAV Altitude Telemetry:</span> ADALM-Pluto SDR + Python plant + 915 MHz FM autopilot link
  <span style="color: #10b981;">[3] 2.4 GHz Chebyshev LPF:</span> 5th-order stepped-impedance microstrip filter (Keysight ADS & CST)
  <span style="color: #10b981;">[4] TWIP Inverted Pendulum:</span> LQR vs. Cascaded PID dynamical modeling & physical build
  <span style="color: #10b981;">[5] CNC 2D Handwriting Machine:</span> Arduino Uno + GRBL v1.1 + A4988 + NEMA 14
  <span style="color: #10b981;">[6] Autonomous Heavy Rover:</span> ESP32 + BTS7960 43A + 4S2P Li-Ion + WiFi Telemetry
`,

    edu: () => `
<div style="color: #38bdf8; font-weight: 700;">ACADEMIC RECORD:</div>
  <span style="color: #fff; font-weight: 600;">▸ B.Eng. Avionics Engineering</span> (2023 – 2027 · In Progress)
    College of Aeronautical Engineering (CAE), NUST | <span style="color: #f59e0b; font-weight:700;">CGPA: 3.73 / 4.00 (Sem 7)</span>
  <span style="color: #fff; font-weight: 600;">▸ Cambridge A-Levels</span> (2021 – 2023)
    The Universal Millennium College | <span style="color: #f59e0b;">3 A Grades (STEM)</span>
  <span style="color: #fff; font-weight: 600;">▸ Cambridge O-Levels</span> (2008 – 2021)
    Bloomfield Hall School | <span style="color: #f59e0b;">1 A*, 6 As</span>
`,

    exp: () => `
<div style="color: #38bdf8; font-weight: 700;">EXPERIENCE &amp; LEADERSHIP:</div>
  <span style="color: #38bdf8;">▸ Freelance Engineering Consultant</span> (Jul 2025 – Present)
    Hardware circuit design, firmware programming &amp; RF consulting.
  <span style="color: #38bdf8;">▸ Head of Avionics Club</span> (NUST CAE · 2024 – Present)
    Organizing robotics hackathons, SDR telemetry testbeds &amp; technical workshops.
  <span style="color: #38bdf8;">▸ A-Level STEM Tutor (Math &amp; Physics)</span> (Nov 2022 – Present)
    Mentoring students in advanced calculus, kinematics and mechanics.
`,

    contact: () => `
<div style="color: #38bdf8; font-weight: 700;">COMMUNICATION CHANNELS:</div>
  <span style="color: #cbd5e1;">Email:</span>    <a href="mailto:Muqtadir0711@gmail.com" style="color:#38bdf8;">Muqtadir0711@gmail.com</a>
  <span style="color: #cbd5e1;">Phone:</span>    (+92) 333 454 7518
  <span style="color: #cbd5e1;">Location:</span> Gujranwala / Risalpur, Pakistan
  <span style="color: #cbd5e1;">GitHub:</span>   <a href="https://github.com/muqtadir2777" target="_blank" style="color:#38bdf8;">github.com/muqtadir2777</a>
`,

    'pid-sim': () => {
      const el = document.getElementById('sec-simulator');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return '<span style="color:#10b981;">Navigating to PID Control Lab...</span>';
    },

    'download-cv': () => {
      window.print();
      return '<span style="color:#10b981;">Triggered ATS Printable Resume View! Check the resume/ folder for dedicated assets.</span>';
    },

    sudo: () => '<span style="color:#f59e0b;">[AUTH SUCCESS] User muqtadir granted avionics root permissions.</span>',

    matrix: () => '<span style="color:#10b981;">Wake up, Neo... The avionics matrix has you. Follow the white rabbit.</span>'
  };

  function printLine(html) {
    const div = document.createElement('div');
    div.className = 'cli-output-line';
    div.innerHTML = html;
    cliOutput.appendChild(div);
    cliOutput.scrollTop = cliOutput.scrollHeight;
  }

  function handleCommand(cmdRaw) {
    const cmd = cmdRaw.trim().toLowerCase();
    printLine(`<span style="color:#38bdf8; font-weight:700;">muqtadir@avionics-os:~$</span> <span style="color:#fff;">${escapeHtml(cmdRaw)}</span>`);

    if (!cmd) return;

    commandHistory.push(cmdRaw);
    historyIdx = commandHistory.length;

    if (cmd === 'clear' || cmd === 'cls') {
      cliOutput.innerHTML = '';
      return;
    }

    if (COMMANDS[cmd]) {
      const result = COMMANDS[cmd]();
      if (result) printLine(result);
    } else {
      printLine(`<span style="color:#ef4444;">Command not recognized: '${escapeHtml(cmd)}'. Type <span style="color:#38bdf8; cursor:pointer;" onclick="document.getElementById('cliInput').value='help'; document.getElementById('cliInput').focus();">'help'</span> for a list of available commands.</span>`);
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Keybindings (Enter, Arrow Up/Down for history)
  cliInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = cliInput.value;
      cliInput.value = '';
      handleCommand(val);
    } else if (e.key === 'ArrowUp') {
      if (historyIdx > 0) {
        historyIdx--;
        cliInput.value = commandHistory[historyIdx] || '';
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (historyIdx < commandHistory.length - 1) {
        historyIdx++;
        cliInput.value = commandHistory[historyIdx] || '';
      } else {
        historyIdx = commandHistory.length;
        cliInput.value = '';
      }
      e.preventDefault();
    }
  });

  // Wire shortcut buttons
  document.querySelectorAll('.cli-shortcut-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd) {
        cliInput.value = cmd;
        handleCommand(cmd);
      }
    });
  });

  // Initial welcome message
  printLine(`<span style="color:#38bdf8; font-weight:700;">Avionics Terminal Shell v2.7 initialized.</span> Type <span style="color:#10b981; font-weight:700;">'help'</span> to explore interactive commands.`);
})();
