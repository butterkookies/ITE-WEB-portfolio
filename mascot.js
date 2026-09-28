/**
 * Dot Matrix Cat Mascot
 * An interactive, animated pixel/dot-matrix desktop-pet mascot for the portfolio.
 * 
 * Features:
 * - Real-time dot-matrix rasterization (discrete colored dots)
 * - CLIMBING & EXPLORING:
 *   * Can climb up screen edges (walls) and scramble up to high places
 *   * Can jump onto and perch on top of webpage elements (headers, folder cards, avatars, badges)
 *   * Scrolls alongside perched elements naturally
 *   * Double-click ANYWHERE on the page (even high up) and she runs & climbs right up to it!
 *   * Drag and drop her anywhere on the page to perch
 * - State machine: IDLE, WALK, RUN, CLIMB, PERCH, JUMP, POUNCE, PETTED, DRAGGED, SLEEP, STRETCH
 * - Interactive: click to pet, double-click to summon/climb, drag around, follows cursor
 * - Web Audio API synthesized purrs & meows (zero external dependencies)
 */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // Configuration & Settings
    // -------------------------------------------------------------------------
    const CONFIG = {
        gridStep: 5,        // Distance between dots (px)
        dotRadius: 2.15,    // Radius of each individual dot
        canvasWidth: 150,   // Canvas width (px)
        canvasHeight: 130,  // Canvas height (px)
        walkSpeed: 1.8,     // Speed when wandering
        runSpeed: 3.8,      // Speed when running
        climbSpeed: 2.4,    // Speed when scrambling/climbing vertically
        colors: {
            fur: '#1d4ed8',       // Royal Blue primary fur dots
            furLight: '#3b82f6',  // Light Royal Blue highlights / paws
            pink: '#f472b6',      // Ears, nose, blush cheeks, hearts
            eyeWhite: '#ffffff',  // Whites of eyes & highlights
            eyePupil: '#0f172a',  // Deep ink pupils / mouth
            whisker: '#93c5fd',   // Soft blue whiskers
            toyBall: '#fbbf24',   // Golden toy ball
        }
    };

    // -------------------------------------------------------------------------
    // Audio Synthesizer (Zero-dependency Web Audio API for cute cat sfx)
    // -------------------------------------------------------------------------
    class CatAudio {
        constructor() {
            this.ctx = null;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        // Cute soft kitten meow chirp
        meow() {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(480, now);
            osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);

            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.07, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.36);
        }

        // Gentle purr flutter
        purr() {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(75, now);

            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(26, now); // Purr vibration

            lfoGain.gain.setValueAtTime(18, now);
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            lfo.start(now);
            osc.start(now);
            lfo.stop(now + 0.6);
            osc.stop(now + 0.6);
        }
    }

    // -------------------------------------------------------------------------
    // Floating Hearts & Emote Particle System
    // -------------------------------------------------------------------------
    class Particle {
        constructor(x, y, type = 'heart') {
            this.x = x;
            this.y = y;
            this.type = type;
            this.vx = (Math.random() - 0.5) * 0.9;
            this.vy = -(Math.random() * 1.2 + 0.7);
            this.life = 1.0;
            this.decay = Math.random() * 0.015 + 0.015;
            this.size = Math.random() * 2 + 3.5;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
        }

        draw(ctx) {
            if (this.life <= 0) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life);

            if (this.type === 'heart') {
                ctx.fillStyle = CONFIG.colors.pink;
                ctx.beginPath();
                const s = this.size;
                ctx.moveTo(this.x, this.y);
                ctx.bezierCurveTo(this.x - s, this.y - s, this.x - s * 1.5, this.y + s * 0.5, this.x, this.y + s * 1.5);
                ctx.bezierCurveTo(this.x + s * 1.5, this.y + s * 0.5, this.x + s, this.y - s, this.x, this.y);
                ctx.fill();
            } else if (this.type === 'zzz') {
                ctx.fillStyle = '#a5b4fc';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText('Z', this.x, this.y);
            }
            ctx.restore();
        }
    }

    // -------------------------------------------------------------------------
    // Main Cat Mascot Engine
    // -------------------------------------------------------------------------
    class DotCatMascot {
        constructor() {
            this.audio = new CatAudio();
            this.state = 'IDLE'; // IDLE, WALK, RUN, CLIMB, PERCH, JUMP, POUNCE, PETTED, DRAGGED, SLEEP, STRETCH
            this.facing = 1;     // 1 = right, -1 = left

            // Position & motion on screen (viewport coordinates)
            this.posX = Math.max(30, (window.innerWidth || 1000) - 200);
            this.posY = Math.max(30, (window.innerHeight || 800) - CONFIG.canvasHeight - 12);
            this.targetX = this.posX;
            this.targetY = this.posY;

            // Element perching tracking (if sitting on a card or header)
            this.perchedElement = null;

            // Animation timers
            this.ticks = 0;
            this.stateTimer = 0;
            this.blinkTimer = 0;
            this.isBlinking = false;
            this.earTwitchTimer = 0;
            this.idleTime = 0;

            // Dragging
            this.isDragging = false;
            this.dragOffsetX = 0;
            this.dragOffsetY = 0;

            // Toy ball
            this.toy = {
                active: false,
                x: 0,
                y: 0,
            };

            this.particles = [];

            this.setupDOM();
            this.setupEvents();

            // Initial friendly greeting
            setTimeout(() => {
                this.say('Hi Andrei! 🐾 (Double-click anywhere & I will climb up!)', 3800);
            }, 800);

            this.loop = this.loop.bind(this);
            requestAnimationFrame(this.loop);
        }

        // Create canvas & UI container
        setupDOM() {
            this.container = document.createElement('div');
            this.container.id = 'dot-cat-mascot';
            this.container.setAttribute('aria-label', 'Interactive Cat Mascot');
            this.container.setAttribute('title', 'Click to pet, drag anywhere, or double-click anywhere to have me climb up!');
            this.container.style.cssText = `
                position: fixed;
                left: ${this.posX}px;
                top: ${this.posY}px;
                width: ${CONFIG.canvasWidth}px;
                height: ${CONFIG.canvasHeight}px;
                z-index: 99999;
                user-select: none;
                -webkit-user-drag: none;
                cursor: grab;
                touch-action: none;
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
            `;

            // Visible Dot Matrix Canvas
            this.visibleCanvas = document.createElement('canvas');
            this.visibleCanvas.width = CONFIG.canvasWidth;
            this.visibleCanvas.height = CONFIG.canvasHeight;
            this.visibleCanvas.style.display = 'block';
            this.visibleCtx = this.visibleCanvas.getContext('2d');

            // Offscreen Buffer Canvas (Raster source)
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCanvas.width = CONFIG.canvasWidth;
            this.offscreenCanvas.height = CONFIG.canvasHeight;
            this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

            // Speech/Emote bubble
            this.bubble = document.createElement('div');
            this.bubble.id = 'cat-emote-bubble';
            this.bubble.style.cssText = `
                position: absolute;
                top: -10px;
                left: 50%;
                transform: translate(-50%, -100%) scale(0);
                background: #ffffff;
                color: #312e81;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11.5px;
                font-weight: 700;
                padding: 5px 11px;
                border-radius: 14px;
                border: 1px solid #e0e7ff;
                box-shadow: 0 4px 14px rgba(79, 70, 229, 0.18);
                pointer-events: none;
                white-space: nowrap;
                transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;
                opacity: 0;
            `;
            this.bubble.textContent = '(=^･ω･^=)';

            const bubbleTail = document.createElement('div');
            bubbleTail.style.cssText = `
                position: absolute;
                bottom: -5px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 5px solid #ffffff;
            `;
            this.bubble.appendChild(bubbleTail);

            this.container.appendChild(this.bubble);
            this.container.appendChild(this.visibleCanvas);
            document.body.appendChild(this.container);
        }

        // Show brief emote or speech
        say(text, duration = 2400) {
            this.bubble.textContent = text;
            this.bubble.style.transform = 'translate(-50%, -100%) scale(1)';
            this.bubble.style.opacity = '1';

            if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
            this.bubbleTimeout = setTimeout(() => {
                this.bubble.style.transform = 'translate(-50%, -100%) scale(0)';
                this.bubble.style.opacity = '0';
            }, duration);
        }

        // Find candidate surfaces and ledges currently visible on the webpage
        findNearbyLedges() {
            const ledges = [];
            const vHeight = window.innerHeight;
            const vWidth = window.innerWidth;

            // 1. Bottom floor
            ledges.push({
                type: 'floor',
                element: null,
                x: 0,
                y: vHeight - CONFIG.canvasHeight - 12,
                width: vWidth
            });

            // 2. Query key webpage elements (navigation, cards, headings, profile avatar)
            const selectors = 'header, .folder-card, .hero-avatar, .skill-item, h2, .about-highlights, #contact';
            const candidates = document.querySelectorAll(selectors);

            candidates.forEach(el => {
                const rect = el.getBoundingClientRect();
                // Check if element is currently inside or touching the viewport
                if (rect.bottom > 80 && rect.top < vHeight - 80 && rect.width > 50) {
                    ledges.push({
                        type: 'element',
                        element: el,
                        x: Math.max(10, rect.left),
                        // Cat perches right on the top edge of the element
                        y: Math.max(10, rect.top - CONFIG.canvasHeight + 18),
                        width: rect.width
                    });
                }
            });

            return ledges;
        }

        // Event Listeners for Interaction
        setupEvents() {
            // Drag & Drop
            const onPointerDown = (e) => {
                this.isDragging = true;
                this.perchedElement = null;
                this.container.style.cursor = 'grabbing';
                this.dragOffsetX = e.clientX - this.posX;
                this.dragOffsetY = e.clientY - this.posY;
                this.changeState('DRAGGED');
                this.audio.meow();
                this.say('(=^･ω･^=) carrying me!', 1800);
                this.idleTime = 0;
            };

            const onPointerMove = (e) => {
                this.idleTime = 0;
                if (this.isDragging) {
                    this.posX = Math.max(0, Math.min(window.innerWidth - CONFIG.canvasWidth, e.clientX - this.dragOffsetX));
                    this.posY = Math.max(0, Math.min(window.innerHeight - CONFIG.canvasHeight, e.clientY - this.dragOffsetY));
                    this.container.style.left = `${this.posX}px`;
                    this.container.style.top = `${this.posY}px`;
                    this.targetX = this.posX;
                    this.targetY = this.posY;
                } else if (this.state === 'IDLE' || this.state === 'PERCH' || this.state === 'SLEEP') {
                    // Turn head toward mouse if nearby
                    const catCenterX = this.posX + CONFIG.canvasWidth / 2;
                    if (Math.abs(e.clientX - catCenterX) > 35) {
                        this.facing = e.clientX > catCenterX ? 1 : -1;
                    }
                }
            };

            const onPointerUp = () => {
                if (this.isDragging) {
                    this.isDragging = false;
                    this.container.style.cursor = 'grab';

                    // Check if dropped near a ledge / element or wall
                    const ledges = this.findNearbyLedges();
                    let bestLedge = null;
                    let minDist = 90;

                    ledges.forEach(l => {
                        const dy = Math.abs(this.posY - l.y);
                        const catMidX = this.posX + CONFIG.canvasWidth / 2;
                        const inRangeX = catMidX >= (l.x - 40) && catMidX <= (l.x + l.width + 40);
                        if (dy < minDist && inRangeX) {
                            bestLedge = l;
                            minDist = dy;
                        }
                    });

                    if (bestLedge && bestLedge.element) {
                        this.perchedElement = bestLedge.element;
                        this.targetY = bestLedge.y;
                        this.changeState('PERCH');
                        this.say('perched up here! ✨', 1800);
                        this.audio.purr();
                    } else if (this.posY < window.innerHeight - CONFIG.canvasHeight - 60) {
                        // High up in air - stay perched or on wall
                        this.perchedElement = null;
                        this.targetY = this.posY;
                        this.changeState('PERCH');
                        this.say('clinging up here! 🐾', 1800);
                    } else {
                        // Settle down to floor
                        this.perchedElement = null;
                        this.targetY = window.innerHeight - CONFIG.canvasHeight - 12;
                        this.changeState('IDLE');
                        this.say('landing! ✨', 1500);
                    }
                }
            };

            this.container.addEventListener('pointerdown', onPointerDown);
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);

            // Petting click on the cat
            this.container.addEventListener('click', () => {
                if (!this.isDragging) {
                    this.petCat();
                }
            });

            // Double click ANYWHERE on page: Cat runs & climbs straight up to that spot!
            document.addEventListener('dblclick', (e) => {
                if (this.container.contains(e.target)) return;

                this.idleTime = 0;
                this.perchedElement = null;

                const clickX = e.clientX;
                const clickY = e.clientY;

                this.targetX = Math.max(10, Math.min(window.innerWidth - CONFIG.canvasWidth - 10, clickX - CONFIG.canvasWidth / 2));
                this.targetY = Math.max(10, Math.min(window.innerHeight - CONFIG.canvasHeight - 10, clickY - CONFIG.canvasHeight + 25));

                this.facing = this.targetX > this.posX ? 1 : -1;
                this.changeState('RUN');
                this.audio.meow();

                if (clickY < this.posY - 60) {
                    this.say('climbing up to you! 🧗🐾', 1600);
                } else {
                    this.say('coming! 🐾', 1200);
                }

                this.toy.active = true;
            });

            // Track scroll: if perched on an element, keep moving WITH that element!
            window.addEventListener('scroll', () => {
                if (this.perchedElement && document.body.contains(this.perchedElement)) {
                    const rect = this.perchedElement.getBoundingClientRect();
                    // Follow the element position
                    this.targetY = Math.max(10, rect.top - CONFIG.canvasHeight + 18);

                    // If scrolled off-screen, leap off back to screen floor
                    if (rect.bottom < -40 || rect.top > window.innerHeight + 50) {
                        this.perchedElement = null;
                        this.targetY = window.innerHeight - CONFIG.canvasHeight - 12;
                        this.changeState('JUMP');
                        this.say('jumping down! 🐾', 1400);
                    }
                }
            }, { passive: true });

            // Keep cat on screen during resize
            window.addEventListener('resize', () => {
                if (!this.perchedElement) {
                    this.posY = Math.min(this.posY, window.innerHeight - CONFIG.canvasHeight - 12);
                    this.targetY = this.posY;
                }
                if (this.posX > window.innerWidth - CONFIG.canvasWidth) {
                    this.posX = window.innerWidth - CONFIG.canvasWidth - 10;
                    this.targetX = this.posX;
                }
            });
        }

        // Petting reaction
        petCat() {
            this.idleTime = 0;
            this.changeState('PETTED');
            this.audio.purr();

            // Emit hearts
            const catCenterX = CONFIG.canvasWidth / 2;
            for (let i = 0; i < 5; i++) {
                this.particles.push(new Particle(
                    catCenterX + (Math.random() - 0.5) * 40,
                    45 + (Math.random() - 0.5) * 20,
                    'heart'
                ));
            }

            const meows = ['purrrr~ 💖', 'meow! ^•ﻌ•^', 'nya~ ✨', '*purr purr*', 'mrrp! ❤️', 'pat pat~ 🌸'];
            this.say(meows[Math.floor(Math.random() * meows.length)]);
        }

        changeState(newState) {
            this.state = newState;
            this.stateTimer = 0;
        }

        // Update physics & autonomous AI behavior
        update() {
            this.ticks++;
            this.stateTimer++;
            this.idleTime++;

            // Blinking timer
            this.blinkTimer++;
            if (this.blinkTimer > 170 + Math.random() * 110) {
                this.isBlinking = true;
                if (this.blinkTimer > 185) {
                    this.isBlinking = false;
                    this.blinkTimer = 0;
                }
            }

            // Ear twitch timer
            this.earTwitchTimer++;

            // Autonomous Exploring & Climbing AI
            if (this.state === 'IDLE' || this.state === 'PERCH') {
                if (this.idleTime > 1600) {
                    this.changeState('SLEEP');
                    this.say('zZZ... 💤', 2500);
                } else if (this.stateTimer > 220 + Math.random() * 200) {
                    const choice = Math.random();

                    // Option A: Climb onto a webpage element or screen wall!
                    if (choice < 0.40) {
                        const ledges = this.findNearbyLedges().filter(l => l.type === 'element');
                        if (ledges.length > 0) {
                            // Pick a random visible element (card, header, avatar)
                            const targetLedge = ledges[Math.floor(Math.random() * ledges.length)];
                            this.perchedElement = targetLedge.element;
                            this.targetX = Math.max(10, Math.min(window.innerWidth - CONFIG.canvasWidth - 10, targetLedge.x + (targetLedge.width / 2) - CONFIG.canvasWidth / 2));
                            this.targetY = targetLedge.y;
                            this.facing = this.targetX > this.posX ? 1 : -1;
                            this.changeState('RUN');
                            this.say('climbing up there! 🧗✨', 1800);
                        } else {
                            // Climb left or right wall
                            this.targetX = Math.random() < 0.5 ? 5 : window.innerWidth - CONFIG.canvasWidth - 5;
                            this.targetY = Math.random() * (window.innerHeight - 300) + 60;
                            this.perchedElement = null;
                            this.facing = this.targetX > this.posX ? 1 : -1;
                            this.changeState('RUN');
                            this.say('wall climbing! 🧗🐾', 1800);
                        }
                    }
                    // Option B: If high up, jump down to floor
                    else if (choice < 0.65 && this.posY < window.innerHeight - CONFIG.canvasHeight - 80) {
                        this.perchedElement = null;
                        this.targetY = window.innerHeight - CONFIG.canvasHeight - 12;
                        this.targetX = Math.random() * (window.innerWidth - CONFIG.canvasWidth - 80) + 40;
                        this.changeState('JUMP');
                        this.say('hopping down! 🐾', 1400);
                    }
                    // Option C: Wander horizontally
                    else if (choice < 0.85) {
                        this.targetX = Math.random() * (window.innerWidth - CONFIG.canvasWidth - 80) + 40;
                        this.facing = this.targetX > this.posX ? 1 : -1;
                        this.changeState('WALK');
                    }
                    // Option D: Stretch
                    else {
                        this.changeState('STRETCH');
                    }
                }
            } else if (this.state === 'WALK') {
                const distX = this.targetX - this.posX;
                if (Math.abs(distX) < 5) {
                    this.posX = this.targetX;
                    this.changeState(this.posY < window.innerHeight - CONFIG.canvasHeight - 50 ? 'PERCH' : 'IDLE');
                } else {
                    this.posX += Math.sign(distX) * CONFIG.walkSpeed;
                    this.facing = Math.sign(distX);
                }
            } else if (this.state === 'RUN') {
                const distX = this.targetX - this.posX;
                const distY = this.targetY - this.posY;

                // Move horizontally first
                if (Math.abs(distX) > 12) {
                    this.posX += Math.sign(distX) * CONFIG.runSpeed;
                    this.facing = Math.sign(distX);
                }

                // If roughly aligned horizontally, scramble/climb vertically!
                if (Math.abs(distX) <= 25 && Math.abs(distY) > 15) {
                    this.changeState('CLIMB');
                } else if (Math.abs(distX) <= 12 && Math.abs(distY) <= 15) {
                    this.posX = this.targetX;
                    this.posY = this.targetY;
                    if (this.toy.active) {
                        this.changeState('POUNCE');
                        this.say('pounce! 🐾', 1200);
                        this.audio.meow();
                    } else {
                        this.changeState(this.posY < window.innerHeight - CONFIG.canvasHeight - 50 ? 'PERCH' : 'IDLE');
                    }
                }
            } else if (this.state === 'CLIMB') {
                // Vertical climbing animation towards targetY
                const distY = this.targetY - this.posY;
                const distX = this.targetX - this.posX;

                if (Math.abs(distX) > 4) {
                    this.posX += Math.sign(distX) * 1.2;
                }

                if (Math.abs(distY) < 6) {
                    this.posY = this.targetY;
                    this.toy.active = false;
                    this.changeState('PERCH');
                    this.say(this.posY < 120 ? 'top of the page! 👑' : 'climbed up! 🐾', 1800);
                    this.audio.purr();
                } else {
                    this.posY += Math.sign(distY) * CONFIG.climbSpeed;
                }
            } else if (this.state === 'JUMP') {
                // Smooth leap down to targetY
                const dy = this.targetY - this.posY;
                const dx = this.targetX - this.posX;
                this.posX += dx * 0.08;
                this.posY += dy * 0.12;

                if (Math.abs(dy) < 6) {
                    this.posY = this.targetY;
                    this.changeState('IDLE');
                    this.say('landed softly! ✨', 1400);
                }
            } else if (this.state === 'POUNCE') {
                if (this.stateTimer > 45) {
                    this.toy.active = false;
                    this.changeState(this.posY < window.innerHeight - CONFIG.canvasHeight - 50 ? 'PERCH' : 'IDLE');
                }
            } else if (this.state === 'PETTED') {
                if (this.stateTimer > 110) {
                    this.changeState(this.posY < window.innerHeight - CONFIG.canvasHeight - 50 ? 'PERCH' : 'IDLE');
                }
            } else if (this.state === 'STRETCH') {
                if (this.stateTimer > 70) {
                    this.changeState(this.posY < window.innerHeight - CONFIG.canvasHeight - 50 ? 'PERCH' : 'IDLE');
                }
            } else if (this.state === 'SLEEP') {
                // Emit zZZ particles periodically
                if (this.stateTimer % 90 === 0) {
                    this.particles.push(new Particle(
                        CONFIG.canvasWidth / 2 + (this.facing === 1 ? 16 : -16),
                        50,
                        'zzz'
                    ));
                }
            }

            // Sync with perched element top if currently resting on one
            if (this.perchedElement && document.body.contains(this.perchedElement) && !this.isDragging && this.state !== 'CLIMB' && this.state !== 'RUN') {
                const rect = this.perchedElement.getBoundingClientRect();
                this.targetY = Math.max(10, rect.top - CONFIG.canvasHeight + 18);
                this.posY += (this.targetY - this.posY) * 0.2;
            }

            // Sync DOM position
            this.container.style.left = `${Math.round(this.posX)}px`;
            this.container.style.top = `${Math.round(this.posY)}px`;

            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        // ---------------------------------------------------------------------
        // Character Drawing onto Hidden Offscreen Buffer
        // ---------------------------------------------------------------------
        drawOffscreenCat() {
            const ctx = this.offscreenCtx;
            const w = CONFIG.canvasWidth;
            const h = CONFIG.canvasHeight;
            ctx.clearRect(0, 0, w, h);

            ctx.save();

            // Grounding coordinate space
            const cx = w / 2;
            const cy = h - 25;

            ctx.translate(cx, cy);
            ctx.scale(this.facing, 1);

            const isSleeping = this.state === 'SLEEP';
            const isWalking = this.state === 'WALK' || this.state === 'RUN';
            const isClimbing = this.state === 'CLIMB';
            const isPerched = this.state === 'PERCH';
            const isPouncing = this.state === 'POUNCE';
            const isStretching = this.state === 'STRETCH';
            const isPetted = this.state === 'PETTED';
            const isDragged = this.state === 'DRAGGED';

            // Breathing / bobbing cycle
            const breath = Math.sin(this.ticks * 0.08) * (isSleeping ? 2.5 : 1.5);
            const walkBob = isWalking ? Math.abs(Math.sin(this.ticks * 0.28)) * 4 : 0;
            const walkStep = isWalking ? Math.sin(this.ticks * 0.28) * 8 : 0;
            const climbCycle = this.ticks * 0.35; // Scramble cycle when climbing

            // 1. TAIL (Animated S-curve or dangling down over ledge)
            ctx.save();
            const tailSpeed = isPetted ? 0.28 : (isPouncing ? 0.45 : 0.08);
            const tailAmp = isPetted ? 18 : (isPouncing ? 24 : 10);
            const tailSwing = Math.sin(this.ticks * tailSpeed) * tailAmp;

            ctx.strokeStyle = CONFIG.colors.fur;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath();
            if (isSleeping) {
                ctx.moveTo(-10, -5);
                ctx.quadraticCurveTo(15, -2, 22, -14);
            } else if (isClimbing) {
                // Tail hanging down behind while scrambling up
                ctx.moveTo(-4, -6);
                ctx.quadraticCurveTo(Math.sin(climbCycle) * 12, 12, Math.sin(climbCycle * 0.8) * 8, 26);
            } else if (isPerched) {
                // Tail dangles cutely over the ledge/card edge!
                ctx.moveTo(-14, -14);
                ctx.quadraticCurveTo(-22, 4, -16 + tailSwing * 0.6, 22);
            } else if (isPouncing) {
                ctx.moveTo(-20, -18);
                ctx.quadraticCurveTo(-38 + tailSwing, -35, -28, -50 + tailSwing);
            } else {
                ctx.moveTo(-16, -18 - breath + walkBob);
                ctx.quadraticCurveTo(-35, -35 + tailSwing, -30, -55 + tailSwing * 1.4);
            }
            ctx.stroke();
            ctx.restore();

            // 2. BACK PAWS / LEGS
            ctx.fillStyle = CONFIG.colors.fur;
            if (isClimbing) {
                // Scrabbling back paws against wall/surface
                ctx.beginPath();
                ctx.ellipse(-12, -4 + Math.sin(climbCycle) * 6, 6, 7, 0, 0, Math.PI * 2);
                ctx.ellipse(8, -4 - Math.sin(climbCycle) * 6, 6, 7, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (isWalking) {
                ctx.beginPath();
                ctx.ellipse(-14 - walkStep, -4, 7, 7, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (!isSleeping) {
                ctx.beginPath();
                ctx.ellipse(-14, -6, 9, 8, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // 3. BODY
            ctx.save();
            ctx.fillStyle = CONFIG.colors.fur;
            ctx.beginPath();
            if (isSleeping) {
                ctx.ellipse(0, -16 + breath, 28, 20, 0, 0, Math.PI * 2);
            } else if (isClimbing) {
                // Vertical stretched climbing torso
                ctx.ellipse(0, -28, 17, 26, 0.05, 0, Math.PI * 2);
            } else if (isStretching) {
                ctx.ellipse(-4, -18, 26, 17, 0.25, 0, Math.PI * 2);
            } else if (isPouncing) {
                ctx.ellipse(-6, -15, 27, 16, 0.1, 0, Math.PI * 2);
            } else if (isDragged) {
                ctx.ellipse(0, -32, 18, 30, 0, 0, Math.PI * 2);
            } else {
                ctx.ellipse(0, -26 - breath + walkBob, 20, 24, 0.05, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.restore();

            // 4. FRONT PAWS
            ctx.fillStyle = CONFIG.colors.furLight;
            if (isClimbing) {
                // Front paws reaching high up alternating in climbing motion!
                ctx.beginPath();
                ctx.ellipse(-10, -56 + Math.sin(climbCycle) * 8, 6, 7, 0, 0, Math.PI * 2);
                ctx.ellipse(12, -56 - Math.sin(climbCycle) * 8, 6, 7, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (isWalking) {
                ctx.beginPath();
                ctx.ellipse(12 + walkStep, -4, 7, 7, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (isPerched) {
                // Paws placed cleanly on front of ledge
                ctx.beginPath();
                ctx.ellipse(5, -2, 6, 6, 0, 0, Math.PI * 2);
                ctx.ellipse(16, -2, 6, 6, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (isStretching) {
                ctx.beginPath();
                ctx.ellipse(22, -4, 9, 6, 0.1, 0, Math.PI * 2);
                ctx.fill();
            } else if (!isSleeping) {
                ctx.beginPath();
                ctx.ellipse(6, -4, 6, 6, 0, 0, Math.PI * 2);
                ctx.ellipse(15, -4, 6, 6, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // 5. HEAD
            ctx.save();
            let headX = 14;
            let headY = -48 - breath + walkBob;

            if (isSleeping) {
                headX = 14;
                headY = -18 + breath;
            } else if (isClimbing) {
                headX = 4;
                headY = -54; // Head looks upward toward destination!
            } else if (isStretching) {
                headX = 18;
                headY = -28;
            } else if (isPouncing) {
                headX = 18;
                headY = -24;
            } else if (isDragged) {
                headX = 4;
                headY = -62;
            }

            ctx.translate(headX, headY);

            // Head circle
            ctx.fillStyle = CONFIG.colors.fur;
            ctx.beginPath();
            ctx.arc(0, 0, 19, 0, Math.PI * 2);
            ctx.fill();

            // EARS
            const earTwitch = (this.earTwitchTimer % 140 < 8) ? -3 : 0;

            // Left Ear
            ctx.beginPath();
            ctx.moveTo(-15, -12);
            ctx.lineTo(-12, -30 + earTwitch);
            ctx.lineTo(-2, -18);
            ctx.closePath();
            ctx.fillStyle = CONFIG.colors.fur;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-13, -13);
            ctx.lineTo(-11, -26 + earTwitch);
            ctx.lineTo(-4, -18);
            ctx.closePath();
            ctx.fillStyle = CONFIG.colors.pink;
            ctx.fill();

            // Right Ear
            ctx.beginPath();
            ctx.moveTo(3, -18);
            ctx.lineTo(13, -29);
            ctx.lineTo(16, -11);
            ctx.closePath();
            ctx.fillStyle = CONFIG.colors.fur;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(5, -18);
            ctx.lineTo(12, -26);
            ctx.lineTo(14, -12);
            ctx.closePath();
            ctx.fillStyle = CONFIG.colors.pink;
            ctx.fill();

            // FACE FEATURES
            // Pink Blush Cheeks
            ctx.fillStyle = CONFIG.colors.pink;
            ctx.beginPath();
            ctx.arc(-2, 5, 5, 0, Math.PI * 2);
            ctx.arc(14, 5, 5, 0, Math.PI * 2);
            ctx.fill();

            // Tiny Pink Nose
            ctx.beginPath();
            ctx.moveTo(6, 1);
            ctx.lineTo(8.5, 4);
            ctx.lineTo(4, 4);
            ctx.closePath();
            ctx.fill();

            // Cute :3 Cat Mouth
            ctx.strokeStyle = CONFIG.colors.eyePupil;
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.arc(4, 6, 2.5, 0, Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(8.5, 6, 2.5, 0, Math.PI);
            ctx.stroke();

            // EYES
            if (isSleeping || this.isBlinking) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.8;
                ctx.beginPath();
                ctx.arc(-2, -2, 4.5, 0.1, Math.PI - 0.1);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(11, -2, 4.5, 0.1, Math.PI - 0.1);
                ctx.stroke();
            } else if (isPetted || isPerched) {
                // Content / Happy crescent eyes (^ ^)
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.8;
                ctx.beginPath();
                ctx.arc(-2, 0, 4.5, Math.PI + 0.2, 0 - 0.2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(11, 0, 4.5, Math.PI + 0.2, 0 - 0.2);
                ctx.stroke();
            } else {
                // Bright shiny open eyes with pupils & specular highlights
                ctx.fillStyle = CONFIG.colors.eyeWhite;
                ctx.beginPath();
                ctx.arc(-2, -2, 5.5, 0, Math.PI * 2);
                ctx.arc(11, -2, 5.5, 0, Math.PI * 2);
                ctx.fill();

                // Pupil
                ctx.fillStyle = CONFIG.colors.eyePupil;
                ctx.beginPath();
                ctx.arc(-1, -2, 3.5, 0, Math.PI * 2);
                ctx.arc(12, -2, 3.5, 0, Math.PI * 2);
                ctx.fill();

                // Twinkle / Specular reflection
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-2.5, -3.5, 1.8, 0, Math.PI * 2);
                ctx.arc(10.5, -3.5, 1.8, 0, Math.PI * 2);
                ctx.fill();
            }

            // Whiskers
            ctx.strokeStyle = CONFIG.colors.whisker;
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(-11, 3);
            ctx.lineTo(-24, 0);
            ctx.moveTo(-11, 6);
            ctx.lineTo(-23, 7);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(14, 3);
            ctx.lineTo(26, 0);
            ctx.moveTo(14, 6);
            ctx.lineTo(25, 7);
            ctx.stroke();

            ctx.restore(); // End head
            ctx.restore(); // End cat transform

            // 6. DRAW TOY (if active)
            if (this.toy.active) {
                ctx.fillStyle = CONFIG.colors.toyBall;
                ctx.beginPath();
                ctx.arc(w / 2 + 45 * this.facing, h - 25, 9, 0, Math.PI * 2);
                ctx.fill();
            }

            // 7. DRAW PARTICLES (Hearts, ZzZ)
            this.particles.forEach(p => p.draw(ctx));
        }

        // ---------------------------------------------------------------------
        // Real-Time Dot Matrix Rasterization
        // ---------------------------------------------------------------------
        renderDotMatrix() {
            const w = CONFIG.canvasWidth;
            const h = CONFIG.canvasHeight;
            const step = CONFIG.gridStep;
            const radius = CONFIG.dotRadius;
            const halfStep = Math.floor(step / 2);

            const imgData = this.offscreenCtx.getImageData(0, 0, w, h).data;
            const ctx = this.visibleCtx;

            ctx.clearRect(0, 0, w, h);

            for (let y = halfStep; y < h; y += step) {
                for (let x = halfStep; x < w; x += step) {
                    const idx = (y * w + x) * 4;
                    const r = imgData[idx];
                    const g = imgData[idx + 1];
                    const b = imgData[idx + 2];
                    const a = imgData[idx + 3];

                    if (a > 60) {
                        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }

        // ---------------------------------------------------------------------
        // Main Animation Loop
        // ---------------------------------------------------------------------
        loop() {
            this.update();
            this.drawOffscreenCat();
            this.renderDotMatrix();
            requestAnimationFrame(this.loop);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new DotCatMascot());
    } else {
        new DotCatMascot();
    }

})();
