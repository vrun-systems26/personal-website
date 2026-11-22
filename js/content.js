// generated from ../index.html: the exact words and photos of the live site
const SITE = {
 "real": true,
 "name": [
  "Varun",
  "Chilukuri"
 ],
 "bio": "I build robots, mechatronics and embedded systems, mostly at hackathons. Student at Leland High, San Jose.",
 "nav": [
  [
   {
    "to": "index-cabinet",
    "label": "Index",
    "href": "#/index-cabinet"
   },
   {
    "to": "fetch",
    "label": "Fetch",
    "href": "#/fetch"
   },
   {
    "to": "ceres",
    "label": "Ceres",
    "href": "#/ceres"
   },
   {
    "to": "sweeper",
    "label": "Street Sweeper",
    "href": "#/sweeper"
   },
   {
    "to": "arrival",
    "label": "Arrival",
    "href": "#/arrival"
   }
  ],
  [
   {
    "to": "builds",
    "label": "Side builds",
    "href": "#/builds"
   },
   {
    "to": "software",
    "label": "Software",
    "href": "#/software"
   },
   {
    "to": "now",
    "label": "Currently",
    "href": "#/now"
   },
   {
    "to": "awards",
    "label": "Awards",
    "href": "#/awards"
   }
  ]
 ],
 "links": [
  {
   "label": "GitHub",
   "href": "https://github.com/vrun-systems26"
  },
  {
   "label": "LinkedIn",
   "href": "https://www.linkedin.com/in/varunchilukuri26/"
  },
  {
   "label": "Devpost",
   "href": "https://devpost.com/varunchilukuri7"
  }
 ],
 "copies": [
  {
   "label": "Email",
   "copy": "varunchilukuri7@gmail.com",
   "done": "Email copied: varunchilukuri7@gmail.com"
  },
  {
   "label": "Discord",
   "copy": "vaboooonc_19214",
   "done": "Discord copied: vaboooonc_19214"
  }
 ],
 "credit": {
  "href": "https://soundcloud.com/bloodorange/champagne-coast",
  "label": "Champagne Coast · Blood Orange on SoundCloud ↗"
 },
 "builds": {
  "title": "Side builds",
  "items": [
   {
    "to": "arm",
    "label": "HocDiuTempusSumpsit",
    "href": "#/builds/arm"
   },
   {
    "to": "eclipse",
    "label": "The Eclipse Lamp",
    "href": "#/builds/eclipse"
   },
   {
    "to": "maglift",
    "label": "MagLift",
    "href": "#/builds/maglift"
   },
   {
    "to": "mars",
    "label": "MARS-61",
    "href": "#/builds/mars"
   },
   {
    "to": "mouse",
    "label": "Gaming Mouse",
    "href": "#/builds/mouse"
   },
   {
    "to": "wattwatch",
    "label": "WattWatch",
    "href": "#/builds/wattwatch"
   }
  ]
 },
 "awards": {
  "title": "Awards",
  "items": [
   {
    "place": "1st",
    "first": true,
    "title": "Overall, Bay Valley Hacks",
    "sub": "Index · 400+ hackers"
   },
   {
    "place": "1st",
    "first": true,
    "title": "Overall, CSI Hacks",
    "sub": "Fetch · 82+ teams"
   },
   {
    "place": "Top 30",
    "first": false,
    "title": "High Honors, Veritas AI International High School Hackathon",
    "sub": "Recall · solo · shortlisted in the top 30 of 1,000+ projects, 1,700+ students, 75+ countries · $1,250 scholarship"
   },
   {
    "place": "2nd",
    "first": false,
    "title": "Open Hardware, Berkeley Robotics Hackathon",
    "sub": "Ceres · 80+ teams, high schoolers only"
   },
   {
    "place": "2nd",
    "first": false,
    "title": "Interactive Learning, Milpitas Hacks",
    "sub": "Street Sweeper · 220+ participants"
   },
   {
    "place": "2nd",
    "first": false,
    "title": "Leland High School Science Fair",
    "sub": "MagLift · 30+ submissions"
   },
   {
    "place": "1st",
    "first": false,
    "title": "Dan black belt, Taekwondo",
    "sub": "Testing for 2nd Dan in December"
   }
  ]
 },
 "now": {
  "title": "Currently",
  "items": [
   {
    "title": "Quicksilver 604",
    "sub": "My school's robotics team. I also volunteer teaching LEGO robotics to elementary and middle schoolers."
   },
   {
    "title": "Synopsys Championship",
    "sub": "Structure-Borne Vibration Communication and Localization for In-Pipe Inspection Robots"
   },
   {
    "title": "Hackathon Club",
    "sub": "Co-founder and vice president. About 40 members; we teach students to build projects and win hackathons."
   },
   {
    "title": "Almaden Hacks",
    "href": "https://almadenhacks.com/",
    "sub": "Helping host this high school hackathon for software and hardware projects in San Jose."
   },
   {
    "title": "Speech & Debate",
    "sub": "Public forum and impromptu."
   }
  ]
 },
 "projects": {
  "index-cabinet": {
   "title": "Index",
   "rawTitle": "Index",
   "meta": "Solo · 1st Overall, Bay Valley Hacks",
   "images": [
    {
     "src": "images/index-1.jpg",
     "alt": "Index, a robotic cabinet with 15 compartments on a 3-axis gantry, next to the laptop running its voice agent"
    },
    {
     "src": "images/index-2.jpg",
     "alt": "Index from the side: the vertical rail, the cabinet and the ESP32 wiring on the base"
    },
    {
     "src": "images/index-3.jpg",
     "alt": "Day one of the build: the first rail, the trays and the parts laid out on a table"
    },
    {
     "src": "images/index-4.jpg",
     "alt": "Index wiring diagram: the Maker-ESP32 with the two steppers, servo, electromagnet and limit switches"
    }
   ],
   "body": [
    "A voice-controlled robotic cabinet. Ask for what you need, by voice or from your phone, and a 3-axis robot pulls the exact tray out of 15 compartments, brings it within reach, and puts it back when you're done. Made for people who can't easily reach, search or remember, for about $300 in parts.",
    "The AI voice agent can only act through verified commands: the page sends GO n, and the robot has to answer ACK n or the move is rejected. It only offers what's in stock and moves only after you say yes."
   ],
   "spec": [
    [
     "Controller",
     "Maker-ESP32 with its own Wi-Fi and phone page"
    ],
    [
     "Motion",
     "X and Z steppers on belts and linear rails; servo rack and pinion for depth"
    ],
    [
     "Gripper",
     "Electromagnet onto a steel washer in each 3D-printed tray"
    ],
    [
     "Voice",
     "ElevenLabs agent with three client tools"
    ]
   ],
   "out": [
    {
     "label": "GitHub ↗",
     "href": "https://github.com/vrun-systems26/IndeX"
    },
    {
     "label": "Live ↗",
     "href": "https://index-robot-cabinet.vercel.app"
    },
    {
     "label": "Demo ↗",
     "href": "https://youtu.be/VH-3CrXZQcE"
    }
   ]
  },
  "fetch": {
   "title": "Fetch",
   "rawTitle": "Fetch",
   "meta": "Co-founder · hardware lead · CSI Hacks",
   "images": [
    {
     "src": "images/fetch-1.jpg",
     "alt": "Fetch, a mecanum-drive robot with a trash-can body, on a tile floor"
    },
    {
     "src": "images/fetch-2.jpg",
     "alt": "Fetch, side angle showing the yellow mecanum wheels and wiring"
    },
    {
     "src": "images/fetch-3.jpg",
     "alt": "Fetch, front view with ultrasonic sensors and camera visible"
    }
   ],
   "body": [
    "A trash can that drives itself to whoever calls it, finding its way with AprilTags instead of lidar. Built in about 8 hours; I did the CAD, electronics and hardware."
   ],
   "spec": [
    [
     "Compute",
     "Pi 4 + Arduino Uno R4"
    ],
    [
     "Drive",
     "4× NEMA 17, mecanum"
    ],
    [
     "Navigation",
     "AprilTag + QR, ultrasonic e-stop"
    ]
   ],
   "out": [
    {
     "label": "GitHub ↗",
     "href": "https://github.com/vrun-systems26/Fetch-CSI-Hacks"
    },
    {
     "label": "Devpost ↗",
     "href": "https://devpost.com/varunchilukuri7"
    }
   ]
  },
  "ceres": {
   "title": "Ceres",
   "rawTitle": "Ceres",
   "meta": "Co-founder · hardware lead · Berkeley Robotics Hackathon",
   "images": [
    {
     "src": "images/ceres-1.jpg",
     "alt": "Ceres agriculture robot, four-wheel chassis with pan-tilt camera mount"
    },
    {
     "src": "images/ceres-2.jpg",
     "alt": "Ceres electronics close-up, servo turret, wiring, and motor driver board"
    },
    {
     "src": "images/ceres-3.jpg",
     "alt": "Ceres VLM leaf-detection screen with a bounding box around a diseased leaf"
    }
   ],
   "body": [
    "An affordable crop-scouting robot that spots diseased leaves with a VLM we trained, and probes the soil with a rack-and-pinion arm. Built in about 7 hours; I did the hardware."
   ],
   "spec": [
    [
     "Compute",
     "Pi 4 + Arduino Mega"
    ],
    [
     "Drive",
     "4WD, dual L298N"
    ],
    [
     "Sensing",
     "MG996R pan-tilt camera, STEMMA soil probe"
    ]
   ],
   "out": [
    {
     "label": "GitHub ↗",
     "href": "https://github.com/vrun-systems26/Ceres/tree/master"
    },
    {
     "label": "Demo ↗",
     "href": "https://www.youtube.com/watch?v=oX8thTSngGY"
    }
   ]
  },
  "sweeper": {
   "title": "Street Sweeper",
   "rawTitle": "Street Sweeper",
   "meta": "Team of 4 · hardware & electronics · Milpitas Hacks",
   "images": [
    {
     "src": "images/street-sweeper-1.jpg",
     "alt": "Street Sweeper robot with a phone mounted as its camera"
    },
    {
     "src": "images/street-sweeper-2.jpg",
     "alt": "Street Sweeper electronics close-up, ESP32 and wiring"
    },
    {
     "src": "images/street-sweeper-3.jpg",
     "alt": "Street Sweeper robot, front view of the two-wheel drivetrain"
    },
    {
     "src": "images/street-sweeper-ui.jpg",
     "alt": "Street Sweeper web app with Play, How to Play, and Leaderboard"
    }
   ],
   "body": [
    "A trash-collecting robot you drive by typing commands, so playing with it doubles as a coding lesson."
   ],
   "spec": [
    [
     "Compute",
     "ESP32"
    ],
    [
     "Drive",
     "L298N, two-wheel drive"
    ],
    [
     "Intake",
     "Camera-guided"
    ]
   ],
   "out": [
    {
     "label": "GitHub ↗",
     "href": "https://github.com/vrun-systems26/Street-Sweeper-Milpitas-Hacks"
    }
   ]
  },
  "arrival": {
   "title": "Arrival",
   "rawTitle": "Arrival",
   "meta": "Team of 30 · people & safety lead · Nebius × NVIDIA AI Hackathon",
   "images": [
    {
     "src": "images/arrival-1.jpg",
     "alt": "One iPhone scan of a kitchen drawn up as a floor plan, with the scan path"
    },
    {
     "src": "images/arrival-2.jpg",
     "alt": "The kitchen as a physics twin, every door and drawer a joint the simulator can move"
    }
   ],
   "body": [
    "One iPhone scan of a kitchen becomes a physics twin, a robot arm working around walking people, and a dataset NVIDIA GR00T trains on. Fine-tuned on it, GR00T passed 39 of 48 trials, up from 26. I stress-tested every room (288 of 288 runs, zero contacts with people), hunted down bugs and gaps, and recorded much of the demo video."
   ],
   "spec": [
    [
     "Led",
     "People & safety"
    ],
    [
     "Built",
     "RoboCasa layouts within 2.5 cm; 104 demos from 14 human ones"
    ],
    [
     "Fixed",
     "Walker contacts 3 → 0; Franka oven 12/14 → 14/14"
    ],
    [
     "Shipped",
     "41 of 418 merged PRs"
    ]
   ],
   "out": [
    {
     "label": "GitHub ↗",
     "href": "https://github.com/AvnehSBhatia/ExeaLabsNvidiaHacks"
    },
    {
     "label": "Live ↗",
     "href": "https://arrival.exealabs.org"
    },
    {
     "label": "Demo ↗",
     "href": "https://www.youtube.com/watch?v=EdZCukpGx00"
    }
   ]
  },
  "arm": {
   "title": "HocDiuTempusSumpsit",
   "rawTitle": "HocDiu<wbr>Tempus<wbr>Sumpsit",
   "meta": "Solo · Bluetooth robotic arm",
   "images": [
    {
     "src": "images/arm-2.jpg",
     "alt": "HocDiuTempusSumpsit robotic arm with its wireless remote"
    },
    {
     "src": "images/arm-1.jpg",
     "alt": "HocDiuTempusSumpsit gripper close-up, helical-gear fingers open"
    },
    {
     "src": "images/arm-3.jpg",
     "alt": "HocDiuTempusSumpsit arm extended, gripper and linkage visible"
    }
   ],
   "body": [
    "A 4-bar linkage arm with a three-finger helical-gear gripper. When the elbow couldn't hold the load, I reworked the joint geometry instead of buying a bigger servo."
   ],
   "spec": [
    [
     "Control",
     "2× ESP-WROOM-32 + PCA9685, BLE"
    ],
    [
     "Servos",
     "MG996R, SG90, A330"
    ]
   ],
   "out": [
    {
     "label": "GitHub ↗",
     "href": "https://github.com/vrun-systems26/Bluetooth-Robotic-Arm"
    }
   ]
  },
  "eclipse": {
   "title": "The Eclipse Lamp",
   "rawTitle": "The Eclipse Lamp",
   "meta": "Covert hardware",
   "images": [
    {
     "src": "images/eclipse-lamp-device.jpg",
     "alt": "The Eclipse Lamp internals, Raspberry Pi, gears, and 3D-printed shutter housing"
    },
    {
     "src": "images/eclipse-lamp-feed.jpg",
     "alt": "The Eclipse Lamp live feed and phone alerts showing person detection"
    }
   ],
   "body": [
    "Looks like a normal lamp. Inside, a motorized shutter and a sweeping camera spot people and alert your phone."
   ],
   "spec": [],
   "out": [
    {
     "label": "GitHub ↗",
     "href": "https://github.com/vrun-systems26/The-Eclipse-Lamp"
    }
   ]
  },
  "maglift": {
   "title": "MagLift",
   "rawTitle": "MagLift",
   "meta": "Solo · science fair",
   "images": [
    {
     "src": "images/maglift.jpg",
     "alt": "MagLift science fair board with the magnetic crane prototype"
    }
   ],
   "body": [
    "A magnetic crane prototype with joystick and touch-pad control. Designed, built and coded solo."
   ],
   "spec": [],
   "out": []
  },
  "mars": {
   "title": "MARS-61",
   "rawTitle": "MARS-61",
   "meta": "Concept · on hold",
   "images": [
    {
     "src": "images/mars61.jpg",
     "alt": "MARS-61 herringbone gear reduction next to its NEMA 17 drive motor"
    }
   ],
   "body": [
    "A heavy arm with a dual NEMA 17 shoulder and a custom 5:17 herringbone reduction. On hold, not forgotten."
   ],
   "spec": [],
   "out": []
  },
  "mouse": {
   "title": "Gaming Mouse",
   "rawTitle": "Gaming Mouse",
   "meta": "Built from scratch",
   "images": [
    {
     "src": "images/gaming-mouse.jpg",
     "alt": "Custom gaming mouse CAD model with a hex-vented shell"
    }
   ],
   "body": [
    "A mouse on a XIAO ESP32-S3 with an optical sensor, LiPo power, and arrow keys built into the shell."
   ],
   "spec": [],
   "out": [
    {
     "label": "GitHub ↗",
     "href": "https://github.com/vrun-systems26/Custom-Gaming-Mouse"
    }
   ]
  },
  "wattwatch": {
   "title": "WattWatch",
   "rawTitle": "WattWatch",
   "meta": "Non-invasive current sensing · ESP32",
   "images": [
    {
     "src": "images/wattwatch-1.jpg",
     "alt": "WattWatch PCB 3D render with the ESP32 module, current-sense, alarm and LED sections"
    },
    {
     "src": "images/wattwatch-2.jpg",
     "alt": "WattWatch block diagram: current clamp and motion sensor into the microcontroller, out to the alarm, display and WiFi alert"
    }
   ],
   "body": [
    "Clips onto an appliance's power cord, with no wiring cut, and checks the current it draws against whether anyone is in the room. Left on in an empty room, it sounds an alarm and sends a push to your phone."
   ],
   "spec": [
    [
     "Sensing",
     "SCT-013 current clamp, PIR motion"
    ],
    [
     "Compute",
     "ESP32, true-RMS sampling"
    ],
    [
     "Alerts",
     "Buzzer, OLED, WiFi push"
    ],
    [
     "Board",
     "KiCad schematic + PCB, ERC/DRC clean"
    ]
   ],
   "out": [
    {
     "label": "GitHub ↗",
     "href": "https://github.com/vrun-systems26/WattWatch"
    }
   ]
  },
  "dial": {
   "title": "Dial",
   "rawTitle": "Dial",
   "meta": "Voice payments on Mantle",
   "images": [
    {
     "src": "images/dial-1.jpg",
     "alt": "Dial home page: send money home with one phone call"
    },
    {
     "src": "images/dial-2.jpg",
     "alt": "The voice call: Dial confirms thirty-five dollars, takes the PIN, and locks the money on the blockchain"
    },
    {
     "src": "images/dial-3.jpg",
     "alt": "The relative's text in Spanish with the 6-digit collection code"
    },
    {
     "src": "images/dial-4.jpg",
     "alt": "The corner shop pays out 630 MXN after the code is entered, settled on-chain"
    }
   ],
   "body": [
    "Send money home by talking to a voice agent in your own language. The dollars lock on the Mantle blockchain in seconds, family picks up cash at a corner shop with a 6-digit code, and anything left uncollected is refunded automatically. No smartphone, bank or app needed on either side."
   ],
   "spec": [
    [
     "Voice",
     "ElevenLabs agent, Gemini 2.5 Flash"
    ],
    [
     "Chain",
     "Solidity checks contract on Mantle"
    ],
    [
     "Server",
     "Node + Express on Vercel"
    ]
   ],
   "out": [
    {
     "label": "GitHub ↗",
     "href": "https://github.com/vrun-systems26/Dial"
    },
    {
     "label": "Live ↗",
     "href": "https://dial-a-dollar.vercel.app"
    }
   ]
  },
  "recall": {
   "title": "Recall",
   "rawTitle": "Recall",
   "meta": "Solo · speech AI for early signs of dementia",
   "images": [
    {
     "src": "images/recall-1.jpg",
     "alt": "Recall's result for one check-in: a speech-change score and the markers outside the typical range"
    },
    {
     "src": "images/recall-2.jpg",
     "alt": "The daily check-in: three spoken questions and the recorded answer"
    },
    {
     "src": "images/recall-3.jpg",
     "alt": "One speaker's scores across interview clips from years before diagnosis"
    },
    {
     "src": "images/recall-4.jpg",
     "alt": "Average score rising from 10 to 15 years before diagnosis to after symptoms, above healthy speakers"
    }
   ],
   "body": [
    "A two-minute daily voice check-in for an aging parent. A friendly voice asks one question, the parent answers out loud, and Recall scores how they spoke: pauses, word-finding gaps, vague words, vocabulary. The family watches the trend over weeks and raises a lasting change with a doctor.",
    "The models that scored highest had learned the recordings, not the people, and failed a sanity check I built. I shipped the best model that passed. A prototype, not medical advice."
   ],
   "spec": [
    [
     "Data",
     "450 public interview clips, 215 people (DementiaNet)"
    ],
    [
     "Speech",
     "faster-whisper transcript, 17 speech markers"
    ],
    [
     "Model",
     "Knowledge-guided markers + MiniLM ensemble"
    ],
    [
     "Testing",
     "No speaker in both train and test; synthetic sanity check"
    ]
   ],
   "out": [
    {
     "label": "GitHub ↗",
     "href": "https://github.com/vrun-systems26/recall"
    }
   ],
   "dust": [
    "images/recall-1-dark.jpg",
    "images/recall-2-dark.jpg",
    "images/recall-3-dark.jpg",
    "images/recall-4-dark.jpg"
   ]
  }
 },
 "palette": {
  "index": {
   "ramp": [
    "#1b1c20",
    "#303238",
    "#555961",
    "#979ba4",
    "#eceef1"
   ],
   "accent": "#e4e6ea"
  },
  "builds": {
   "ramp": [
    "#241b40",
    "#46308a",
    "#7650dc",
    "#b095ff",
    "#ebe2ff"
   ],
   "accent": "#c2adff"
  },
  "now": {
   "ramp": [
    "#221d16",
    "#4a3f30",
    "#8a7a60",
    "#cbb994",
    "#f5ecd9"
   ],
   "accent": "#d9c7a0"
  },
  "awards": {
   "ramp": [
    "#33260a",
    "#735208",
    "#c68a0e",
    "#f0c444",
    "#fff1bd"
   ],
   "accent": "#f0c444"
  },
  "fetch": {
   "ramp": [
    "#0f2b20",
    "#15573a",
    "#1f9a60",
    "#5fd79a",
    "#d6f7e6"
   ],
   "accent": "#6fdca5"
  },
  "ceres": {
   "ramp": [
    "#232a0e",
    "#4a5d16",
    "#83a022",
    "#c2dc5c",
    "#eff7ca"
   ],
   "accent": "#c2dc5c"
  },
  "sweeper": {
   "ramp": [
    "#341b07",
    "#763b08",
    "#cd6f10",
    "#f6a84a",
    "#ffe4c2"
   ],
   "accent": "#f6a84a"
  },
  "arm": {
   "ramp": [
    "#34101f",
    "#761e4b",
    "#c63c84",
    "#f18dbf",
    "#ffdeee"
   ],
   "accent": "#f39bc7"
  },
  "eclipse": {
   "ramp": [
    "#151a39",
    "#262f76",
    "#4a57c6",
    "#8f9bf1",
    "#e0e4ff"
   ],
   "accent": "#a3adf5"
  },
  "maglift": {
   "ramp": [
    "#350e0c",
    "#7a1b15",
    "#d2362b",
    "#f48b81",
    "#ffdedb"
   ],
   "accent": "#f69a91"
  },
  "mars": {
   "ramp": [
    "#30170b",
    "#6b2e11",
    "#b5561f",
    "#e79b6c",
    "#fbe2d2"
   ],
   "accent": "#eba47a"
  },
  "mouse": {
   "ramp": [
    "#0a2b2d",
    "#0f5a5e",
    "#16a0a4",
    "#63d6d8",
    "#d4f6f6"
   ],
   "accent": "#6fdadc"
  },
  "arrival": {
   "ramp": [
    "#161b22",
    "#2a3442",
    "#4f6177",
    "#8fa3bb",
    "#dde6f0"
   ],
   "accent": "#a9bad0"
  },
  "dial": {
   "ramp": [
    "#2e1411",
    "#6b2b22",
    "#cf5a43",
    "#f59a86",
    "#ffe1d9"
   ],
   "accent": "#f6a592"
  },
  "wattwatch": {
   "ramp": [
    "#0b2233",
    "#124766",
    "#1f86b8",
    "#6cc6ee",
    "#dcf3ff"
   ],
   "accent": "#7ccdf0"
  },
  "software": {
   "ramp": [
    "#0e1636",
    "#1b2f73",
    "#2f5fd0",
    "#79a3ff",
    "#dfe8ff"
   ],
   "accent": "#8fb0ff"
  },
  "recall": {
   "ramp": [
    "#2a1230",
    "#5b2468",
    "#a54bbd",
    "#d995ea",
    "#f8e2fd"
   ],
   "accent": "#e6a7f0"
  },
  "index-cabinet": {
   "ramp": [
    "#0c2a27",
    "#13564f",
    "#1f9e90",
    "#6cdccd",
    "#d6f7f2"
   ],
   "accent": "#76e0d2"
  }
 },
 "software": {
  "title": "Software",
  "items": [
   {
    "to": "dial",
    "label": "Dial",
    "href": "#/software/dial"
   },
   {
    "to": "recall",
    "label": "Recall",
    "href": "#/software/recall"
   }
  ]
 }
};
