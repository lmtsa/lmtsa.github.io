/* LM-TSA — "Find Your Event" quiz
   Answers build an interest profile across ~25 skill areas. Every high school
   event is scored on how well its skills match that profile (cosine similarity),
   then adjusted for format fit: team size, public speaking, onsite challenges,
   qualifying tests, and prep time. Event data: tsaweb.org high school competition
   guide + eligibility chart, and the PA-TSA PA-only event rules. */
(function () {
  'use strict';

  // ---------- Skill areas ----------
  const REASONS = {
    code: 'You enjoy coding and building software',
    puzzle: 'You like cracking puzzles and logic problems',
    data: 'You like finding patterns in data',
    robot: 'You are into robotics, electronics, and making machines move',
    build: 'You like building things with your hands',
    eng: 'You think like an engineer',
    cad: 'You are into 3D modeling and CAD',
    vehicle: 'You are into cars, racing, and vehicles',
    flight: 'You are fascinated by flight',
    arch: 'You are drawn to architecture and designing spaces',
    graphic: 'You have an eye for visual design',
    video: 'You like filming and editing video',
    photo: 'You love photography',
    audio: 'You like recording and producing audio',
    music: 'You make music',
    fashion: 'You are into fashion and making things to wear',
    games: 'You love games and how they are designed',
    write: 'You are a strong writer and storyteller',
    research: 'You like digging deep into research',
    speak: 'You enjoy speaking and making your case',
    teach: 'You like teaching and explaining things',
    civic: 'You are interested in leadership and how organizations run',
    trivia: 'You love trivia and knowing a little about everything',
    sci: 'You are into science',
    business: 'You have a head for marketing and business'
  };

  const ARCHETYPES = [
    { name: 'The Builder', short: 'Builder', traits: ['build', 'robot', 'eng', 'vehicle', 'flight'],
      blurb: 'You learn by making. Machines, models, and vehicles you can test, break, and improve are where you shine.' },
    { name: 'The Coder', short: 'Coder', traits: ['code', 'puzzle', 'data', 'games'],
      blurb: 'You like logic and systems, and nothing beats watching a problem get solved by something you wrote.' },
    { name: 'The Designer', short: 'Designer', traits: ['graphic', 'arch', 'cad', 'fashion', 'business'],
      blurb: 'You care about how things look and how they work, from a logo to a garment to an entire building.' },
    { name: 'The Storyteller', short: 'Storyteller', traits: ['video', 'photo', 'audio', 'music', 'write'],
      blurb: 'You want people to feel something, and you use film, sound, photos, and words to make it happen.' },
    { name: 'The Speaker', short: 'Speaker', traits: ['speak', 'civic', 'teach', 'trivia'],
      blurb: 'You think on your feet, you can hold a room, and you are at your best in front of an audience.' },
    { name: 'The Scientist', short: 'Scientist', traits: ['sci', 'research'],
      blurb: 'You are curious about how the world works and you like backing up ideas with real evidence.' }
  ];

  // ---------- Events ----------
  // fmt: 'solo' | 'team' | 'either' (individual entries permitted)
  // sz: team size range; f: [talk 0-3, onsite 0-3, qualifying test 0/1, prep load 1-3]
  function E(name, cat, fmt, size, sz, t, f, pa) {
    return { name: name, cat: cat, fmt: fmt, size: size, sz: sz, t: t,
      talk: f[0], onsite: f[1], test: f[2], load: f[3], pa: !!pa };
  }
  const ARTS = 'STEM & the Arts', ARCH = 'Architecture & Construction', COMM = 'Communications',
    RES = 'Technology & Research', LEAD = 'Leadership', MFG = 'Manufacturing & Transportation',
    GEN = 'STEM General', CS = 'Computer Science', PA = 'Pennsylvania Only';

  const EVENTS = [
    E('Animatronics', ARTS, 'team', 'Team of 2–3', [2, 3], { robot: 3, build: 2, graphic: 1, eng: 1 }, [1, 0, 0, 3]),
    E('Architectural Design', ARCH, 'either', 'Team of 2–4 or individual', [2, 4], { arch: 3, cad: 2, build: 1, graphic: 1 }, [2, 0, 0, 3]),
    E('Artificial Intelligence', CS, 'team', 'Team of 2', [2, 2], { code: 3, puzzle: 2, data: 1 }, [1, 2, 1, 1]),
    E('Audio Podcasting', COMM, 'either', 'Team or individual', [2, 6], { audio: 3, write: 2, speak: 1 }, [1, 0, 0, 2]),
    E('Automated Manufacturing Systems', RES, 'team', 'Team of 2–3', [2, 3], { robot: 3, build: 2, eng: 2, code: 1 }, [1, 0, 0, 3]),
    E('Biotechnology Design', RES, 'team', 'Team', [2, 6], { sci: 3, research: 2, write: 1 }, [2, 0, 0, 2]),
    E('Board Game Design', ARTS, 'team', 'Team of 2–4', [2, 4], { games: 3, graphic: 2, build: 1, write: 1 }, [1, 0, 0, 2]),
    E('Chapter Team', LEAD, 'team', 'Team of 6', [6, 6], { civic: 3, speak: 2, trivia: 1 }, [2, 1, 1, 1]),
    E('Children’s Stories', COMM, 'either', 'Team or individual', [2, 6], { write: 3, graphic: 3, teach: 1 }, [2, 0, 0, 2]),
    E('Computer-Aided Design (CAD), Architecture', ARCH, 'solo', 'Individual', null, { cad: 3, arch: 2 }, [0, 2, 0, 1]),
    E('Computer-Aided Design (CAD), Engineering', ARCH, 'solo', 'Individual', null, { cad: 3, eng: 2 }, [0, 2, 0, 1]),
    E('Cybersecurity', CS, 'team', 'Team of 2–4', [2, 4], { puzzle: 3, code: 2 }, [0, 3, 0, 1]),
    E('Data Science and Analytics', CS, 'either', 'Team of 2 or individual', [2, 2], { data: 3, research: 2, code: 1, graphic: 1 }, [1, 1, 0, 2]),
    E('Debating Technological Issues', COMM, 'team', 'Team of 2', [2, 2], { speak: 3, research: 2, write: 1 }, [3, 1, 0, 2]),
    E('Digital Video Production', ARTS, 'either', 'Team or individual', [2, 6], { video: 3, write: 1 }, [1, 0, 0, 2]),
    E('Dragster Design', MFG, 'solo', 'Individual', null, { vehicle: 3, build: 2, cad: 1 }, [1, 0, 0, 2]),
    E('Drone Challenge (UAV)', MFG, 'team', 'Team of 2–6', [2, 6], { flight: 3, robot: 2, build: 2, code: 1 }, [1, 1, 0, 3]),
    E('Engineering Design', GEN, 'team', 'Team of 2–4', [2, 4], { eng: 3, research: 2, build: 1, sci: 1 }, [2, 0, 0, 3]),
    E('Extemporaneous Speech', LEAD, 'solo', 'Individual', null, { speak: 3, trivia: 1 }, [3, 3, 0, 1]),
    E('Fashion Design and Technology', ARTS, 'team', 'Team of 2–4', [2, 4], { fashion: 3, graphic: 1, build: 1 }, [2, 0, 0, 3]),
    E('Flight Endurance', MFG, 'solo', 'Individual', null, { flight: 3, build: 2, eng: 1 }, [0, 1, 0, 2]),
    E('Forensic Science', RES, 'team', 'Team of 2', [2, 2], { sci: 3, puzzle: 2 }, [0, 2, 1, 1]),
    E('Future Technology Teacher', LEAD, 'solo', 'Individual', null, { teach: 3, speak: 2, video: 1, research: 1 }, [2, 0, 0, 2]),
    E('Hybrid Racer XL', MFG, 'team', 'Team of 2–4', [2, 4], { vehicle: 3, build: 2, robot: 1, eng: 1 }, [1, 1, 0, 3]),
    E('Interior Design', ARCH, 'either', 'Team of 2 or individual', [2, 2], { arch: 3, graphic: 2 }, [2, 0, 0, 2]),
    E('Manufacturing Prototype', MFG, 'team', 'Team', [2, 6], { build: 3, cad: 2, business: 2, eng: 1 }, [2, 0, 0, 3]),
    E('Music Production', ARTS, 'either', 'Team or individual', [2, 6], { music: 3, audio: 2 }, [1, 0, 0, 2]),
    E('On Demand Video', ARTS, 'team', 'Team', [2, 6], { video: 3, write: 1 }, [0, 3, 0, 1]),
    E('Photographic Technology', ARTS, 'solo', 'Individual', null, { photo: 3, graphic: 1 }, [1, 2, 0, 2]),
    E('Prepared Presentation', LEAD, 'solo', 'Individual', null, { speak: 3, write: 1, research: 1 }, [3, 0, 0, 1]),
    E('Promotional Design', COMM, 'solo', 'Individual', null, { graphic: 3, business: 2 }, [1, 1, 0, 2]),
    E('Robotics', MFG, 'team', 'Team of 2–6', [2, 6], { robot: 3, code: 2, build: 2, eng: 1 }, [1, 1, 0, 3]),
    E('Software Development', CS, 'team', 'Team', [2, 6], { code: 3, eng: 1, business: 1 }, [2, 0, 0, 3]),
    E('STEM Mass Media', COMM, 'team', 'Team of 2–3', [2, 3], { write: 3, video: 2, speak: 1, research: 1 }, [1, 0, 0, 2]),
    E('Structural Design and Engineering', ARCH, 'team', 'Team of 2', [2, 2], { eng: 3, build: 2, arch: 1 }, [0, 0, 0, 2]),
    E('Technology Bowl', LEAD, 'team', 'Team of 3', [3, 3], { trivia: 3, puzzle: 1 }, [0, 2, 1, 1]),
    E('Technology Problem Solving', GEN, 'team', 'Team of 2', [2, 2], { build: 3, puzzle: 2, eng: 2 }, [0, 3, 0, 1]),
    E('Transportation Modeling', MFG, 'solo', 'Individual', null, { vehicle: 3, build: 2, cad: 1, graphic: 1 }, [1, 0, 0, 2]),
    E('Video Game Design', GEN, 'team', 'Team', [2, 6], { games: 3, code: 2, graphic: 2 }, [1, 0, 0, 3]),
    E('Virtual Reality Simulation (VR)', CS, 'either', 'Team or individual', [2, 6], { cad: 2, video: 2, games: 1, code: 1, graphic: 1 }, [2, 0, 0, 3]),
    E('Vlogging', ARTS, 'team', 'Team of 2–6', [2, 6], { video: 3, speak: 1, write: 1 }, [1, 1, 0, 2]),
    E('Webmaster', CS, 'either', 'Team (up to 6) or individual', [2, 6], { code: 3, graphic: 2 }, [1, 0, 0, 3]),

    E('Battling Bots', PA, 'team', 'Team', [2, 6], { robot: 3, build: 3, vehicle: 1, eng: 1 }, [0, 1, 0, 3], true),
    E('Logo Design', PA, 'solo', 'Individual', null, { graphic: 3, build: 1, business: 1 }, [0, 0, 0, 2], true),
    E('Materials Process', PA, 'solo', 'Individual', null, { build: 3, cad: 1 }, [0, 0, 0, 2], true),
    E('Medical Technology', PA, 'team', 'Team', [2, 6], { sci: 3, research: 2, graphic: 1 }, [0, 0, 0, 2], true),
    E('Pin Design', PA, 'solo', 'Individual', null, { graphic: 3, business: 1 }, [0, 0, 0, 1], true),
    E('R/C Off-Road Racing', PA, 'team', 'Team', [2, 6], { vehicle: 3, build: 2, robot: 1 }, [0, 1, 0, 2], true),
    E('Safety Illustration', PA, 'solo', 'Individual', null, { graphic: 3 }, [0, 0, 0, 1], true)
  ];

  const DESCS = {
      "Animatronics": "To address the annual design challenge, participants exhibit and demonstrate their knowledge of mechanical and control systems by creating an animatronic device with a specific purpose (i.e., communicate an idea, entertain, demonstrate a concept, etc.) that includes sound, lights, and an appropriate surrounding environment (a display).",
      "Architectural Design": "In response to the annual design challenge, participants develop a set of architectural plans and related materials, and construct both a physical and computer-generated model and virtual walkthrough to accurately depict their design. Semifinalists deliver a presentation and participate in an interview.",
      "Artificial Intelligence": "Applying leadership and 21st century skills, participants demonstrate knowledge of artificial intelligence (AI) concepts, models, and best practices by completing a test to qualify for semifinals. Semifinalist teams solve an onsite problem(s) using a generative artificial intelligence (GenAI) tool. Completed solutions are objectively measured to determine the best solution for the stated problem.",
      "Audio Podcasting": "Participants use digital audio technology to create original content for a podcast piece that addresses the annual theme. The podcast must feature high level storytelling techniques, voice acting, and folly sound effects; the full entry must include documentation of the podcast development process and elements. Semifinalists participate in an interview.",
      "Automated Manufacturing Systems": "Applying leadership and 21st century skills, participants collaborate to engineer and prototype an automated manufacturing system to solve a production problem. Teams analyze the prompt, build a sensor-based mechatronic solution, program the automation logic, document the mechanical and software design, and create instructions for judges to operate the system.",
      "Biotechnology Design": "Participants select a contemporary biotechnology problem that addresses the annual theme and demonstrates understanding of the topic through documented research, the development of a solution, a display (including an optional model or prototype), and an effective multimedia presentation. Semifinalists deliver a presentation and participate in an interview.",
      "Board Game Design": "Participants develop, build, and package a board game that focuses on a subject of their choice. Creative packaging, and the instructions, pieces, and cards associated with the pilot game will be evaluated. Semifinalists set up the game, demonstrate how the game is played, explain the game’s features, and discuss the design process.",
      "Chapter Team": "Participants take a parliamentary procedure test to qualify for the semifinal round of competition. Semifinalists conduct an opening ceremony, items of business, parliamentary actions, and a closing ceremony.",
      "Children’s Stories": "In response to the annual theme, participants create an illustrated children’s story of artistic, instructional, and social value, and submit documentation related to the development of the physical storybook. Semifinalists read their story aloud and participate in an interview.",
      "Computer-Aided Design (CAD), Architecture": "Participants use complex computer graphic skills, tools, and processes to respond to a design challenge in which they develop representations of architectural subjects, such as foundation and/or floor plans, and/or elevation drawings, and/or details of architectural ornamentation or cabinetry. The solution to the design challenge and participant answers in an interview are evaluated.",
      "Computer-Aided Design (CAD), Engineering": "Participants use complex computer graphic skills, tools, and processes to respond to a design challenge in which they develop three-dimensional representations of engineering subjects, such as a machine part, tool, device, or manufactured product. The solution to the design challenge and participant answers in an interview are evaluated.",
      "Cybersecurity": "Applying leadership and 21st century skills, participants respond to a cybersecurity challenge by identifying a breach in computer security via “Capture the Flag” games. Areas of challenge might include exploit development, digital puzzles, cryptography, reverse engineering, binary analysis, mobile security, etc. Participants must accurately address a series of on-site problems within a specified, limited amount of time.",
      "Data Science and Analytics": "Participants identify a societal issue, collect or compile data from various sources about the issue, and then produce documentation and a digital scientific poster about their findings. Semifinalists create a synopsis and digital visual representation of a data set provided in an onsite challenge.",
      "Debating Technological Issues": "Participants research the annual topic and subtopics and prepare for a debate against a team from another chapter. Teams are instructed to take either the pro or con side of a selected subtopic, submit a summary of references, and use their research to support their assigned position. The quality of a team’s debate determines semifinalists and finalists.",
      "Digital Video Production": "Participants develop and submit a digital video and a documentation portfolio (including such items as a storyboard, script, summary of references and sources, and equipment list) that reflects the annual theme. Semifinalists participate in an interview.",
      "Dragster Design": "Participants design, draw, and construct a CO2-powered dragster that adheres to specifications, design and documentation requirements, and the annual theme. Semifinalists compete in a double-elimination race and participate in an interview.",
      "Drone Challenge (UAV)": "Participants design, build, assemble, document, and test fly an open-source Unmanned Aerial Vehicle (UAV) according to the stated annual theme/problem specifications. The required documentation portfolio must include elements such as a photographic log, wiring schematics, and a description of the programming software used. Semifinalists participate in an interview.",
      "Engineering Design": "Participants develop a solution to an annual theme that is based on a specific challenge noted by the National Academy of Engineering (NAE) in its compilation of the grand challenges for engineering in the 21st century. The solution will include a documentation portfolio, a display, and a model/prototype. Semifinalists deliver a presentation and participate in an interview.",
      "Extemporaneous Speech": "Participants select a technology-related or TSA topic from among three topic cards and prepare and give a three-to-five-minute speech that communicates their knowledge of the chosen topic. The quality of the speech determines advancement to the semifinalist level of competition, for which an identical competition procedure is followed to determine finalists.",
      "Fashion Design and Technology": "To address the annual theme, participants demonstrate expertise in fashion design principles by creating a wearable garment, garment patterns, and a documentation portfolio. Semifinalist teams present their garment designs (worn by team models), discuss the design process with evaluators, and respond to interview questions.",
      "Flight Endurance": "Participants design, build, fly, and adjust (trim) a rubber-band powered model aircraft to make long endurance flights inside a contained airspace. Documentation (including elements such as attributes of the model design, drawings, and an analysis of the trim modifications), an inspection of the model and the required model flight box, and official times for two flights are aspects of the evaluation",
      "Forensic Science": "Participants take a test of basic forensic science to qualify for the semifinal round of competition. Semifinalists examine a mock crime scene and demonstrate their knowledge of forensic science through crime scene analysis, with the findings synthesized in a written report/analysis.",
      "Future Technology Teacher": "Participants research a developing technology, prepare a video showing an application of the technology in the classroom, and create a lesson plan/activity that features the application and connects to the Standards for Technological and Engineering Literacy (STEL), as well as STEM initiatives and integration. Semifinalists demonstrate the lesson plan and answer questions about their presentation.",
      "Hybrid Racer XL": "Hybrid Racer XL provides a hands-on opportunity for participants to apply science, technology, engineering, and mathematics (STEM) concepts - as well as leadership and 21st century skills such as creativity, teamwork, and problem-solving skills - as they design (according to annual requirements, if any), construct, and race a dual-powered (solar and battery) car.",
      "Interior Design": "Applying leadership and 21st century skills, participants develop a color sample and material design board(s) used by interior designers to plan an overall cohesive design based on an annual challenge. Participants must demonstrate an understanding of and aptitude for interior design, developing design boards, and presenting a design interpretation.",
      "Manufacturing Prototype": "Participants design, fabricate, and use Computer Integrated Manufacturing (CIM) to create a product that addresses the annual theme. A documentation portfolio and the completed product prototype are submitted for evaluation. Semifinalists give a product “sales pitch” and demonstration.",
      "Music Production": "Participants produce an original musical piece that reflects the annual theme on the TSA website under Themes & Problems. The quality of the musical piece and required documentation (including elements such as a plan of work, self-evaluation, and a list of hardware, software, and instruments used) determines advancement to the semifinal level of competition, during which semifinalist participants are interviewed.",
      "On Demand Video": "Once participants receive the challenge details (required criteria, such as props and a line of dialogue) at the national TSA conference, they have 36 hours to produce a 60-second film that showcases video skills, tools, and communication processes. The quality of the completed video production determines the finalists.",
      "Photographic Technology": "Participants produce a photographic portfolio - demonstrating expertise in photo and imaging technology processes - to convey a message based on the annual theme. Semifinalists have 24 hours to complete a portfolio of photos (with required documentation) taken onsite at the national TSA conference. Finalists are determined based on the quality of the semifinal portfolio, the portfolio presentation, and interview responses.",
      "Prepared Presentation": "Participants deliver a three-to-five-minute oral presentation related to the current national TSA conference theme. Both semifinalists and finalists are determined based on the quality of the presentation and the appropriate use and content of the accompanying required slide deck.",
      "Promotional Design": "Participants use computerized graphic communications layout and design skills to produce a promotional resource packet. The resource must address the annual theme/problem and include at least four printed publication items and required documentation. Semifinalists demonstrate publishing competency in an onsite technical design challenge.",
      "Robotics": "Participants design, build, document, and test a robot assembled using open-sourced parts according to stated specifications and to meet the challenge of the yearly theme/problem.",
      "Software Development": "Participants use their knowledge of cutting-edge technologies, algorithm design, problem-solving principles, effective communication, and collaboration to design, implement, test, document, and present a software development project of educational or social value. Both semifinalists and finalists are determined based on the quality of the presentation and project.",
      "STEM Mass Media": "In response to an annual theme, participants use written and verbal communication skills to convey a news story in both a video broadcast (preliminary round) and a digital written format (semifinal round). Participants must demonstrate a strong understanding of journalism etiquette and the common practices of the field of mass media.",
      "Structural Design and Engineering": "Participants apply the principles of structural engineering to design and construct a structure that complies with the annual challenge. An assessment of the required documentation and the destructive testing of the structure (to determine its design efficiency) determine both semifinalists and finalists.",
      "Technology Bowl": "Participants demonstrate their knowledge of TSA and concepts addressed in technology content standards by completing an objective test. Semifinalist teams participate in a question/response, head-to-head, team competition.",
      "Technology Problem Solving": "Participants use problem-solving skills to design and construct a finite solution to a challenge provided onsite at the conference. Solutions are evaluated at the end of 90 minutes using measures appropriate to the challenge, such as elapsed time, horizontal or vertical distance, and/or strength.",
      "Transportation Modeling": "Participants research, design, and produce a scale model of a vehicle that complies with the annual design problem. A display for the model and a documentation portfolio – containing elements such as a description of the vehicle, photographs and commentary detailing the vehicle production, and technical illustrations – are required. Semifinalists participate in an interview.",
      "Video Game Design": "Participants design, build, and launch an E-rated online video game – with accompanying required documentation - that addresses the annual theme. Semifinalists participate in an interview to demonstrate the knowledge and expertise they gained during the development of the game.",
      "Virtual Reality Simulation (VR)": "Participants use video and 3D computer graphics tools and design processes to create a two-to-three-minute VR visualization (accompanied by supporting documentation) that addresses the annual theme. Semifinalists deliver a presentation about their visualization and participate in an interview.",
      "Vlogging": "Vlogging encourages good storytelling, videography, and editing techniques to create a coherent series of creative work. Applying leadership and 21st century skills, participants use digital video technology to create original content that reflects an annual technology theme. Semifinalists complete an onsite challenge to produce additional video(s). Required criteria, such as props, lines of dialog, topics, etc., will be revealed at the semifinalist orientation meeting.",
      "Webmaster": "Participants design, build, and launch a website that addresses the annual challenge. Semifinalists participate in an interview to demonstrate the knowledge and expertise gained during the development of the website.",
      "Battling Bots": "Students design and build remote-controlled robots (Bots) to face off in a gladiator-style competition. Through the manufacturing process of Bot building, students design, build, and compete with their robotic creations while gaining practical STEM knowledge essential for manufacturing careers.",
      "Logo Design": "A screen-printing event: students create promotional logo designs for next year’s PA-TSA T-shirt, State Conference program, and website banner, and print them using a hand-made screen stencil. Transfers, direct-to-garment printing, and purchased prints are not permitted. The winning design appears on PA-TSA State Conference publications.",
      "Materials Process": "Contestants submit drawings and photographs of a project they constructed during the school year. The event gives members a way to demonstrate their ability to fabricate a project or product.",
      "Medical Technology": "Participants research a contemporary medical technology issue of their choosing, document their research and solution, and create a digital scientific poster. Entries (a documentation portfolio and an 8.5” × 11” digital poster) are early-submission only, with no semifinal round.",
      "Pin Design": "Competitors design a visually captivating pin that embodies the spirit and values of PA-TSA, using symbols, color, and design to convey a message. The PA-TSA pin raises funds for the National Service Project and is traded at the National Conference.",
      "R/C Off-Road Racing": "Teams adapt, operate, race, and maintain a radio-controlled off-road vehicle that also performs a task while racing around the track. The portfolio, vehicle body, task piece, task drawings, and race results all count toward the score, and the task changes every year.",
      "Safety Illustration": "Members create an illustration that promotes safety and safe practices when using any form of technology, traditional or high tech, showing their ability to recognize safety needs."
  };
  EVENTS.forEach(function (e) { e.desc = DESCS[e.name] || ''; });

  // ---------- Questions ----------
  // t: skill points added; p: format preferences set
  const QUESTIONS = [
    { q: 'It’s a free Saturday. What are you most likely doing?', opts: [
      { l: 'Taking apart gadgets or building something in the garage', t: { build: 2, robot: 2, eng: 1 } },
      { l: 'Coding a side project or testing out a new app', t: { code: 3, puzzle: 1 } },
      { l: 'Filming, editing, or taking photos', t: { video: 2, photo: 2 } },
      { l: 'Drawing, designing, or making something artsy', t: { graphic: 3, fashion: 1 } },
      { l: 'Making music or recording audio', t: { music: 3, audio: 2 } },
      { l: 'Reading, writing, or getting into a debate with friends', t: { write: 2, speak: 2, research: 1 } },
      { l: 'Watching science or true-crime documentaries', t: { sci: 2, research: 1, puzzle: 1 } },
      { l: 'Playing strategy, board, or video games', t: { games: 3, puzzle: 1 } }
    ] },
    { q: 'Which class do you look forward to the most?', opts: [
      { l: 'Computer science', t: { code: 3, data: 1 } },
      { l: 'Physics or engineering', t: { eng: 3, build: 1, vehicle: 1, flight: 1 } },
      { l: 'Biology or chemistry', t: { sci: 3, research: 1 } },
      { l: 'Math or statistics', t: { data: 3, puzzle: 1 } },
      { l: 'English or history', t: { write: 3, speak: 1, research: 1 } },
      { l: 'Art or design', t: { graphic: 3, arch: 1, fashion: 1 } },
      { l: 'Music or media', t: { music: 2, video: 2, audio: 1 } },
      { l: 'Business or economics', t: { business: 3, civic: 1 } }
    ] },
    { q: 'Pick the tool you would most like to master.', opts: [
      { l: 'A 3D printer and CAD software', t: { cad: 3, build: 1, eng: 1 } },
      { l: 'A microcontroller, motors, and sensors', t: { robot: 3, code: 1 } },
      { l: 'A camera and video editing software', t: { video: 3, photo: 2 } },
      { l: 'A code editor', t: { code: 3 } },
      { l: 'A sketchbook or design software', t: { graphic: 3 } },
      { l: 'A microphone and audio software', t: { audio: 3, music: 2 } },
      { l: 'A sewing machine and fabric', t: { fashion: 3 } },
      { l: 'A saw, sandpaper, and a workbench', t: { build: 3, vehicle: 1 } }
    ] },
    { q: 'Which challenge would you rather take on?', opts: [
      { l: 'Design an eco-friendly building or a room people love to be in', t: { arch: 3, graphic: 1 } },
      { l: 'Track down a hacker inside a computer network', t: { puzzle: 3, code: 2 } },
      { l: 'Build the fastest car or a plane that stays up the longest', t: { vehicle: 3, flight: 3, build: 1 } },
      { l: 'Solve the mystery at a crime scene', t: { sci: 3, puzzle: 2 } },
      { l: 'Invent a solution to a global problem like clean water', t: { eng: 3, research: 2, sci: 1 } },
      { l: 'Launch a product or campaign that people want to buy', t: { business: 3, graphic: 1 } },
      { l: 'Tell a story that changes how people think', t: { write: 2, video: 2, speak: 1 } },
      { l: 'Teach younger kids something new and exciting', t: { teach: 3, speak: 1, write: 1 } }
    ] },
    { q: 'What finished project would make you proudest?', opts: [
      { l: 'A machine or robot that actually works', t: { robot: 3, build: 2 } },
      { l: 'A website, app, or game that people use', t: { code: 3, games: 2 } },
      { l: 'A short film or video series', t: { video: 3 } },
      { l: 'A model or set of plans for a structure', t: { arch: 2, cad: 2, eng: 1 } },
      { l: 'A poster, logo, or design printed for everyone to see', t: { graphic: 3, business: 1 } },
      { l: 'An original song or podcast episode', t: { audio: 3, music: 2 } },
      { l: 'A research report with real findings', t: { research: 3, data: 2, sci: 1 } },
      { l: 'A garment you designed and made yourself', t: { fashion: 3 } }
    ] },
    { q: 'How do you feel about public speaking?', opts: [
      { l: 'I love it. Give me a stage and a microphone.', t: { speak: 3 }, p: { talk: 3 } },
      { l: 'I’m comfortable presenting something I’ve prepared', t: { speak: 1 }, p: { talk: 2 } },
      { l: 'An interview with judges is fine, but no speeches', p: { talk: 1 } },
      { l: 'I’d rather let my work do the talking', p: { talk: 0 } }
    ] },
    { q: 'How do you like to work?', opts: [
      { l: 'On a big team where everyone has a role (3–6 people)', p: { team: 'team' } },
      { l: 'With one partner I trust', p: { team: 'partner' } },
      { l: 'Solo, so I have full control', p: { team: 'solo' } },
      { l: 'It doesn’t matter to me', p: { team: 'any' } }
    ] },
    { q: 'Which kind of competition sounds more exciting?', opts: [
      { l: 'A surprise challenge revealed at the conference, with the clock ticking', p: { onsite: 'onsite' } },
      { l: 'Spending months perfecting a project before the conference', p: { onsite: 'prepared' } },
      { l: 'A bit of both', p: { onsite: 'mix' } }
    ] },
    { q: 'What are your thoughts on tests and trivia?', opts: [
      { l: 'Bring it on. I love quiz bowls and knowing random facts.', t: { trivia: 3 }, p: { test: 'love' } },
      { l: 'I don’t mind a test if it gets me to the fun part', t: { trivia: 1 }, p: { test: 'ok' } },
      { l: 'I’d rather skip tests entirely', p: { test: 'avoid' } }
    ] },
    { q: 'Which of these have you tried before?', hint: 'Pick all that apply.', multi: true, opts: [
      { l: 'Coding or programming', t: { code: 1.5 } },
      { l: 'Video or photo editing', t: { video: 1, photo: 1 } },
      { l: '3D modeling or CAD (Tinkercad, Onshape, Fusion)', t: { cad: 1.5 } },
      { l: 'Robotics, Arduino, or electronics', t: { robot: 1.5 } },
      { l: 'Woodworking, model building, or crafts', t: { build: 1.5 } },
      { l: 'Speech, debate, Model UN, or mock trial', t: { speak: 1, civic: 1 } },
      { l: 'Drawing, graphic design, or digital art', t: { graphic: 1.5 } },
      { l: 'Music, audio recording, or podcasting', t: { music: 1, audio: 1 } },
      { l: 'Science Olympiad, research, or lab work', t: { sci: 1, research: 1 } },
      { l: 'None yet. I’m here to try something new!', none: true }
    ] },
    { q: 'What do you most want to get out of TSA?', opts: [
      { l: 'Hands-on engineering skills for a future career', t: { eng: 2, build: 1, robot: 1 } },
      { l: 'A creative portfolio I can be proud of', t: { graphic: 1, video: 1, photo: 1, music: 1, fashion: 1, write: 1 } },
      { l: 'Confidence as a speaker and a leader', t: { speak: 2, civic: 2, teach: 1 } },
      { l: 'Real coding and tech skills', t: { code: 2, data: 1, puzzle: 1 } },
      { l: 'Science and research experience', t: { sci: 2, research: 2 } },
      { l: 'Experience in design, marketing, and business', t: { business: 2, graphic: 1 } }
    ] },
    { q: 'How much time can you give TSA outside of meetings?', opts: [
      { l: '1–2 hours a week', p: { time: 'low' } },
      { l: '3–5 hours a week', p: { time: 'med' } },
      { l: 'As much as it takes. I’m all in.', p: { time: 'high' } }
    ] }
  ];

  // ---------- Scoring ----------
  function buildProfile(answers) {
    const t = {};
    const p = { talk: 2, team: 'any', onsite: 'mix', test: 'ok', time: 'med' };
    QUESTIONS.forEach(function (q, i) {
      const a = answers[i];
      if (a == null) return;
      (Array.isArray(a) ? a : [a]).forEach(function (j) {
        const o = q.opts[j];
        if (!o) return;
        Object.keys(o.t || {}).forEach(function (k) { t[k] = (t[k] || 0) + o.t[k]; });
        Object.assign(p, o.p || {});
      });
    });
    return { t: t, p: p };
  }

  function formatFit(e, p) {
    let f = 1;
    // Team vs. individual
    if (p.team === 'solo') f *= e.fmt === 'solo' ? 1.08 : e.fmt === 'either' ? 1.04 : 0.72;
    else if (p.team === 'partner') f *= e.fmt === 'solo' ? 0.9 : (e.sz && e.sz[0] <= 2 ? 1.06 : 0.9);
    else if (p.team === 'team') f *= e.fmt === 'solo' ? 0.78 : e.fmt === 'either' ? 0.98 : (e.sz[1] >= 3 ? 1.06 : 0.95);
    // Public speaking
    const TALK = { 3: [0.94, 1, 1.08, 1.18], 2: [1, 1, 1, 0.97], 1: [1.03, 1, 0.85, 0.6], 0: [1.06, 0.94, 0.72, 0.4] };
    f *= TALK[p.talk][e.talk];
    // Onsite challenge vs. prepared entry
    if (p.onsite === 'onsite') f *= [0.94, 1.03, 1.08, 1.15][e.onsite];
    else if (p.onsite === 'prepared') f *= [1.06, 0.97, 0.85, 0.7][e.onsite];
    // Qualifying test
    if (e.test) f *= p.test === 'love' ? 1.12 : p.test === 'avoid' ? 0.75 : 1;
    // Prep time
    if (p.time === 'low') f *= [1.06, 0.95, 0.82][e.load - 1];
    else if (p.time === 'med') f *= [1, 1, 0.96][e.load - 1];
    else if (p.time === 'high') f *= [0.97, 1, 1.06][e.load - 1];
    return f;
  }

  function scoreEvent(e, prof) {
    let dot = 0, ne = 0, nu = 0;
    Object.keys(e.t).forEach(function (k) { dot += e.t[k] * (prof.t[k] || 0); ne += e.t[k] * e.t[k]; });
    Object.keys(prof.t).forEach(function (k) { nu += prof.t[k] * prof.t[k]; });
    const cos = ne && nu ? dot / Math.sqrt(ne * nu) : 0;
    const fit = formatFit(e, prof.p);
    // Interest drives the score and format fit adjusts it. Above 90% the display eases toward a 99% cap.
    const raw = Math.pow(cos, 0.7) * fit;
    const pct = raw <= 0.9 ? raw * 100 : 90 + 9 * (1 - Math.exp(-(raw - 0.9) * 4));
    return { e: e, cos: cos, fit: fit, score: raw, pct: Math.max(1, Math.round(pct)) };
  }

  function reasonsFor(r, prof) {
    const e = r.e, p = prof.p, out = [], notes = [];
    Object.keys(e.t)
      .map(function (k) { return [k, e.t[k] * (prof.t[k] || 0)]; })
      .filter(function (x) { return x[1] >= 3; })
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 2)
      .forEach(function (x) { out.push(REASONS[x[0]]); });

    if (p.team === 'solo' && e.fmt !== 'team') out.push(e.fmt === 'solo' ? 'It’s an individual event, so you’re in full control' : 'You can enter on your own');
    else if (p.team === 'partner' && e.sz && e.sz[0] <= 2) out.push(e.sz[1] === 2 ? 'It’s built for a team of two' : 'It works with a team as small as two');
    else if (p.team === 'team' && e.fmt !== 'solo' && e.sz[1] >= 3) out.push('It’s a team event, which is how you like to work');
    if (p.onsite === 'onsite' && e.onsite >= 2) out.push('It has a live onsite challenge, which suits how you compete');
    else if (p.onsite === 'prepared' && e.onsite === 0) out.push('You prepare the entire entry before the conference');
    if (p.talk === 3 && e.talk >= 2) out.push('It lets your speaking skills shine');
    else if (p.talk <= 1 && e.talk === 0) out.push('It involves little to no public speaking');
    if (p.test === 'love' && e.test) out.push('It starts with a test, which you are up for');
    if (p.time === 'low' && e.load === 1) out.push('It’s manageable with limited prep time');
    else if (p.time === 'high' && e.load === 3) out.push('It’s a big project that rewards the extra time you can give');

    if (e.test && p.test === 'avoid') notes.push('Includes a qualifying test before the semifinal round.');
    if (e.talk >= 2 && p.talk <= 1) notes.push(e.talk === 3 ? 'Speaking is the main part of this event.' : 'Involves presenting your work to judges.');
    if (e.onsite >= 2 && p.onsite === 'prepared') notes.push('Much of this event happens onsite under a time limit.');
    if (e.load === 3 && p.time === 'low') notes.push('Expect a large project with significant prep time.');
    if (e.fmt === 'team' && p.team === 'solo') notes.push('This is a team event, so you’ll need teammates.');
    if (e.name === 'Chapter Team') notes.push('Requires a full team of six.');
    return { reasons: out.slice(0, 4), notes: notes };
  }

  function archetypes(prof) {
    const scores = ARCHETYPES.map(function (a) {
      const sum = a.traits.reduce(function (s, k) { return s + (prof.t[k] || 0); }, 0);
      return { a: a, v: sum / Math.sqrt(a.traits.length) };
    });
    const total = scores.reduce(function (s, x) { return s + x.v; }, 0) || 1;
    scores.forEach(function (x) { x.share = Math.round((x.v / total) * 100); });
    return scores.sort(function (a, b) { return b.v - a.v; });
  }

  function rank(answers, includePA) {
    const prof = buildProfile(answers);
    const ranked = EVENTS
      .filter(function (e) { return includePA || !e.pa; })
      .map(function (e) { return scoreEvent(e, prof); })
      .sort(function (a, b) { return b.score - a.score; });
    return { prof: prof, ranked: ranked, arch: archetypes(prof) };
  }

  // Exposed for testing in Node.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EVENTS: EVENTS, QUESTIONS: QUESTIONS, rank: rank, reasonsFor: reasonsFor };
  }
  if (typeof document === 'undefined') return;

  // ---------- UI ----------
  const root = document.getElementById('event-quiz');
  if (!root) return;

  const STORE_KEY = 'lmtsa-event-quiz';
  const N = QUESTIONS.length;
  const LETTERS = 'ABCDEFGHIJ';
  const state = { step: -1, answers: new Array(N).fill(null), includePA: true, lock: false, lastPct: 0 };

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (err) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ answers: state.answers, includePA: state.includePA })); } catch (err) { /* storage unavailable */ }
  }
  function isAnswered(i) {
    const a = state.answers[i];
    return Array.isArray(a) ? a.length > 0 : a != null;
  }

  const BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 font-mono text-sm font-semibold tracking-[0.12em] uppercase bg-scarlet text-white rounded-md px-6 py-3.5 hover:bg-navy hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none';
  const BTN_SECONDARY = 'inline-flex items-center justify-center gap-2 font-mono text-sm font-semibold tracking-[0.12em] uppercase border-2 border-navy text-navy rounded-md px-6 py-3 hover:border-scarlet hover:text-scarlet hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200';

  function render(animate) {
    if (state.step < 0) root.innerHTML = introHTML();
    else if (state.step < N) root.innerHTML = questionHTML(state.step, animate);
    else root.innerHTML = resultsHTML();

    if (state.step >= 0 && state.step < N) {
      const bar = root.querySelector('[data-progress]');
      const target = Math.round((state.step / N) * 100);
      requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.width = target + '%'; }); });
      state.lastPct = target;
    }
    if (state.step >= N) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          root.querySelectorAll('[data-w]').forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
        });
      });
    }
  }

  function focusTop(sel) {
    const el = root.querySelector(sel);
    if (!el) return;
    el.focus({ preventScroll: true });
    const top = root.getBoundingClientRect().top;
    const header = document.querySelector('header');
    const offset = (header ? header.offsetHeight : 0) + 16;
    if (top < offset || top > window.innerHeight * 0.5) {
      window.scrollTo({ top: window.scrollY + top - offset, behavior: 'smooth' });
    }
  }

  function introHTML() {
    const saved = load();
    return '<div class="quiz-in px-6 py-10 sm:px-12 sm:py-14 text-center">' +
      '<h2 id="quiz-title" tabindex="-1" class="font-display font-bold text-3xl md:text-4xl text-navy leading-tight focus:outline-none">Which TSA events are right for you?</h2>' +
      '<p class="mt-4 max-w-2xl mx-auto text-navy/80 leading-relaxed">Answer 12 quick questions about what you enjoy and how you like to work. We’ll match you against all 42 national high school events plus the 7 Pennsylvania-only events, and explain why each one fits.</p>' +
      '<div class="mt-6 flex flex-wrap justify-center gap-2">' +
        chip('12 questions') + chip('About 3 minutes') + chip('49 events') +
      '</div>' +
      '<div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">' +
        '<button type="button" data-action="start" class="' + BTN_PRIMARY + '">Start the quiz <span aria-hidden="true">&rarr;</span></button>' +
        (saved && saved.answers ? '<button type="button" data-action="last" class="' + BTN_SECONDARY + '">See my last results</button>' : '') +
      '</div>' +
    '</div>';
  }

  function chip(text, tone) {
    const cls = tone === 'scarlet' ? 'bg-scarlet/10 text-scarlet' : tone === 'navy' ? 'bg-navy text-white' : 'bg-creamdeep text-navy/70';
    return '<span class="font-mono text-[11px] font-semibold tracking-wide uppercase rounded-full px-3 py-1 ' + cls + '">' + text + '</span>';
  }

  function questionHTML(i, animate) {
    const q = QUESTIONS[i];
    const a = state.answers[i];
    const sel = function (j) { return Array.isArray(a) ? a.indexOf(j) !== -1 : a === j; };
    const opts = q.opts.map(function (o, j) {
      const on = sel(j);
      return '<button type="button" data-opt="' + j + '" aria-pressed="' + on + '" class="group flex items-start gap-3 w-full text-left rounded-lg border-2 px-4 py-3.5 transition-all duration-150 ' +
        (on ? 'border-scarlet bg-scarlet/5' : 'border-line bg-white hover:border-navy hover:-translate-y-0.5') + '">' +
        '<span aria-hidden="true" class="shrink-0 w-7 h-7 rounded-md font-mono text-xs font-bold flex items-center justify-center transition-colors ' +
          (on ? 'bg-scarlet text-white' : 'bg-creamdeep text-navy/70 group-hover:bg-navy group-hover:text-white') + '">' + (on ? '&#10003;' : LETTERS[j]) + '</span>' +
        '<span class="text-[15px] leading-snug font-medium text-navy pt-1">' + o.l + '</span>' +
      '</button>';
    }).join('');
    const last = i === N - 1;
    return '<div class="px-6 pt-6 sm:px-10 sm:pt-8">' +
        '<div class="flex items-center justify-between font-mono text-xs tracking-[0.15em] uppercase text-navy/60">' +
          '<span>Question ' + (i + 1) + ' of ' + N + '</span><span>' + Math.round((i / N) * 100) + '% done</span>' +
        '</div>' +
        '<div class="mt-3 h-2 rounded-full bg-line overflow-hidden" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax="' + N + '" aria-valuenow="' + i + '">' +
          '<div data-progress class="h-full bg-scarlet rounded-full transition-[width] duration-500 ease-out" style="width:' + state.lastPct + '%"></div>' +
        '</div>' +
      '</div>' +
      '<div class="' + (animate ? 'quiz-in ' : '') + 'px-6 py-6 sm:px-10 sm:py-8">' +
        '<h3 id="quiz-q" tabindex="-1" class="font-display font-semibold text-2xl md:text-3xl text-navy leading-tight focus:outline-none">' + q.q + '</h3>' +
        (q.hint ? '<p class="mt-2 text-sm text-navy/60">' + q.hint + '</p>' : '') +
        '<div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-labelledby="quiz-q">' + opts + '</div>' +
      '</div>' +
      '<div class="px-6 pb-6 sm:px-10 sm:pb-8 flex items-center justify-between gap-3 border-t border-line pt-5 sm:pt-6">' +
        '<button type="button" data-action="back" class="inline-flex items-center gap-2 font-mono text-sm font-semibold tracking-[0.12em] uppercase text-navy/70 hover:text-scarlet transition-colors px-2 py-2">' +
          '<span aria-hidden="true">&larr;</span> ' + (i === 0 ? 'Intro' : 'Back') + '</button>' +
        '<button type="button" data-action="next" class="' + BTN_PRIMARY + '"' + (isAnswered(i) ? '' : ' disabled') + '>' +
          (last ? 'See my results' : 'Next') + ' <span aria-hidden="true">&rarr;</span></button>' +
      '</div>';
  }

  function eventCard(r, idx, prof) {
    const e = r.e;
    const why = reasonsFor(r, prof);
    const top = idx === 0;
    const chips = [chip(e.cat, e.pa ? 'scarlet' : null), chip(e.size)];
    if (e.onsite >= 2) chips.push(chip('Onsite challenge'));
    if (e.test) chips.push(chip('Qualifying test'));
    return '<li class="rounded-lg bg-white p-4 sm:p-6 ' + (top ? 'border-2 border-scarlet shadow-lg' : 'border border-line') + '">' +
      '<div class="flex items-center gap-3 sm:gap-4">' +
        '<span class="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-md ' + (top ? 'bg-scarlet' : 'bg-navy') + ' text-white font-display font-bold text-lg flex items-center justify-center" aria-hidden="true">' + (idx + 1) + '</span>' +
        '<div class="flex-1 min-w-0 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">' +
          '<h4 class="font-display font-semibold text-xl md:text-2xl text-navy leading-tight"><span class="sr-only">Number ' + (idx + 1) + ': </span>' + (e.pa ? 'PA-' : '') + e.name + '</h4>' +
          '<span class="font-mono text-sm font-bold text-scarlet whitespace-nowrap">' + r.pct + '% match</span>' +
        '</div>' +
      '</div>' +
      '<div class="sm:pl-14">' +
        '<div class="mt-3 h-1.5 bg-line rounded-full overflow-hidden" aria-hidden="true"><div data-w="' + r.pct + '" class="h-full bg-scarlet rounded-full transition-[width] duration-700 ease-out" style="width:0"></div></div>' +
        '<div class="mt-3 flex flex-wrap gap-2">' + chips.join('') + '</div>' +
        '<p class="mt-3 text-sm text-navy/80 leading-relaxed">' + e.desc + '</p>' +
        (why.reasons.length ? '<p class="mt-4 text-sm font-semibold text-navy">Why it fits you</p>' +
          '<ul class="mt-1.5 space-y-1 text-sm text-navy/80">' + why.reasons.map(function (x) {
            return '<li class="flex gap-2"><span class="text-scarlet font-bold" aria-hidden="true">&#10003;</span><span>' + x + '</span></li>';
          }).join('') + '</ul>' : '') +
        (why.notes.length ? '<p class="mt-3 text-sm text-navy/70 bg-creamdeep rounded-md px-3 py-2"><span class="font-semibold text-navy">Heads up:</span> ' + why.notes.join(' ') + '</p>' : '') +
      '</div>' +
    '</li>';
  }

  function resultsHTML() {
    const res = rank(state.answers, state.includePA);
    const lead = res.arch[0];
    const top = res.ranked.slice(0, 5);
    const more = res.ranked.slice(5, 11);
    const bars = res.arch.slice(0, 3).map(function (x, i) {
      return '<div><div class="flex justify-between font-mono text-xs uppercase tracking-[0.12em] text-navy/70"><span>' + x.a.short + '</span><span>' + x.share + '%</span></div>' +
        '<div class="mt-1.5 h-1.5 bg-line rounded-full overflow-hidden"><div data-w="' + x.share + '" class="h-full rounded-full transition-[width] duration-700 ease-out ' + (i === 0 ? 'bg-scarlet' : 'bg-navy') + '" style="width:0"></div></div></div>';
    }).join('');

    return '<div class="quiz-in px-6 py-8 sm:px-10 sm:py-10">' +
      '<div class="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 pb-8 border-b-2 border-line">' +
        '<div class="flex-1">' +
          '<p class="text-sm font-semibold text-navy/60">Your TSA profile</p>' +
          '<h2 id="quiz-title" tabindex="-1" class="mt-1 font-display font-bold text-3xl md:text-5xl text-navy leading-tight focus:outline-none">' + lead.a.name + '</h2>' +
          '<p class="mt-3 text-navy/80 leading-relaxed max-w-xl">' + lead.a.blurb + '</p>' +
        '</div>' +
        '<div class="md:w-64 space-y-3" aria-label="Your top skill areas">' + bars + '</div>' +
      '</div>' +
      '<div class="mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">' +
        '<h3 class="font-display font-semibold text-2xl md:text-3xl text-navy">Your top events</h3>' +
        '<label class="inline-flex items-center gap-2.5 text-sm font-medium text-navy/80 cursor-pointer select-none">' +
          '<input type="checkbox" data-action="pa" class="w-4 h-4 accent-scarlet cursor-pointer"' + (state.includePA ? ' checked' : '') + ' /> Include PA-only events</label>' +
      '</div>' +
      '<ol class="mt-5 space-y-4">' + top.map(function (r, i) { return eventCard(r, i, res.prof); }).join('') + '</ol>' +
      '<h3 class="mt-10 font-display font-semibold text-xl md:text-2xl text-navy">Also worth a look</h3>' +
      '<ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">' + more.map(function (r) {
        return '<li class="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3">' +
          '<span class="min-w-0"><span class="block font-semibold text-navy leading-snug">' + (r.e.pa ? 'PA-' : '') + r.e.name + '</span>' +
          '<span class="block text-xs text-navy/60 mt-0.5">' + r.e.size + '</span></span>' +
          '<span class="shrink-0 font-mono text-sm font-bold text-navy/70">' + r.pct + '%</span></li>';
      }).join('') + '</ul>' +
      '<div class="mt-10 rounded-lg bg-creamdeep p-5 sm:p-6">' +
        '<p class="font-display font-semibold text-lg text-navy">What’s next?</p>' +
        '<ul class="mt-3 space-y-2 text-sm text-navy/80 leading-relaxed list-disc pl-5">' +
          '<li>Most members compete in a few events. Try pairing one you’re confident in with one that stretches you, and mix team and individual events.</li>' +
          '<li>Read the official guidelines for your top picks before you commit; each event has its own rules, theme, and deliverables.</li>' +
          '<li>Some events have limited chapter spots, so LM-TSA holds runoffs when more members want an event than we can send.</li>' +
          '<li>Still unsure? Ask an officer at the next meeting. We’re happy to help!</li>' +
        '</ul>' +
      '</div>' +
      '<div class="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">' +
        '<button type="button" data-action="restart" class="' + BTN_PRIMARY + '">Retake quiz</button>' +
        '<a href="competition-events.html" class="' + BTN_SECONDARY + '">All events</a>' +
        '<a href="competition-runoffs.html" class="' + BTN_SECONDARY + '">Runoffs</a>' +
      '</div>' +
    '</div>';
  }

  function go(step) {
    state.step = step;
    state.lock = false;
    render(true);
    if (step >= N) { save(); focusTop('#quiz-title'); }
    else if (step < 0) focusTop('#quiz-title');
    else focusTop('#quiz-q');
  }

  function choose(j) {
    const i = state.step;
    const q = QUESTIONS[i];
    if (!q || state.lock || !q.opts[j]) return;
    if (q.multi) {
      let a = Array.isArray(state.answers[i]) ? state.answers[i].slice() : [];
      if (q.opts[j].none) a = a.indexOf(j) !== -1 ? [] : [j];
      else {
        a = a.filter(function (x) { return !q.opts[x].none; });
        const at = a.indexOf(j);
        if (at === -1) a.push(j); else a.splice(at, 1);
      }
      state.answers[i] = a;
      render(false);
      const btn = root.querySelector('[data-opt="' + j + '"]');
      if (btn) btn.focus({ preventScroll: true });
    } else {
      state.answers[i] = j;
      state.lock = true;
      render(false);
      setTimeout(function () { go(i + 1); }, 280);
    }
  }

  root.addEventListener('click', function (ev) {
    const opt = ev.target.closest('[data-opt]');
    if (opt) { choose(Number(opt.getAttribute('data-opt'))); return; }
    const btn = ev.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'start') go(0);
    else if (action === 'next' && isAnswered(state.step)) go(state.step + 1);
    else if (action === 'back') go(state.step - 1);
    else if (action === 'restart') { state.answers = new Array(N).fill(null); state.lastPct = 0; go(0); }
    else if (action === 'last') {
      const saved = load();
      if (saved && Array.isArray(saved.answers) && saved.answers.length === N) {
        state.answers = saved.answers;
        state.includePA = saved.includePA !== false;
        go(N);
      } else go(0);
    }
  });

  root.addEventListener('change', function (ev) {
    if (ev.target.matches('[data-action="pa"]')) {
      state.includePA = ev.target.checked;
      save();
      render(false);
      const box = root.querySelector('[data-action="pa"]');
      if (box) box.focus({ preventScroll: true });
    }
  });

  // Keyboard shortcuts: A–J or 1–9 pick an answer, Enter continues.
  document.addEventListener('keydown', function (ev) {
    if (state.step < 0 || state.step >= N || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (!root.contains(document.activeElement) && document.activeElement !== document.body) return;
    const key = ev.key.toUpperCase();
    let j = -1;
    if (/^[1-9]$/.test(key)) j = Number(key) - 1;
    else if (key.length === 1 && LETTERS.indexOf(key) !== -1) j = LETTERS.indexOf(key);
    if (j >= 0 && j < QUESTIONS[state.step].opts.length) { ev.preventDefault(); choose(j); }
    else if (ev.key === 'Enter' && QUESTIONS[state.step].multi && isAnswered(state.step) && !ev.target.closest('[data-opt]')) {
      ev.preventDefault(); go(state.step + 1);
    }
  });

  render(false);
})();
