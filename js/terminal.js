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
  <span style="color: #a7f3d0;">skills</span>       - List technical skills, tools & CAD proficiencies
  <span style="color: #a7f3d0;">projects</span>     - Explore hardware, robotics & control systems projects
  <span style="color: #a7f3d0;">edu</span>          - View academic record (NUST Avionics 3.67 GPA)
  <span style="color: #a7f3d0;">exp</span>          - Work experience, freelancing & leadership
  <span style="color: #a7f3d0;">contact</span>      - Display email, phone and location
  <span style="color: #a7f3d0;">pid-sim</span>      - Jump to interactive PID Control Simulator
  <span style="color: #a7f3d0;">download-cv</span>  - Launch ATS-optimized Print/PDF CV mode
  <span style="color: #a7f3d0;">whoami</span>       - Engineer identity profile summary
  <span style="color: #a7f3d0;">clear</span>        - Clear terminal console window
`,

    whoami: () => `
<div style="color: #fff; font-weight: 700;">Abdul Muqtadir</div>
<div style="color: #38bdf8;">Avionics Engineer · Embedded Systems & Autonomous Robotics Specialist</div>
<div style="color: #cbd5e1; margin-top: 0.3rem;">
  Undergraduate at NUST (CGPA: 3.67/4.00). Specialist in C/C++, PID closed-loop control,
  DSP algorithms, PCB debugging, sensor fusion, and microcontrollers (ESP32, Arduino, ARM).
</div>
`,

    skills: () => `
<div style="color: #38bdf8; font-weight: 700;">TECHNICAL ARSENAL:</div>
  <span style="color: #f59e0b;">▸ Languages:</span>     C/C++, Python, MATLAB, G-Code, Embedded C, Bash
  <span style="color: #f59e0b;">▸ Hardware:</span>      ESP32, STM32, Arduino, IMU (MPU6050), BTS7960, Steppers
  <span style="color: #f59e0b;">▸ Simulation:</span>    Simulink, Proteus, LabVIEW, Tinkercad
  <span style="color: #f59e0b;">▸ CAD & Design:</span>  CATIA, AutoCAD, KiCAD/EasyEDA
  <span style="color: #f59e0b;">▸ Domains:</span>       PID Control Systems, DSP, Sensor Fusion, PCB Debugging
`,

    projects: () => `
<div style="color: #38bdf8; font-weight: 700;">ENGINEERING BUILDS:</div>
  <span style="color: #10b981;">[1] CNC 2D Plotter:</span> Custom handwriting machine (Arduino Uno + CNC Shield + GRBL)
  <span style="color: #10b981;">[2] Self-Balancing Robot:</span> Real-time PID inverted pendulum balance + IMU fusion
  <span style="color: #10b981;">[3] Autonomous Rover:</span> ESP32 competition rover with BTS7960 & 4S2P Li-ion pack
  <span style="color: #10b981;">[4] Motion Wheelchair:</span> MEMS head-motion tracking assistive tech controller
`,

    edu: () => `
<div style="color: #38bdf8; font-weight: 700;">ACADEMIC BACKGROUND:</div>
  <span style="color: #fff; font-weight: 600;">▸ B.Eng. Avionics Engineering</span> (2023 – 2027)
    National University of Sciences & Technology (NUST) | <span style="color: #f59e0b;">CGPA: 3.67 / 4.00</span>
  <span style="color: #fff; font-weight: 600;">▸ A-Levels</span> (2021 – 2023)
    The Universal Millennium College | <span style="color: #f59e0b;">3 A Grades (STEM)</span>
  <span style="color: #fff; font-weight: 600;">▸ O-Levels</span> (2008 – 2021)
    Bloomfield Hall School | <span style="color: #f59e0b;">1 A*, 6 As</span>
`,

    exp: () => `
<div style="color: #38bdf8; font-weight: 700;">EXPERIENCE & LEADERSHIP:</div>
  <span style="color: #38bdf8;">▸ Freelance Embedded Engineer</span> (Jul 2025 – Present)
    Hardware circuit design, firmware programming & consulting.
  <span style="color: #38bdf8;">▸ A-Level STEM Tutor (Math & Physics)</span> (Nov 2022 – Present)
    Mentoring students in advanced calculus, kinematics and mechanics.
  <span style="color: #38bdf8;">▸ Head of Avionics Club</span> (NUST)
    Organizing robotics workshops, hackathons and student R&D projects.
`,

    contact: () => `
<div style="color: #38bdf8; font-weight: 700;">COMMUNICATION CHANNELS:</div>
  <span style="color: #cbd5e1;">Email:</span>    <a href="mailto:Muqtadir0711@gmail.com" style="color:#38bdf8;">Muqtadir0711@gmail.com</a>
  <span style="color: #cbd5e1;">Phone:</span>    (+92) 333 454 7518
  <span style="color: #cbd5e1;">Location:</span> Gujranwala / Islamabad, Pakistan
`,

    'pid-sim': () => {
      const el = document.getElementById('sec-simulator');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return '<span style="color:#10b981;">Navigating to PID Control Lab...</span>';
    },

    'download-cv': () => {
      window.print();
      return '<span style="color:#10b981;">Triggered ATS Printable Resume View!</span>';
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
  printLine(`<span style="color:#38bdf8; font-weight:700;">Avionics Terminal Shell v2.4 initialized.</span> Type <span style="color:#10b981; font-weight:700;">'help'</span> to explore interactive commands.`);
})();
