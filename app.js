# BUK - Enhanced Open World Adventure (app.js)

Here's a massively upgraded version of your game with cutting-edge graphics, deep RPG systems, and an expansive open world:

```javascript
// BUK - Enhanced Open World RPG
// Main Game Class
class BUKGame {
    constructor() {
        // Core Three.js elements
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.mixer = null;
        
        // Game systems
        this.world = null;
        this.player = null;
        this.npcs = [];
        this.enemies = [];
        this.quests = [];
        this.items = [];
        this.buildings = [];
        this.weatherSystem = null;
        this.dayNightCycle = null;
        this.physics = null;
        this.audio = null;
        this.ui = null;
        this.dialogueSystem = null;
        this.craftingSystem = null;
        this.skillSystem = null;
        
        // Game state
        this.gameState = {
            health: 100,
            maxHealth: 100,
            stamina: 100,
            maxStamina: 100,
            mana: 100,
            maxMana: 100,
            level: 1,
            experience: 0,
            skillPoints: 0,
            inventory: [],
            equipped: {
                weapon: null,
                armor: null,
                accessory: null
            },
            discoveredLocations: [],
            completedQuests: [],
            activeQuests: [],
            gameTime: 0, // In-game minutes
            difficulty: 'normal',
            playerClass: null,
            faction: null,
            reputation: {},
            settings: {
                graphics: 'high',
                controls: 'keyboard+mouse',
                audio: 0.7
            }
        };
        
        // Input system
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            down: false,
            rightDown: false
        };
        this.gamepad = null;
        
        // Performance tracking
        this.stats = null;
        this.debugMode = false;
        
        // Initialize the game
        this.init();
    }
    
    async init() {
        // Setup core systems
        await this.setupGraphics();
        this.setupAudio();
        this.setupPhysics();
        this.setupInput();
        this.setupUI();
        
        // Load assets
        await this.loadAssets();
        
        // Initialize game systems
        this.setupWorld();
        this.setupPlayer();
        this.setupNPCs();
        this.setupQuests();
        this.setupItems();
        this.setupWeather();
        this.setupDayNightCycle();
        this.setupCrafting();
        this.setupSkills();
        
        // Start the game
        this.showMainMenu();
    }
    
    // Core Systems Setup
    async setupGraphics() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.0005);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 50, 100);
        
        // Create renderer with advanced features
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        // Add post-processing effects
        this.setupPostProcessing();
        
        // Add performance stats
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
        document.body.appendChild(this.stats.dom);
        this.stats.dom.style.display = 'none';
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupPostProcessing() {
        // Create render target
        const renderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth, 
            window.innerHeight, 
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                encoding: THREE.sRGBEncoding
            }
        );
        
        // Post-processing pipeline
        this.composer = new EffectComposer(this.renderer, renderTarget);
        
        // Add passes
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Add effects
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, 0.4, 0.85
        );
        bloomPass.threshold = 0;
        bloomPass.strength = 1.5;
        bloomPass.radius = 0.5;
        this.composer.addPass(bloomPass);
        
        const ssaoPass = new SSAOPass(
            this.scene,
            this.camera,
            window.innerWidth,
            window.innerHeight
        );
        ssaoPass.kernelRadius = 16;
        ssaoPass.minDistance = 0.005;
        ssaoPass.maxDistance = 0.1;
        this.composer.addPass(ssaoPass);
        
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }
    
    setupAudio() {
        this.audio = {
            listener: new THREE.AudioListener(),
            bgm: new THREE.Audio(this.audio.listener),
            sfx: {
                attack: new THREE.Audio(this.audio.listener),
                damage: new THREE.Audio(this.audio.listener),
                heal: new THREE.Audio(this.audio.listener),
                levelUp: new THREE.Audio(this.audio.listener),
                questComplete: new THREE.Audio(this.audio.listener),
                ambient: new THREE.Audio(this.audio.listener)
            },
            positionals: []
        };
        
        this.camera.add(this.audio.listener);
        
        // Load audio files (placeholder - would be replaced with actual loading)
        this.audio.bgm.setBuffer(new THREE.AudioBuffer());
        this.audio.sfx.attack.setBuffer(new THREE.AudioBuffer());
        // ... load other sounds
    }
    
    setupPhysics() {
        // Initialize physics world
        this.physics = {
            world: new CANNON.World(),
            bodies: [],
            materials: {},
            contacts: []
        };
        
        this.physics.world.gravity.set(0, -9.82, 0);
        this.physics.world.broadphase = new CANNON.NaiveBroadphase();
        this.physics.world.solver.iterations = 10;
        
        // Create default materials
        this.physics.materials.default = new CANNON.Material("default");
        this.physics.materials.ground = new CANNON.Material("ground");
        this.physics.materials.character = new CANNON.Material("character");
        
        // Create contact materials
        const defaultContact = new CANNON.ContactMaterial(
            this.physics.materials.default,
            this.physics.materials.default,
            { friction: 0.3, restitution: 0.3 }
        );
        this.physics.world.addContactMaterial(defaultContact);
        
        const groundCharacterContact = new CANNON.ContactMaterial(
            this.physics.materials.ground,
            this.physics.materials.character,
            { friction: 0.5, restitution: 0.0 }
        );
        this.physics.world.addContactMaterial(groundCharacterContact);
    }
    
    setupInput() {
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Toggle debug mode
            if (e.code === 'F3') {
                this.toggleDebugMode();
            }
            
            // Pause game
            if (e.code === 'Escape') {
                this.togglePause();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse input
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.down = true;
            if (e.button === 2) this.mouse.rightDown = true;
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.down = false;
            if (e.button === 2) this.mouse.rightDown = false;
        });
        
        // Gamepad input
        window.addEventListener("gamepadconnected", (e) => {
            this.gamepad = e.gamepad;
        });
        
        window.addEventListener("gamepaddisconnected", (e) => {
            if (this.gamepad && this.gamepad.index === e.gamepad.index) {
                this.gamepad = null;
            }
        });
        
        // Prevent context menu
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    setupUI() {
        // Create UI manager
        this.ui = new UIManager();
        
        // Setup main menu
        this.ui.createMainMenu({
            newGame: () => this.startNewGame(),
            continueGame: () => this.loadGame(),
            settings: () => this.openSettings(),
            credits: () => this.showCredits(),
            exit: () => window.close()
        });
        
        // Setup HUD
        this.ui.createHUD({
            health: this.gameState.health,
            maxHealth: this.gameState.maxHealth,
            stamina: this.gameState.stamina,
            maxStamina: this.gameState.maxStamina,
            mana: this.gameState.mana,
            maxMana: this.gameState.maxMana,
            level: this.gameState.level,
            experience: this.gameState.experience,
            inventory: this.gameState.inventory,
            equipped: this.gameState.equipped,
            activeQuests: this.gameState.activeQuests
        });
        
        // Setup dialogue system
        this.dialogueSystem = new DialogueSystem(this.ui);
    }
    
    // Asset Loading
    async loadAssets() {
        // Create loading manager
        const loadingManager = new THREE.LoadingManager();
        
        // Show loading screen
        this.ui.showLoadingScreen();
        
        // Setup progress tracking
        loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            this.ui.updateLoadingProgress(progress);
        };
        
        // When all assets are loaded
        loadingManager.onLoad = () => {
            this.ui.hideLoadingScreen();
        };
        
        // Texture loader
        const textureLoader = new THREE.TextureLoader(loadingManager);
        
        // GLTF loader for 3D models
        const gltfLoader = new GLTFLoader(loadingManager);
        
        // Audio loader
        const audioLoader = new THREE.AudioLoader(loadingManager);
        
        // Load all game assets
        try {
            // Load textures
            const textures = await this.loadTextures(textureLoader);
            
            // Load 3D models
            const models = await this.loadModels(gltfLoader);
            
            // Load audio files
            const sounds = await this.loadAudio(audioLoader);
            
            // Store loaded assets
            this.assets = {
                textures,
                models,
                sounds
            };
        } catch (error) {
            console.error("Failed to load assets:", error);
            this.ui.showErrorMessage("Failed to load game assets. Please try refreshing the page.");
        }
    }
    
    async loadTextures(loader) {
        // Load all game textures
        const textures = {};
        
        // Environment textures
        textures.skybox = await loader.loadAsync('assets/textures/skybox.jpg');
        textures.terrain = await loader.loadAsync('assets/textures/terrain.jpg');
        textures.terrainNormal = await loader.loadAsync('assets/textures/terrain_normal.jpg');
        
        // Character textures
        textures.player = await loader.loadAsync('assets/textures/player.png');
        textures.npc = await loader.loadAsync('assets/textures/npc.png');
        
        // Item textures
        textures.weapons = await loader.loadAsync('assets/textures/weapons.png');
        textures.armor = await loader.loadAsync('assets/textures/armor.png');
        
        return textures;
    }
    
    async loadModels(loader) {
        // Load all 3D models
        const models = {};
        
        // Environment models
        models.terrain = await loader.loadAsync('assets/models/terrain.glb');
        models.trees = await loader.loadAsync('assets/models/trees.glb');
        models.buildings = await loader.loadAsync('assets/models/buildings.glb');
        
        // Character models
        models.player = await loader.loadAsync('assets/models/player.glb');
        models.npc = await loader.loadAsync('assets/models/npc.glb');
        models.enemies = await loader.loadAsync('assets/models/enemies.glb');
        
        // Item models
        models.weapons = await loader.loadAsync('assets/models/weapons.glb');
        models.items = await loader.loadAsync('assets/models/items.glb');
        
        return models;
    }
    
    async loadAudio(loader) {
        // Load all audio files
        const sounds = {};
        
        // Background music
        sounds.bgm = await loader.loadAsync('assets/audio/bgm.mp3');
        
        // Sound effects
        sounds.sfx = {
            attack: await loader.loadAsync('assets/audio/sfx/attack.mp3'),
            damage: await loader.loadAsync('assets/audio/sfx/damage.mp3'),
            heal: await loader.loadAsync('assets/audio/sfx/heal.mp3'),
            levelUp: await loader.loadAsync('assets/audio/sfx/level_up.mp3'),
            questComplete: await loader.loadAsync('assets/audio/sfx/quest_complete.mp3')
        };
        
        return sounds;
    }
    
    // Game Systems
    setupWorld() {
        // Create the game world
        this.world = new WorldGenerator({
            size: 10000, // 10km x 10km world
            biomes: ['forest', 'mountains', 'desert', 'swamp', 'tundra'],
            terrainDetail: 128,
            seed: 12345
        });
        
        // Generate terrain
        const terrain = this.world.generateTerrain();
        this.scene.add(terrain.mesh);
        this.physics.world.addBody(terrain.body);
        
        // Generate vegetation
        const vegetation = this.world.generateVegetation();
        vegetation.forEach(obj => {
            this.scene.add(obj.mesh);
            if (obj.body) this.physics.world.addBody(obj.body);
        });
        
        // Generate water bodies
        const water = this.world.generateWater();
        this.scene.add(water.mesh);
        
        // Generate points of interest
        const poi = this.world.generatePointsOfInterest();
        poi.forEach(location => {
            this.scene.add(location.mesh);
            if (location.body) this.physics.world.addBody(location.body);
            this.gameState.discoveredLocations.push({
                id: location.id,
                name: location.name,
                discovered: false,
                position: location.position
            });
        });
        
        // Add skybox
        const skybox = this.createSkybox();
        this.scene.add(skybox);
        
        // Add ambient lighting
        this.setupLighting();
    }
    
    createSkybox() {
        // Create skybox with dynamic weather effects
        const skyboxGeometry = new THREE.SphereGeometry(5000, 64, 64);
        const skyboxMaterial = new THREE.MeshBasicMaterial({
            map: this.assets.textures.skybox,
            side: THREE.BackSide,
            fog: false
        });
        
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        return skybox;
    }
    
    setupLighting() {
        // Main directional light (sun)
        this.sun = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sun.position.set(100, 100, 100);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.width = 4096;
        this.sun.shadow.mapSize.height = 4096;
        this.sun.shadow.camera.near = 0.5;
        this.sun.shadow.camera.far = 500;
        this.sun.shadow.camera.left = -100;
        this.sun.shadow.camera.right = 100;
        this.sun.shadow.camera.top = 100;
        this.sun.shadow.camera.bottom = -100;
        this.scene.add(this.sun);
        
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(this.ambientLight);
        
        // Hemisphere light for more natural outdoor lighting
        this.hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
        this.scene.add(this.hemisphereLight);
        
        // Add god rays effect
        this.godRays = new VolumetricLight(this.sun);
        this.scene.add(this.godRays.mesh);
    }
    
    setupPlayer() {
        // Create player character
        this.player = new PlayerCharacter({
            model: this.assets.models.player,
            position: new THREE.Vector3(0, 50, 0),
            camera: this.camera,
            physicsWorld: this.physics.world
        });
        
        // Add player to scene
        this.scene.add(this.player.mesh);
        this.physics.world.addBody(this.player.body);
        
        // Set up player controls
        this.playerControls = new PlayerControls({
            player: this.player,
            camera: this.camera,
            domElement: this.renderer.domElement
        });
        
        // Set up player stats
        this.playerStats = new CharacterStats({
            health: this.gameState.health,
            stamina: this.gameState.stamina,
            mana: this.gameState.mana,
            level: this.gameState.level,
            experience: this.gameState.experience
        });
        
        // Set up player inventory
        this.playerInventory = new InventorySystem({
            maxSlots: 20,
            items: this.gameState.inventory
        });
        
        // Set up player equipment
        this.playerEquipment = new EquipmentSystem({
            weapon: this.gameState.equipped.weapon,
            armor: this.gameState.equipped.armor,
            accessory: this.gameState.equipped.accessory
        });
        
        // Set up player skills
        this.playerSkills = new SkillSystem({
            availableSkills: this.skillSystem.skills,
            skillPoints: this.gameState.skillPoints
        });
    }
    
    setupNPCs() {
        // Create NPCs
        const npcCount = 50;
        
        for (let i = 0; i < npcCount; i++) {
            const npc = new NPC({
                model: this.assets.models.npc,
                position: this.getRandomSpawnPoint(),
                type: this.getRandomNPCType(),
                faction: this.getRandomFaction(),
                aiProfile: this.getRandomAIProfile()
            });
            
            this.scene.add(npc.mesh);
            this.physics.world.addBody(npc.body);
            this.npcs.push(npc);
        }
        
        // Create quest givers
        const questGivers = [
            { id: 'elder', name: 'Village Elder', position: new THREE.Vector3(100, 0, 50) },
            { id: 'blacksmith', name: 'Blacksmith', position: new THREE.Vector3(120, 0, 60) },
            { id: 'mage', name: 'Arcane Mage', position: new THREE.Vector3(-80, 0, 30) }
        ];
        
        questGivers.forEach(qg => {
            const npc = new NPC({
                model: this.assets.models.npc,
                position: qg.position,
                type: 'quest_giver',
                faction: 'neutral',
                aiProfile: 'stationary',
                id: qg.id,
                name: qg.name
            });
            
            this.scene.add(npc.mesh);
            this.physics.world.addBody(npc.body);
            this.npcs.push(npc);
        });
    }
    
    setupEnemies() {
        // Create enemies based on biome and level
        const enemyCount = 200;
        
        for (let i = 0; i < enemyCount; i++) {
            const enemyType = this.getRandomEnemyType();
            const enemy = new Enemy({
                model: this.assets.models.enemies,
                position: this.getRandomSpawnPoint(),
                type: enemyType,
                level: this.getEnemyLevel(enemyType),
                faction: 'enemy',
                aiProfile: this.getEnemyAIProfile(enemyType)
            });
            
            this.scene.add(enemy.mesh);
            this.physics.world.addBody(enemy.body);
            this.enemies.push(enemy);
        }
        
        // Create bosses
        const bosses = [
            { id: 'dragon', name: 'Ancient Dragon', position: new THREE.Vector3(500, 100, 500) },
            { id: 'lich', name: 'Lich King', position: new THREE.Vector3(-300, 0, -400) }
        ];
        
        bosses.forEach(boss => {
            const enemy = new Enemy({
                model: this.assets.models.enemies,
                position: boss.position,
                type: 'boss',
                level: this.gameState.level + 10,
                faction: 'enemy',
                aiProfile: 'boss',
                id: boss.id,
                name: boss.name
            });
            
            this.scene.add(enemy.mesh);
            this.physics.world.addBody(enemy.body);
            this.enemies.push(enemy);
        });
    }
    
    setupQuests() {
        // Main story quests
        this.quests.push(
            new Quest({
                id: 'main_1',
                title: 'Awakening',
                description: 'You wake up in a strange land with no memory of how you got here.',
                objectives: [
                    { id: 'explore', description: 'Explore the area', completed: false },
                    { id: 'find_village', description: 'Find the nearby village', completed: false }
                ],
                rewards: { experience: 100, items: ['basic_sword'] },
                isMainQuest: true
            }),
            new Quest({
                id: 'main_2',
                title: 'The Elder\'s Request',
                description: 'The village elder needs your help with a mysterious problem.',
                objectives: [
                    { id: 'talk_to_elder', description: 'Speak with the village elder', completed: false },
                    { id: 'investigate', description: 'Investigate the strange occurrences', completed: false }
                ],
                rewards: { experience: 250, gold: 50 },
                isMainQuest: true,
                requiredQuest: 'main_1'
            })
        );
        
        // Side quests
        this.quests.push(
            new Quest({
                id: 'side_1',
                title: 'Blacksmith\'s Dilemma',
                description: 'The blacksmith needs rare materials to craft a special weapon.',
                objectives: [
                    { id: 'gather_materials', description: 'Gather 5 iron ores', completed: false, current: 0, target: 5 },
                    { id: 'return_to_blacksmith', description: 'Return to the blacksmith', completed: false }
                ],
                rewards: { experience: 150, gold: 30, items: ['iron_sword'] },
                isMainQuest: false
            }),
            new Quest({
                id: 'side_2',
                title: 'Hunting Practice',
                description: 'The village hunter wants you to prove your skills.',
                objectives: [
                    { id: 'kill_wolves', description: 'Kill 3 forest wolves', completed: false, current: 0, target: 3 },
                    { id: 'return_to_hunter', description: 'Return to the hunter', completed: false }
                ],
                rewards: { experience: 200, gold: 40 },
                isMainQuest: false
            })
        );
        
        // Add quests to game state
        this.quests.forEach(quest => {
            if (quest.isMainQuest && quest.requiredQuest === undefined) {
                this.gameState.activeQuests.push(quest.id);
            }
        });
    }
    
    setupItems() {
        // Weapons
        this.items.push(
            new Item({
                id: 'basic_sword',
                name: 'Basic Sword',
                type: 'weapon',
                subtype: 'sword',
                damage: 15,
                speed: 1.0,
                rarity: 'common',
                value: 50,
                model: this.assets.models.weapons,
                texture: this.assets.textures.weapons
            }),
            new Item({
                id: 'iron_sword',
                name: 'Iron Sword',
                type: 'weapon',
                subtype: 'sword',
                damage: 25,
                speed: 0.9,
                rarity: 'uncommon',
                value: 120,
                model: this.assets.models.weapons,
                texture: this.assets.textures.weapons
            })
        );
        
        // Armor
        this.items.push(
            new Item({
                id: 'leather_armor',
                name: 'Leather Armor',
                type: 'armor',
                subtype: 'chest',
                defense: 10,
                weight: 5,
                rarity: 'common',
                value: 80,
                model: this.assets.models.items,
                texture: this.assets.textures.armor
            })
        );
        
        // Consumables
        this.items.push(
            new Item({
                id: 'health_potion',
                name: 'Health Potion',
                type: 'consumable',
                subtype: 'potion',
                effect: { health: 50 },
                stackable: true,
                rarity: 'common',
                value: 20,
                model: this.assets.models.items,
                texture: this.assets.textures.items
            })
        );
        
        // Quest items
        this.items.push(
            new Item({
                id: 'ancient_artifact',
                name: 'Ancient Artifact',
                type: 'quest',
                description: 'A mysterious artifact with unknown powers.',
                rarity: 'legendary',
                value: 0,
                model: this.assets.models.items,
                texture: this.assets.textures.items
            })
        );
    }
    
    setupWeather() {
        this.weatherSystem = new WeatherSystem({
            scene: this.scene,
            player: this.player,
            types: ['clear', 'rain', 'snow', 'sandstorm', 'fog'],
            intensity: 0.5,
            changeInterval: 300 // seconds
        });
    }
    
    setupDayNightCycle() {
        this.dayNightCycle = new DayNightCycle({
            duration: 1200, // seconds for full cycle
            startTime: 8, // 8 AM
            sun: this.sun,
            ambientLight: this.ambientLight,
            hemisphereLight: this.hemisphereLight
        });
    }
    
    setupCrafting() {
        this.craftingSystem = new CraftingSystem({
            recipes: [
                {
                    id: 'iron_sword',
                    name: 'Iron Sword',
                    ingredients: [
                        { id: 'iron_ore', quantity: 5 },
                        { id: 'wood', quantity: 2 }
                    ],
                    result: { id: 'iron_sword', quantity: 1 },
                    skillRequired: 'blacksmithing',
                    levelRequired: 2
                },
                {
                    id: 'health_potion',
                    name: 'Health Potion',
                    ingredients: [
                        { id: 'herb', quantity: 3 },
                        { id: 'water', quantity: 1 }
                    ],
                    result: { id: 'health_potion', quantity: 2 },
                    skillRequired: 'alchemy',
                    levelRequired: 1
                }
            ]
        });
    }
    
    setupSkills() {
        this.skillSystem = new SkillSystem({
            skills: [
                {
                    id: 'swords',
                    name: 'Swords',
                    description: 'Increases damage with sword weapons',
                    maxLevel: 10,
                    currentLevel: 0,
                    effects: [
                        { level: 1, effect: '5% increased sword damage' },
                        { level: 5, effect: '10% increased sword damage' },
                        { level: 10, effect: '20% increased sword damage' }
                    ]
                },
                {
                    id: 'blacksmithing',
                    name: 'Blacksmithing',
                    description: 'Allows crafting of metal weapons and armor',
                    maxLevel: 10,
                    currentLevel: 0,
                    effects: [
                        { level: 1, effect: 'Can craft basic metal items' },
                        { level: 5, effect: 'Can craft advanced metal items' },
                        { level: 10, effect: 'Can craft masterwork metal items' }
                    ]
                },
                {
                    id: 'archery',
                    name: 'Archery',
                    description: 'Increases damage with bow weapons',
                    maxLevel: 10,
                    currentLevel: 0,
                    effects: [
                        { level: 1, effect: '5% increased bow damage' },
                        { level: 5, effect: '10% increased bow damage' },
                        { level: 10, effect: '20% increased bow damage' }
                    ]
                }
            ]
        });
    }
    
    // Game State Management
    startNewGame() {
        // Hide main menu
        this.ui.hideMainMenu();
        
        // Show character creation
        this.ui.showCharacterCreation({
            races: ['human', 'elf', 'dwarf', 'orc'],
            classes: ['warrior', 'mage', 'ranger', 'rogue'],
            onComplete: (character) => {
                this.gameState.playerClass = character.class;
                this.gameState.faction = character.race === 'orc' ? 'horde' : 'alliance';
                
                // Start the game
                this.beginGameplay();
            }
        });
    }
    
    loadGame() {
        // Try to load saved game
        try {
            const savedGame = localStorage.getItem('buk_save');
            if (savedGame) {
                this.gameState = JSON.parse(savedGame);
                this.beginGameplay();
            } else {
                this.ui.showNotification('No saved game found');
            }
        } catch (error) {
            console.error('Failed to load game:', error);
            this.ui.showErrorMessage('Failed to load saved game');
        }
    }
    
    saveGame() {
        try {
            // Update game state with current values
            this.gameState.health = this.playerStats.health;
            this.gameState.maxHealth = this.playerStats.maxHealth;
            this.gameState.stamina = this.playerStats.stamina;
            this.gameState.maxStamina = this.playerStats.maxStamina;
            this.gameState.mana = this.playerStats.mana;
            this.gameState.maxMana = this.playerStats.maxMana;
            this.gameState.level = this.playerStats.level;
            this.gameState.experience = this.playerStats.experience;
            this.gameState.skillPoints = this.playerSkills.skillPoints;
            this.gameState.inventory = this.playerInventory.items;
            this.gameState.equipped = this.playerEquipment.currentEquipment;
            this.gameState.gameTime = this.dayNightCycle.currentTime;
            
            // Save to localStorage
            localStorage.setItem('buk_save', JSON.stringify(this.gameState));
            this.ui.showNotification('Game saved successfully');
        } catch (error) {
            console.error('Failed to save game:', error);
            this.ui.showErrorMessage('Failed to save game');
        }
    }
    
    beginGameplay() {
        // Setup player after character creation
        this.setupPlayer();
        this.setupEnemies();
        
        // Start game systems
        this.dayNightCycle.start();
        this.weatherSystem.start();
        
        // Play background music
        this.audio.bgm.setBuffer(this.assets.sounds.bgm);
        this.audio.bgm.setLoop(true);
        this.audio.bgm.setVolume(0.5);
        this.audio.bgm.play();
        
        // Show initial quest
        this.ui.showQuestStart(this.quests[0]);
        
        // Start game loop
        this.gameLoop();
    }
    
    // Game Loop
    gameLoop() {
        // Update performance stats
        this.stats.begin();
        
        // Get delta time
        const delta = this.clock.getDelta();
        
        // Update game systems
        if (!this.isPaused) {
            this.updatePlayer(delta);
            this.updateNPCs(delta);
            this.updateEnemies(delta);
            this.updatePhysics(delta);
            this.updateWorld(delta);
            this.updateUI();
            
            // Update post-processing
            this.composer.render(delta);
        } else {
            // Still render the scene when paused (but don't update)
            this.renderer.render(this.scene, this.camera);
        }
        
        // End performance stats
        this.stats.end();
        
        // Continue the loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updatePlayer(delta) {
        // Update player controls
        this.playerControls.update(delta);
        
        // Update player stats
        this.playerStats.update(delta);
        
        // Handle player input
        this.handlePlayerInput();
        
        // Check for player death
        if (this.playerStats.health <= 0) {
            this.handlePlayerDeath();
        }
    }
    
    updateNPCs(delta) {
        this.npcs.forEach(npc => {
            npc.update(delta);
            
            // Check for interactions
            if (npc.isInteractable && npc.distanceToPlayer < 3) {
                this.ui.showInteractionPrompt(npc.name);
                
                if (this.keys['KeyE']) {
                    this.handleNPCInteraction(npc);
                }
            }
        });
    }
    
    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            enemy.update(delta);
            
            // AI behavior
            if (enemy.distanceToPlayer < 50) {
                enemy.engagePlayer(this.player);
                
                // Attack if in range
                if (enemy.distanceToPlayer < enemy.attackRange && 
                    enemy.canAttack()) {
                    enemy.attack(this.player);
                    this.playerStats.takeDamage(enemy.damage);
                }
            } else {
                enemy.patrol();
            }
            
            // Check for enemy death
            if (enemy.health <= 0) {
                this.handleEnemyDeath(enemy);
            }
        });
    }
    
    updatePhysics(delta) {
        // Step the physics world
        this.physics.world.step(delta);
        
        // Update Three.js objects to match physics bodies
        this.physics.bodies.forEach(body => {
            if (body.threeObj) {
                body.threeObj.position.copy(body.position);
                body.threeObj.quaternion.copy(body.quaternion);
            }
        });
    }
    
    updateWorld(delta) {
        // Update day/night cycle
        this.dayNightCycle.update(delta);
        
        // Update weather system
        this.weatherSystem.update(delta);
        
        // Update god rays
        this.godRays.update(this.camera);
        
        // Update game time
        this.gameState.gameTime += delta * 0.1; // Scale time progression
    }
    
    updateUI() {
        // Update HUD with current stats
        this.ui.updateHUD({
            health: this.playerStats.health,
            maxHealth: this.playerStats.maxHealth,
            stamina: this.playerStats.stamina,
            maxStamina: this.playerStats.maxStamina,
            mana: this.playerStats.mana,
            maxMana: this.playerStats.maxMana,
            level: this.playerStats.level,
            experience: this.playerStats.experience,
            inventory: this.playerInventory.items,
            equipped: this.playerEquipment.currentEquipment,
            activeQuests: this.gameState.activeQuests.map(id => 
                this.quests.find(q => q.id === id))
        });
        
        // Update minimap
        this.ui.updateMinimap({
            playerPosition: this.player.mesh.position,
            discoveredLocations: this.gameState.discoveredLocations,
            enemies: this.enemies.filter(e => e.distanceToPlayer < 100),
            npcs: this.npcs.filter(n => n.distanceToPlayer < 100)
        });
    }
    
    // Input Handling
    handlePlayerInput() {
        // Movement
        const moveVector = new THREE.Vector3();
        
        if (this.keys['KeyW']) moveVector.z -= 1;
        if (this.keys['KeyS']) moveVector.z += 1;
        if (this.keys['KeyA']) moveVector.x -= 1;
        if (this.keys['KeyD']) moveVector.x += 1;
        
        // Normalize and apply movement
        if (moveVector.length() > 0) {
            moveVector.normalize();
            
            // Apply movement based on camera direction
            const direction = moveVector
                .applyQuaternion(this.camera.quaternion)
                .multiplyScalar(this.player.speed * (this.keys['ShiftLeft'] ? 1.5 : 1));
            
            this.player.body.velocity.x = direction.x;
            this.player.body.velocity.z = direction.z;
            
            // Consume stamina if sprinting
            if (this.keys['ShiftLeft']) {
                this.playerStats.consumeStamina(0.5);
            }
        } else {
            // Apply friction
            this.player.body.velocity.x *= 0.9;
            this.player.body.velocity.z *= 0.9;
        }
        
        // Jumping
        if (this.keys['Space'] && this.player.isGrounded) {
            this.player.body.velocity.y = 10;
            this.player.isGrounded = false;
            this.playerStats.consumeStamina(10);
        }
        
        // Attacking
        if (this.mouse.down && this.player.canAttack()) {
            this.player.attack();
            
            // Check for hits
            this.checkWeaponHit();
        }
        
        // Blocking
        if (this.mouse.rightDown) {
            this.player.block();
        }
        
        // Using items
        if (this.keys['KeyQ']) {
            this.useQuickSlot(0);
        }
        if (this.keys['KeyE']) {
            this.useQuickSlot(1);
        }
        
        // Opening inventory
        if (this.keys['KeyI']) {
            this.ui.toggleInventory();
        }
        
        // Opening map
        if (this.keys['KeyM']) {
            this.ui.toggleMap();
        }
        
        // Opening skills
        if (this.keys['KeyK']) {
            this.ui.toggleSkills();
        }
        
        // Opening quest log
        if (this.keys['KeyJ']) {
            this.ui.toggleQuestLog();
        }
        
        // Saving game
        if (this.keys['KeyF5']) {
            this.saveGame();
        }
        
        // Loading game
        if (this.keys['KeyF9']) {
            this.loadGame();
        }
    }
    
    // Gameplay Systems
    checkWeaponHit() {
        // Create raycast from player's weapon
        const raycaster = new THREE.Raycaster();
        const weaponPosition = this.player.getWeaponPosition();
        const direction = this.player.getAttackDirection();
        
        raycaster.set(weaponPosition, direction);
        
        // Check for hits
        const hits = raycaster.intersectObjects(
            this.enemies.map(e => e.mesh)
        );
        
        // Process hits
        if (hits.length > 0) {
            const enemyHit = this.enemies.find(
                e => e.mesh === hits[0].object
            );
            
            if (enemyHit) {
                const damage = this.player.getAttackDamage();
                enemyHit.takeDamage(damage);
                
                // Show damage indicator
                this.ui.showDamageIndicator(
                    hits[0].point,
                    damage,
                    'player'
                );
                
                // Play hit sound
                this.audio.sfx.attack.play();
            }
        }
    }
    
    useQuickSlot(slot) {
        const item = this.playerInventory.getQuickSlotItem(slot);
        
        if (item) {
            switch (item.type) {
                case 'consumable':
                    this.useConsumable(item);
                    break;
                case 'throwable':
                    this.throwItem(item);
                    break;
                default:
                    console.log(`Cannot use ${item.type} from quick slot`);
            }
        }
    }
    
    useConsumable(item) {
        // Apply effects
        if (item.effect.health) {
            this.playerStats.heal(item.effect.health);
        }
        
        if (item.effect.stamina) {
            this.playerStats.restoreStamina(item.effect.stamina);
        }
        
        if (item.effect.mana) {
            this.playerStats.restoreMana(item.effect.mana);
        }
        
        // Remove from inventory
        this.playerInventory.removeItem(item.id, 1);
        
        // Play sound
        this.audio.sfx.heal.play();
        
        // Show effect
        this.ui.showStatusEffect('heal');
    }
    
    throwItem(item) {
        // Create projectile
        const projectile = new Projectile({
            item,
            position: this.player.getThrowPosition(),
            direction: this.player.getThrowDirection(),
            speed: 20,
            gravity: 9.82,
            owner: 'player'
        });
        
        // Add to scene
        this.scene.add(projectile.mesh);
        this.physics.world.addBody(projectile.body);
        
        // Remove from inventory
        this.playerInventory.removeItem(item.id, 1);
        
        // Track projectile
        this.projectiles.push(projectile);
    }
    
    handleNPCInteraction(npc) {
        // Check if NPC is a quest giver
        if (npc.type === 'quest_giver') {
            // Check for available quests
            const availableQuests = this.quests.filter(quest => 
                !this.gameState.activeQuests.includes(quest.id) &&
                !this.gameState.completedQuests.includes(quest.id) &&
                (!quest.requiredQuest || 
                 this.gameState.completedQuests.includes(quest.requiredQuest))
            );
            
            if (availableQuests.length > 0) {
                this.dialogueSystem.startDialogue(npc, availableQuests);
            } else {
                this.dialogueSystem.startGenericDialogue(npc);
            }
        } else {
            // Generic interaction
            this.dialogueSystem.startGenericDialogue(npc);
        }
    }
    
    handleEnemyDeath(enemy) {
        // Remove enemy from game
        this.scene.remove(enemy.mesh);
        this.physics.world.removeBody(enemy.body);
        this.enemies = this.enemies.filter(e => e !== enemy);
        
        // Drop loot
        this.spawnLoot(enemy.getLoot(), enemy.mesh.position);
        
        // Grant experience
        this.playerStats.gainExperience(enemy.experience);
        
        // Check quest progress
        this.checkQuestProgress('kill', enemy.type);
    }
    
    handlePlayerDeath() {
        // Show death screen
        this.ui.showDeathScreen({
            respawn: () => this.respawnPlayer(),
            load: () => this.loadGame(),
            quit: () => this.showMainMenu()
        });
        
        // Play death sound
        this.audio.sfx.damage.play();
    }
    
    respawnPlayer() {
        // Reset player stats
        this.playerStats.respawn();
        
        // Move player to respawn point
        const respawnPoint = this.getRespawnPoint();
        this.player.mesh.position.copy(respawnPoint);
        this.player.body.position.copy(respawnPoint);
        
        // Reset camera
        this.camera.position.copy(this.player.mesh.position);
        this.camera.position.y += 5;
        this.camera.position.z += 10;
        this.camera.lookAt(this.player.mesh.position);
    }
    
    checkQuestProgress(type, target) {
        this.gameState.activeQuests.forEach(questId => {
            const quest = this.quests.find(q => q.id === questId);
            
            if (quest) {
                quest.checkProgress(type, target);
                
                if (quest.isComplete) {
                    this.completeQuest(quest);
                }
            }
        });
    }
    
    completeQuest(quest) {
        // Give rewards
        if (quest.rewards.experience) {
            this.playerStats.gainExperience(quest.rewards.experience);
        }
        
        if (quest.rewards.gold) {
            // Add to player's gold
        }
        
        if (quest.rewards.items) {
            quest.rewards.items.forEach(itemId => {
                this.playerInventory.addItem(this.getItemById(itemId));
            });
        }
        
        // Mark as complete
        this.gameState.completedQuests.push(quest.id);
        this.gameState.activeQuests = this.gameState.activeQuests.filter(
            id => id !== quest.id
        );
        
        // Show completion UI
        this.ui.showQuestComplete(quest);
        
        // Play sound
        this.audio.sfx.questComplete.play();
        
        // Check for next quest in chain
        const nextQuest = this.quests.find(q => 
            q.requiredQuest === quest.id
        );
        
        if (nextQuest) {
            this.gameState.activeQuests.push(nextQuest.id);
            this.ui.showQuestStart(nextQuest);
        }
    }
    
    spawnLoot(items, position) {
        items.forEach(item => {
            const loot = new Loot({
                item,
                position,
                physicsWorld: this.physics.world
            });
            
            this.scene.add(loot.mesh);
            this.physics.world.addBody(loot.body);
            this.lootItems.push(loot);
        });
    }
    
    // Utility Methods
    getRandomSpawnPoint() {
        // Get random position in world bounds
        const x = Math.random() * 2000 - 1000;
        const z = Math.random() * 2000 - 1000;
        
        // Get terrain height at this position
        const y = this.world.getHeightAt(x, z) + 2;
        
        return new THREE.Vector3(x, y, z);
    }
    
    getRespawnPoint() {
        // For now, just return a safe position
        return new THREE.Vector3(0, 50, 0);
    }
    
    getRandomNPCType() {
        const types = ['villager', 'merchant', 'guard', 'wanderer'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getRandomFaction() {
        const factions = ['alliance', 'horde', 'neutral'];
        return factions[Math.floor(Math.random() * factions.length)];
    }
    
    getRandomAIProfile() {
        const profiles = ['wander', 'patrol', 'stationary'];
        return profiles[Math.floor(Math.random() * profiles.length)];
    }
    
    getRandomEnemyType() {
        const types = ['wolf', 'goblin', 'skeleton', 'bandit'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getEnemyLevel(type) {
        // Scale enemy level based on player level and type
        const baseLevel = {
            wolf: 1,
            goblin: 2,
            skeleton: 3,
            bandit: 4,
            boss: this.gameState.level + 10
        };
        
        return Math.max(1, baseLevel[type] + 
            Math.floor(Math.random() * 3) - 1);
    }
    
    getEnemyAIProfile(type) {
        const profiles = {
            wolf: 'pack',
            goblin: 'coward',
            skeleton: 'aggressive',
            bandit: 'strategic',
            boss: 'boss'
        };
        
        return profiles[type];
    }
    
    getItemById(id) {
        return this.items.find(item => item.id === id);
    }
    
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode) {
            this.stats.dom.style.display = 'block';
            this.renderer.debug.checkShaderErrors = true;
        } else {
            this.stats.dom.style.display = 'none';
            this.renderer.debug.checkShaderErrors = false;
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.ui.togglePauseMenu(this.isPaused);
        
        if (this.isPaused) {
            this.audio.bgm.pause();
        } else {
            this.audio.bgm.play();
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    showMainMenu() {
        this.ui.showMainMenu();
    }
    
    openSettings() {
        this.ui.showSettings({
            graphics: this.gameState.settings.graphics,
            controls: this.gameState.settings.controls,
            audio: this.gameState.settings.audio,
            onApply: (settings) => {
                this.gameState.settings = settings;
                this.applySettings();
            }
        });
    }
    
    applySettings() {
        // Apply graphics settings
        switch (this.gameState.settings.graphics) {
            case 'low':
                this.renderer.shadowMap.enabled = false;
                this.composer.passes.forEach(pass => pass.enabled = false);
                break;
            case 'medium':
                this.renderer.shadowMap.enabled = true;
                this.composer.passes.forEach(pass => {
                    if (pass instanceof UnrealBloomPass) pass.enabled = false;
                    else pass.enabled = true;
                });
                break;
            case 'high':
                this.renderer.shadowMap.enabled = true;
                this.composer.passes.forEach(pass => pass.enabled = true);
                break;
        }
        
        // Apply audio settings
        this.audio.bgm.setVolume(this.gameState.settings.audio);
        Object.values(this.audio.sfx).forEach(sound => {
            sound.setVolume(this.gameState.settings.audio);
        });
    }
    
    showCredits() {
        this.ui.showCredits();
    }
}

// Helper Classes
class PlayerCharacter {
    constructor({ model, position, camera, physicsWorld }) {
        this.model = model;
        this.position = position;
        this.camera = camera;
        this.physicsWorld = physicsWorld;
        
        // Create mesh
        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        
        // Create physics body
        this.body = this.createPhysicsBody();
        this.physicsWorld.addBody(this.body);
        
        // Player stats
        this.speed = 5;
        this.jumpForce = 10;
        this.isGrounded = false;
        this.canAttack = true;
        this.attackCooldown = 0;
        
        // Animation mixer
        this.mixer = new THREE.AnimationMixer(this.mesh);
        
        // Load animations
        this.animations = {
            idle: this.mixer.clipAction(this.model.animations[0]),
            walk: this.mixer.clipAction(this.model.animations[1]),
            run: this.mixer.clipAction(this.model.animations[2]),
            attack: this.mixer.clipAction(this.model.animations[3]),
            block: this.mixer.clipAction(this.model.animations[4])
        };
        
        // Set initial animation
        this.currentAnimation = this.animations.idle;
        this.currentAnimation.play();
    }
    
    createMesh() {
        // Clone the model and set up materials
        const mesh = this.model.scene.clone();
        mesh.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Scale to appropriate size
        mesh.scale.set(0.5, 0.5, 0.5);
        
        return mesh;
    }
    
    createPhysicsBody() {
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5));
        const body = new CANNON.Body({
            mass: 1,
            shape,
            position: new CANNON.Vec3(
                this.position.x,
                this.position.y,
                this.position.z
            ),
            material: this.physicsWorld.materials.character
        });
        
        // Track collisions
        body.addEventListener('collide', (e) => {
            if (e.body.material === this.physicsWorld.materials.ground) {
                this.isGrounded = true;
            }
        });
        
        return body;
    }
    
    update(delta) {
        // Update animation mixer
        this.mixer.update(delta);
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        } else {
            this.canAttack = true;
        }
        
        // Sync mesh with physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
    
    attack() {
        if (this.canAttack) {
            // Play attack animation
            this.playAnimation('attack');
            
            // Set cooldown
            this.canAttack = false;
            this.attackCooldown = 0.5;
            
            return true;
        }
        return false;
    }
    
    block() {
        // Play block animation
        this.playAnimation('block');
    }
    
    getWeaponPosition() {
        // Get position of weapon for raycasting
        const weapon = this.mesh.getObjectByName('weapon');
        if (weapon) {
            const worldPosition = new THREE.Vector3();
            weapon.getWorldPosition(worldPosition);
            return worldPosition;
        }
        return this.mesh.position.clone();
    }
    
    getAttackDirection() {
        // Get forward vector from camera
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        return direction;
    }
    
    getThrowPosition() {
        // Get position to throw items from
        const position = this.mesh.position.clone();
        position.y += 1.5;
        return position;
    }
    
    getThrowDirection() {
        // Get forward vector from camera
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        return direction;
    }
    
    playAnimation(name) {
        if (this.currentAnimation !== this.animations[name]) {
            this.currentAnimation.fadeOut(0.2);
            this.currentAnimation = this.animations[name];
            this.currentAnimation.reset();
            this.currentAnimation.fadeIn(0.2);
            this.currentAnimation.play();
        }
    }
    
    getAttackDamage() {
        // Base damage + weapon damage + random variation
        const weapon = this.equipment.weapon;
        const baseDamage = 5;
        const weaponDamage = weapon ? weapon.damage : 0;
        const variation = Math.random() * 5;
        
        return baseDamage + weaponDamage + variation;
    }
}

class NPC {
    constructor({ model, position, type, faction, aiProfile, id, name }) {
        this.model = model;
        this.position = position;
        this.type = type;
        this.faction = faction;
        this.aiProfile = aiProfile;
        this.id = id;
        this.name = name || this.generateName();
        
        // Create mesh
        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        
        // Create physics body
        this.body = this.createPhysicsBody();
        
        // NPC stats
        this.speed = 2;
        this.isInteractable = true;
        this.distanceToPlayer = Infinity;
        
        // AI state
        this.state = 'idle';
        this.target = null;
        this.path = [];
        this.lastStateChange = 0;
        
        // Animation mixer
        this.mixer = new THREE.AnimationMixer(this.mesh);
        
        // Load animations
        this.animations = {
            idle: this.mixer.clipAction(this.model.animations[0]),
            walk: this.mixer.clipAction(this.model.animations[1]),
            talk: this.mixer.clipAction(this.model.animations[2])
        };
        
        // Set initial animation
        this.currentAnimation = this.animations.idle;
        this.currentAnimation.play();
    }
    
    createMesh() {
        // Clone the model and set up materials
        const mesh = this.model.scene.clone();
        mesh.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Scale to appropriate size
        mesh.scale.set(0.5, 0.5, 0.5);
        
        return mesh;
    }
    
    createPhysicsBody() {
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5));
        const body = new CANNON.Body({
            mass: 1,
            shape,
            position: new CANNON.Vec3(
                this.position.x,
                this.position.y,
                this.position.z
            ),
            material: game.physics.materials.default
        });
        
        return body;
    }
    
    update(delta) {
        // Update animation mixer
        this.mixer.update(delta);
        
        // Update distance to player
        if (game.player) {
            this.distanceToPlayer = this.mesh.position.distanceTo(
                game.player.mesh.position
            );
        }
        
        // AI behavior
        switch (this.aiProfile) {
            case 'wander':
                this.updateWanderBehavior(delta);
                break;
            case 'patrol':
                this.updatePatrolBehavior(delta);
                break;
            case 'stationary':
                this.updateStationaryBehavior(delta);
                break;
        }
        
        // Sync mesh with physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
    
    updateWanderBehavior(delta) {
        // Random wandering behavior
        if (this.state === 'idle' && Date.now() - this.lastStateChange > 3000) {
            // Chance to start moving
            if (Math.random() < 0.3) {
                this.state = 'moving';
                this.target = this.getRandomPoint(10);
                this.lastStateChange = Date.now();
                this.playAnimation('walk');
            }
        } else if (this.state === 'moving') {
            // Move toward target
            const direction = new THREE.Vector3()
                .subVectors(this.target, this.mesh.position)
                .normalize();
            
            this.body.velocity.x = direction.x * this.speed;
            this.body.velocity.z = direction.z * this.speed;
            
            // Check if reached target
            if (this.mesh.position.distanceTo(this.target) < 1) {
                this.state = 'idle';
                this.body.velocity.x = 0;
                this.body.velocity.z = 0;
                this.lastStateChange = Date.now();
                this.playAnimation('idle');
            }
        }
    }
    
    updatePatrolBehavior(delta) {
        // Patrol between fixed points
        if (this.path.length === 0) {
            this.path = this.generatePatrolPath(3, 20);
            this.currentPathIndex = 0;
            this.target = this.path[this.currentPathIndex];
            this.state = 'moving';
            this.playAnimation('walk');
        }
        
        if (this.state === 'moving') {
            // Move toward target
            const direction = new THREE.Vector3()
                .subVectors(this.target, this.mesh.position)
                .normalize();
            
            this.body.velocity.x = direction.x * this.speed;
            this.body.velocity.z = direction.z * this.speed;
            
            // Check if reached target
            if (this.mesh.position.distanceTo(this.target) < 1) {
                this.currentPathIndex = (this.currentPathIndex + 1) % this.path.length;
                this.target = this.path[this.currentPathIndex];
            }
        }
    }
    
    updateStationaryBehavior(delta) {
        // Stay in one place
        this.body.velocity.x = 0;
        this.body.velocity.z = 0;
        this.playAnimation('idle');
    }
    
    generatePatrolPath(count, radius) {
        const path = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = this.mesh.position.x + Math.cos(angle) * radius;
            const z = this.mesh.position.z + Math.sin(angle) * radius;
            path.push(new THREE.Vector3(x, this.mesh.position.y, z));
        }
        return path;
    }
    
    getRandomPoint(distance) {
        const angle = Math.random() * Math.PI * 2;
        const x = this.mesh.position.x + Math.cos(angle) * distance;
        const z = this.mesh.position.z + Math.sin(angle) * distance;
        return new THREE.Vector3(x, this.mesh.position.y, z);
    }
    
    generateName() {
        const firstNames = ['Aric', 'Borin', 'Cedric', 'Dain', 'Eldrin', 'Fargus'];
        const lastNames = ['Ironfist', 'Stormhammer', 'Brightblade', 'Darkthorn', 'Fireforge'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    }
    
    playAnimation(name) {
        if (this.currentAnimation !== this.animations[name]) {
            this.currentAnimation.fadeOut(0.2);
            this.currentAnimation = this.animations[name];
            this.currentAnimation.reset();
            this.currentAnimation.fadeIn(0.2);
            this.currentAnimation.play();
        }
    }
}

class Enemy {
    constructor({ model, position, type, level, faction, aiProfile, id, name }) {
        this.model = model;
        this.position = position;
        this.type = type;
        this.level = level;
        this.faction = faction;
        this.aiProfile = aiProfile;
        this.id = id;
        this.name = name || this.generateName();
        
        // Create mesh
        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        
        // Create physics body
        this.body = this.createPhysicsBody();
        
        // Enemy stats
        this.health = this.calculateMaxHealth();
        this.maxHealth = this.health;
        this.damage = this.calculateDamage();
        this.speed = this.calculateSpeed();
        this.attackRange = this.calculateAttackRange();
        this.experience = this.calculateExperience();
        
        // Combat state
        this.isAggro = false;
        this.distanceToPlayer = Infinity;
        this.lastAttackTime = 0;
        this.attackCooldown = this.calculateAttackCooldown();
        
        // Animation mixer
        this.mixer = new THREE.AnimationMixer(this.mesh);
        
        // Load animations
        this.animations = {
            idle: this.mixer.clipAction(this.model.animations[0]),
            walk: this.mixer.clipAction(this.model.animations[1]),
            attack: this.mixer.clipAction(this.model.animations[2]),
            die: this.mixer.clipAction(this.model.animations[3])
        };
        
        // Set initial animation
        this.currentAnimation = this.animations.idle;
        this.currentAnimation.play();
    }
    
    createMesh() {
        // Clone the model and set up materials
        const mesh = this.model.scene.clone();
        mesh.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Scale based on type
        const scale = {
            wolf: 0.7,
            goblin: 0.5,
            skeleton: 0.6,
            bandit: 0.8,
            boss: 1.5
        }[this.type] || 0.5;
        
        mesh.scale.set(scale, scale, scale);
        
        return mesh;
    }
    
    createPhysicsBody() {
        const scale = {
            wolf: 0.7,
            goblin: 0.5,
            skeleton: 0.6,
            bandit: 0.8,
            boss: 1.5
        }[this.type] || 0.5;
        
        const shape = new CANNON.Box(new CANNON.Vec3(0.5 * scale, 1 * scale, 0.5 * scale));
        const body = new CANNON.Body({
            mass: 1,
            shape,
            position: new CANNON.Vec3(
                this.position.x,
                this.position.y,
                this.position.z
            ),
            material: game.physics.materials.default
        });
        
        return body;
    }
    
    calculateMaxHealth() {
        const baseHealth = {
            wolf: 50,
            goblin: 40,
            skeleton: 60,
            bandit: 70,
            boss: 500
        }[this.type] || 50;
        
        return baseHealth * (1 + (this.level - 1) * 0.2);
    }
    
    calculateDamage() {
        const baseDamage = {
            wolf: 10,
            goblin: 8,
            skeleton: 12,
            bandit: 15,
            boss: 40
        }[this.type] || 10;
        
        return baseDamage * (1 + (this.level - 1) * 0.15);
    }
    
    calculateSpeed() {
        const baseSpeed = {
            wolf: 3,
            goblin: 2.5,
            skeleton: 2,
            bandit: 2.8,
            boss: 2.2
        }[this.type] || 2.5;
        
        return baseSpeed;
    }
    
    calculateAttackRange() {
        const baseRange = {
            wolf: 1.5,
            goblin: 1,
            skeleton: 1.2,
            bandit: 1.8,
            boss: 3
        }[this.type] || 1.5;
        
        return baseRange;
    }
    
    calculateAttackCooldown() {
        const baseCooldown = {
            wolf: 1.5,
            goblin: 2,
            skeleton: 1.8,
            bandit: 1.2,
            boss: 0.8
        }[this.type] || 1.5;
        
        return baseCooldown;
    }
    
    calculateExperience() {
        const baseExp = {
            wolf: 25,
            goblin: 20,
            skeleton: 30,
            bandit: 35,
            boss: 500
        }[this.type] || 25;
        
        return baseExp * (1 + (this.level - 1) * 0.3);
    }
    
    update(delta) {
        // Update animation mixer
        this.mixer.update(delta);
        
        // Update distance to player
        if (game.player) {
            this.distanceToPlayer = this.mesh.position.distanceTo(
                game.player.mesh.position
            );
        }
        
        // Sync mesh with physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
    
    engagePlayer(player) {
        // Move toward player
        const direction = new THREE.Vector3()
            .subVectors(player.mesh.position, this.mesh.position)
            .normalize();
        
        this.body.velocity.x = direction.x * this.speed;
        this.body.velocity.z = direction.z * this.speed;
        
        // Face player
        this.mesh.lookAt(player.mesh.position);
        
        // Update animation
        this.playAnimation('walk');
    }
    
    patrol() {
        // Random movement when not engaged
        if (Math.random() < 0.01) {
            const randomDirection = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                0,
                (Math.random() - 0.5) * 2
            ).normalize();
            
            this.body.velocity.x = randomDirection.x * this.speed * 0.5;
            this.body.velocity.z = randomDirection.z * this.speed * 0.5;
            
            // Face movement direction
            if (randomDirection.length() > 0) {
                this.mesh.lookAt(this.mesh.position.clone().add(randomDirection));
            }
            
            // Update animation
            this.playAnimation('walk');
        } else {
            this.body.velocity.x *= 0.9;
            this.body.velocity.z *= 0.9;
            
            // Update animation
            this.playAnimation('idle');
        }
    }
    
    attack(target) {
        if (Date.now() - this.lastAttackTime > this.attackCooldown * 1000) {
            // Play attack animation
            this.playAnimation('attack');
            
            // Apply damage
            target.takeDamage(this.damage);
            
            // Update last attack time
            this.lastAttackTime = Date.now();
            
            return true;
        }
        return false;
    }
    
    canAttack() {
        return Date.now() - this.lastAttackTime > this.attackCooldown * 1000;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Show damage indicator
        game.ui.showDamageIndicator(
            this.mesh.position,
            amount,
            'enemy'
        );
        
        // Check for death
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        // Play death animation
        this.playAnimation('die');
        
        // Remove from physics world
        game.physics.world.removeBody(this.body);
        
        // Schedule removal from scene
        setTimeout(() => {
            game.scene.remove(this.mesh);
        }, 2000);
    }
    
    getLoot() {
        const lootTables = {
            wolf: [
                { id: 'meat', chance: 0.8, min: 1, max: 3 },
                { id: 'hide', chance: 0.5, min: 1, max: 2 }
            ],
            goblin: [
                { id: 'gold', chance: 1.0, min: 1, max: 5 },
                { id: 'crude_weapon', chance: 0.3, min: 1, max: 1 }
            ],
            skeleton: [
                { id: 'bone', chance: 1.0, min: 2, max: 5 },
                { id: 'ancient_coin', chance: 0.2, min: 1, max: 1 }
            ],
            bandit: [
                { id: 'gold', chance: 1.0, min: 5, max: 15 },
                { id: 'health_potion', chance: 0.4, min: 1, max: 1 }
            ],
            boss: [
                { id: 'gold', chance: 1.0, min: 50, max: 100 },
                { id: 'rare_weapon', chance: 1.0, min: 1, max: 1 },
                { id: 'ancient_artifact', chance: 1.0, min: 1, max: 1 }
            ]
        };
        
        const loot = [];
        const table = lootTables[this.type] || [];
        
        table.forEach(item => {
            if (Math.random() < item.chance) {
                const quantity = Math.floor(
                    Math.random() * (item.max - item.min + 1) + item.min
                );
                
                loot.push({
                    id: item.id,
                    quantity
                });
            }
        });
        
        return loot;
    }
    
    generateName() {
        const prefixes = {
            wolf: ['Alpha', 'Feral', 'Shadow', 'Blood'],
            goblin: ['Sneaky', 'Stinky', 'Greedy', 'Wily'],
            skeleton: ['Bone', 'Ancient', 'Cursed', 'Rattling'],
            bandit: ['Black', 'One-Eyed', 'Ruthless', 'Cutthroat'],
            boss: ['Terror', 'Doom', 'Death', 'Destruction']
        };
        
        const suffixes = {
            wolf: ['Fang', 'Howler', 'Claw', 'Hunter'],
            goblin: ['Snatcher', 'Grabber', 'Thief', 'Scrapper'],
            skeleton: ['Revenant', 'Walker', 'Bones', 'Guardian'],
            bandit: ['Jack', 'the Knife', 'the Bandit', 'the Rogue'],
            boss: ['the Destroyer', 'the Unholy', 'the Ancient', 'the Cursed']
        };
        
        const typeNames = {
            wolf: 'Wolf',
            goblin: 'Goblin',
            skeleton: 'Skeleton',
            bandit: 'Bandit',
            boss: 'Boss'
        };
        
        if (this.type === 'boss') {
            return `${prefixes.boss[Math.floor(Math.random() * prefixes.boss.length)]} ${suffixes.boss[Math.floor(Math.random() * suffixes.boss.length)]}`;
        }
        
        return `${prefixes[this.type][Math.floor(Math.random() * prefixes[this.type].length)]} ${typeNames[this.type]}`;
    }
    
    playAnimation(name) {
        if (this.currentAnimation !== this.animations[name]) {
            this.currentAnimation.fadeOut(0.1);
            this.currentAnimation = this.animations[name];
            this.currentAnimation.reset();
            this.currentAnimation.fadeIn(0.1);
            this.currentAnimation.play();
            
            // Handle death animation
            if (name === 'die') {
                this.currentAnimation.clampWhenFinished = true;
                this.currentAnimation.setLoop(THREE.LoopOnce);
            }
        }
    }
}

// World Generation System
class WorldGenerator {
    constructor({ size, biomes, terrainDetail, seed }) {
        this.size = size;
        this.biomes = biomes;
        this.terrainDetail = terrainDetail;
        this.seed = seed;
        
        // Initialize noise generators
        this.heightNoise = new SimplexNoise(this.seed);
        this.biomeNoise = new SimplexNoise(this.seed + 1);
        this.detailNoise = new SimplexNoise(this.seed + 2);
    }
    
    generateTerrain() {
        // Create terrain geometry
        const geometry = new THREE.PlaneGeometry(
            this.size,
            this.size,
            this.terrainDetail,
            this.terrainDetail
        );
        
        // Create height map
        const vertices = geometry.attributes.position.array;
        const heightMap = [];
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Get height from noise functions
            const height = this.getHeightAt(x, z);
            vertices[i + 1] = height;
            
            // Store in height map
            heightMap.push(height);
        }
        
        // Update normals for lighting
        geometry.computeVertexNormals();
        
        // Create terrain material
        const material = new THREE.MeshStandardMaterial({
            color: 0x3a5f3a,
            wireframe: false,
            side: THREE.DoubleSide,
            flatShading: false,
            metalness: 0.1,
            roughness: 0.8
        });
        
        // Create terrain mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        
        // Create physics body
        const shape = new CANNON.Heightfield(
            this.createHeightfieldData(heightMap),
            { elementSize: this.size / (this.terrainDetail - 1) }
        );
        
        const body = new CANNON.Body({
            mass: 0,
            shape,
            position: new CANNON.Vec3(0, 0, 0),
            material: game.physics.materials.ground
        });
        
        return { mesh, body, heightMap };
    }
    
    getHeightAt(x, z) {
        // Normalize coordinates
        const nx = x / this.size;
        const nz = z / this.size;
        
        // Base height (large features)
        let height = this.heightNoise.noise2D(nx * 2, nz * 2) * 50;
        
        // Medium details
        height += this.heightNoise.noise2D(nx * 8, nz * 8) * 10;
        
        // Small details
        height += this.heightNoise.noise2D(nx * 32, nz * 32) * 2;
        
        // Apply biome modifiers
        const biomeValue = this.biomeNoise.noise2D(nx * 0.5, nz * 0.5);
        
        if (biomeValue > 0.5) {
            // Mountain biome
            height *= 1.5;
            height += 50;
        } else if (biomeValue > 0) {
            // Hills biome
            height *= 1.2;
            height += 20;
        } else if (biomeValue > -0.5) {
            // Plains biome
            height = Math.max(height, 0);
        } else {
            // Water biome
            height = Math.min(height, -10);
        }
        
        return height;
    }
    
    createHeightfieldData(heightMap) {
        // Convert height map to 2D array for Cannon.js
        const size = Math.sqrt(heightMap.length);
        const data = [];
        
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                row.push(heightMap[i * size + j]);
            }
            data.push(row);
        }
        
        return data;
    }
    
    generateVegetation() {
        const vegetation = [];
        const count = 1000;
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.size - this.size / 2;
            const z = Math.random() * this.size - this.size / 2;
            const y = this.getHeightAt(x, z);
            
            // Skip water areas
            if (y < 0) continue;
            
            // Get biome at this position
            const nx = x / this.size;
            const nz = z / this.size;
            const biomeValue = this.biomeNoise.noise2D(nx * 0.5, nz * 0.5);
            
            let type;
            if (biomeValue > 0.5) {
                // Mountain - sparse vegetation
                if (Math.random() > 0.7) {
                    type = Math.random() > 0.5 ? 'rock' : 'pine';
                } else {
                    continue;
                }
            } else if (biomeValue > 0) {
                // Hills - mixed vegetation
                type = ['oak', 'pine', 'rock', 'bush'][Math.floor(Math.random() * 4)];
            } else if (biomeValue > -0.5) {
                // Plains - dense vegetation
                type = ['oak', 'bush', 'flower', 'grass'][Math.floor(Math.random() * 4)];
            } else {
                // Water - no vegetation
                continue;
            }
            
            // Create vegetation object
            const vegetationObj = this.createVegetationObject(type, x, y, z);
            if (vegetationObj) {
                vegetation.push(vegetationObj);
            }
        }
        
        return vegetation;
    }
    
    createVegetationObject(type, x, y, z) {
        // Create different types of vegetation
        switch (type) {
            case 'oak':
                return this.createTree(x, y, z, 'oak');
            case 'pine':
                return this.createTree(x, y, z, 'pine');
            case 'bush':
                return this.createBush(x, y, z);
            case 'rock':
                return this.createRock(x, y, z);
            case 'flower':
                return this.createFlower(x, y, z);
            case 'grass':
                return this.createGrassPatch(x, y, z);
            default:
                return null;
        }
    }
    
    createTree(x, y, z, type) {
        // Create tree group
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Create trunk
        const trunkHeight = type === 'oak' ? 8 + Math.random() * 2 : 10 + Math.random() * 3;
        const trunkGeometry = new THREE.CylinderGeometry(
            0.5,
            0.7,
            trunkHeight,
            8
        );
        
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: type === 'oak' ? 0x8B4513 : 0xA0522D,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);
        
        // Create leaves
        const leavesRadius = type === 'oak' ? 4 + Math.random() * 1 : 3 + Math.random() * 1;
        const leavesGeometry = new THREE.SphereGeometry(
            leavesRadius,
            8,
            6,
            0,
            Math.PI * 2,
            0,
            Math.PI * 0.5
        );
        
        const leavesMaterial = new THREE.MeshStandardMaterial({
            color: type === 'oak' ? 0x228B22 : 0x2E8B57,
            roughness: 0.7,
            metalness: 0,
            transparent: true,
            opacity: 0.9
        });
        
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = trunkHeight - leavesRadius * 0.5;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        group.add(leaves);
        
        // Create physics body
        const shape = new CANNON.Cylinder(
            0.5, 0.7, trunkHeight,
            8
        );
        
        const body = new CANNON.Body({
            mass: 0,
            shape,
            position: new CANNON.Vec3(x, y + trunkHeight / 2, z),
            material: game.physics.materials.default
        });
        
        return { mesh: group, body };
    }
    
    createBush(x, y, z) {
        // Create bush group
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Create bush shape
        const bushSize = 1.5 + Math.random() * 0.5;
        const bushGeometry = new THREE.SphereGeometry(
            bushSize,
            6,
            4
        );
        
        const bushMaterial = new THREE.MeshStandardMaterial({
            color: 0x32CD32,
            roughness: 0.8,
            metalness: 0
        });
        
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.castShadow = true;
        bush.receiveShadow = true;
        group.add(bush);
        
        return { mesh: group };
    }
    
    createRock(x, y, z) {
        // Create rock group
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Create rock shape
        const rockSize = 1 + Math.random();
        const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
        
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.2,
            flatShading: true
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        // Random rotation
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        group.add(rock);
        
        // Create physics body
        const shape = new CANNON.Sphere(rockSize);
        const body = new CANNON.Body({
            mass: 0,
            shape,
            position: new CANNON.Vec3(x, y + rockSize, z),
            material: game.physics.materials.default
        });
        
        return { mesh: group, body };
    }
    
    createFlower(x, y, z) {
        // Create flower group
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Create stem
        const stemHeight = 0.5 + Math.random() * 0.3;
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, stemHeight, 6);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = stemHeight / 2;
        group.add(stem);
        
        // Create flower head
        const flowerType = Math.floor(Math.random() * 3);
        let flowerColor, flowerGeometry;
        
        switch (flowerType) {
            case 0: // Daisy
                flowerColor = 0xFFFFFF;
                flowerGeometry = new THREE.CircleGeometry(0.3, 8);
                break;
            case 1: // Rose
                flowerColor = 0xFF0000;
                flowerGeometry = new THREE.SphereGeometry(0.2, 6, 6);
                break;
            case 2: // Sunflower
                flowerColor = 0xFFFF00;
                flowerGeometry = new THREE.CircleGeometry(0.4, 8);
                break;
        }
        
        const flowerMaterial = new THREE.MeshStandardMaterial({ color: flowerColor });
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flower.position.y = stemHeight;
        group.add(flower);
        
        return { mesh: group };
    }
    
    createGrassPatch(x, y, z) {
        // Create grass group
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Create multiple grass blades
        const bladeCount = 5 + Math.floor(Math.random() * 10);
        for (let i = 0; i < bladeCount; i++) {
            const bladeX = (Math.random() - 0.5) * 1.5;
            const bladeZ = (Math.random() - 0.5) * 1.5;
            
            const bladeHeight = 0.3 + Math.random() * 0.3;
            const bladeGeometry = new THREE.PlaneGeometry(0.02, bladeHeight);
            const bladeMaterial = new THREE.MeshStandardMaterial({
                color: 0x7CFC00,
                side: THREE.DoubleSide,
                alphaTest: 0.5
            });
            
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.set(bladeX, bladeHeight / 2, bladeZ);
            blade.rotation.y = Math.random() * Math.PI;
            group.add(blade);
        }
        
        return { mesh: group };
    }
    
    generateWater() {
        // Create water plane
        const waterGeometry = new THREE.PlaneGeometry(this.size, this.size, 1, 1);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x1E90FF,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            metalness: 0.5
        });
        
        const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        waterMesh.rotation.x = -Math.PI / 2;
        waterMesh.position.y = -0.1; // Slightly below terrain
        
        return { mesh: waterMesh };
    }
    
    generatePointsOfInterest() {
        const poi = [];
        
        // Generate villages
        const villageCount = 5;
        for (let i = 0; i < villageCount; i++) {
            const x = (Math.random() - 0.5) * this.size * 0.8;
            const z = (Math.random() - 0.5) * this.size * 0.8;
            const y = this.getHeightAt(x, z);
            
            // Make sure village is on land
            if (y > 0) {
                const village = this.createVillage(x, y, z, `Village ${i + 1}`);
                poi.push(village);
            }
        }
        
        // Generate dungeons
        const dungeonCount = 3;
        for (let i = 0; i < dungeonCount; i++) {
            const x = (Math.random() - 0.5) * this.size * 0.8;
            const z = (Math.random() - 0.5) * this.size * 0.8;
            const y = this.getHeightAt(x, z);
            
            // Make sure dungeon is on land
            if (y > 0) {
                const dungeon = this.createDungeon(x, y, z, `Dungeon ${i + 1}`);
                poi.push(dungeon);
            }
        }
        
        // Generate landmarks
        const landmarkCount = 7;
        for (let i = 0; i < landmarkCount; i++) {
            const x = (Math.random() - 0.5) * this.size * 0.8;
            const z = (Math.random() - 0.5) * this.size * 0.8;
            const y = this.getHeightAt(x, z);
            
            // Make sure landmark is on land
            if (y > 0) {
                const landmark = this.createLandmark(x, y, z, `Landmark ${i + 1}`);
                poi.push(landmark);
            }
        }
        
        return poi;
    }
    
    createVillage(x, y, z, name) {
        // Create village group
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Create houses
        const houseCount = 5 + Math.floor(Math.random() * 10);
        for (let i = 0; i < houseCount; i++) {
            const houseX = (Math.random() - 0.5) * 100;
            const houseZ = (Math.random() - 0.5) * 100;
            const houseY = this.getHeightAt(x + houseX, z + houseZ);
            
            const house = this.createHouse(houseX, houseY, houseZ);
            group.add(house.mesh);
        }
        
        // Create central plaza
        const plazaGeometry = new THREE.CircleGeometry(15, 32);
        const plazaMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
        plaza.rotation.x = -Math.PI / 2;
        group.add(plaza);
        
        // Create physics body (simplified for village bounds)
        const shape = new CANNON.Box(new CANNON.Vec3(50, 10, 50));
        const body = new CANNON.Body({
            mass: 0,
            shape,
            position: new CANNON.Vec3(x, y + 10, z),
            material: game.physics.materials.default
        });
        
        return {
            id: `village_${name.toLowerCase().replace(' ', '_')}`,
            name,
            mesh: group,
            body,
            position: new THREE.Vector3(x, y, z)
        };
    }
    
    createHouse(x, y, z) {
        // Create house group
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Create base
        const baseGeometry = new THREE.BoxGeometry(5, 3, 5);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 1.5;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Create roof
        const roofGeometry = new THREE.ConeGeometry(4, 3, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B0000,
            roughness: 0.7
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 4.5;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);
        
        // Create door
        const doorGeometry = new THREE.PlaneGeometry(1, 2);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.5
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 1, 2.51);
        group.add(door);
        
        return { mesh: group };
    }
    
    createDungeon(x, y, z, name) {
        // Create dungeon entrance
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Create entrance arch
        const archGeometry = new THREE.BoxGeometry(5, 5, 1);
        const archMaterial = new THREE.MeshStandardMaterial({
            color: 0x696969,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const leftPillar = new THREE.Mesh(archGeometry, archMaterial);
        leftPillar.position.set(-3, 2.5, 0);
        group.add(leftPillar);
        
        const rightPillar = new THREE.Mesh(archGeometry, archMaterial);
        rightPillar.position.set(3, 2.5, 0);
        group.add(rightPillar);
        
        const topBeam = new THREE.Mesh(archGeometry, archMaterial);
        topBeam.position.set(0, 5, 0);
        topBeam.scale.set(2, 0.5, 1);
        group.add(topBeam);
        
        // Create stairs
        const stairGeometry = new THREE.BoxGeometry(8, 0.5, 1);
        for (let i = 0; i < 5; i++) {
            const stair = new THREE.Mesh(stairGeometry, archMaterial);
            stair.position.set(0, i * 0.5, -i * 0.5 - 0.5);
            stair.scale.z = 1 + i * 0.5;
            group.add(stair);
        }
        
        // Create physics body
        const shape = new CANNON.Box(new CANNON.Vec3(4, 2.5, 2));
        const body = new CANNON.Body({
            mass: 0,
            shape,
            position: new CANNON.Vec3(x, y + 2.5, z),
            material: game.physics.materials.default
        });
        
        return {
            id: `dungeon_${name.toLowerCase().replace(' ', '_')}`,
            name,
            mesh: group,
            body,
            position: new THREE.Vector3(x, y, z)
        };
    }
    
    createLandmark(x, y, z, name) {
        // Create random landmark
        const types = ['stone_circle', 'ruined_tower', 'statue', 'fountain'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        switch (type) {
            case 'stone_circle':
                // Create stone circle
                const stoneCount = 8;
                const radius = 10;
                
                for (let i = 0; i < stoneCount; i++) {
                    const angle = (i / stoneCount) * Math.PI * 2;
                    const stoneX = Math.cos(angle) * radius;
                    const stoneZ = Math.sin(angle) * radius;
                    
                    const stoneHeight = 2 + Math.random() * 2;
                    const stoneGeometry = new THREE.CylinderGeometry(
                        0.5,
                        0.8,
                        stoneHeight,
                        6
                    );
                    
                    const stoneMaterial = new THREE.MeshStandardMaterial({
                        color: 0x708090,
                        roughness: 0.8
                    });
                    
                    const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
                    stone.position.set(stoneX, stoneHeight / 2, stoneZ);
                    stone.rotation.x = Math.random() * 0.2;
                    stone.rotation.z = Math.random() * 0.2;
                    group.add(stone);
                }
                break;
                
            case 'ruined_tower':
                // Create ruined tower
                const towerHeight = 10 + Math.random() * 10;
                const towerGeometry = new THREE.CylinderGeometry(
                    3,
                    4,
                    towerHeight,
                    8
                );
                
                const towerMaterial = new THREE.MeshStandardMaterial({
                    color: 0x808080,
                    roughness: 0.7
                });
                
                const tower = new THREE.Mesh(towerGeometry, towerMaterial);
                tower.position.y = towerHeight / 2;
                
                // Add broken top
                tower.geometry.vertices.forEach(v => {
                    if (v.y > towerHeight * 0.8) {
                        v.x += (Math.random() - 0.5) * 2;
                        v.z += (Math.random() - 0.5) * 2;
                    }
                });
                
                tower.geometry.verticesNeedUpdate = true;
                group.add(tower);
                break;
                
            case 'statue':
                // Create statue
                const pedestalGeometry = new THREE.BoxGeometry(3, 1, 3);
                const pedestalMaterial = new THREE.MeshStandardMaterial({
                    color: 0xA9A9A9,
                    roughness: 0.6
                });
                
                const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
                pedestal.position.y = 0.5;
                group.add(pedestal);
                
                const statueGeometry = new THREE.CylinderGeometry(
                    0.5,
                    0.8,
                    4,
                    6
                );
                
                const statueMaterial = new THREE.MeshStandardMaterial({
                    color: 0xC0C0C0,
                    roughness: 0.5,
                    metalness: 0.3
                });
                
                const statue = new THREE.Mesh(statueGeometry, statueMaterial);
                statue.position.y = 3;
                group.add(statue);
                break;
                
            case 'fountain':
                // Create fountain
                const baseGeometry = new THREE.CylinderGeometry(
                    3,
                    3,
                    1,
                    16
                );
                
                const baseMaterial = new THREE.MeshStandardMaterial({
                    color: 0x4682B4,
                    roughness: 0.5,
                    metalness: 0.2
                });
                
                const base = new THREE.Mesh(baseGeometry, baseMaterial);
                base.position.y = 0.5;
                group.add(base);
                
                const centerGeometry = new THREE.CylinderGeometry(
                    1,
                    1.5,
                    2,
                    8
                );
                
                const center = new THREE.Mesh(centerGeometry, baseMaterial);
                center.position.y = 2;
                group.add(center);
                
                // Add water effect
                const waterGeometry = new THREE.CylinderGeometry(
                    1.2,
                    1.2,
                    0.2,
                    16
                );
                
                const waterMaterial = new THREE.MeshStandardMaterial({
                    color: 0x1E90FF,
                    transparent: true,
                    opacity: 0.7,
                    roughness: 0.1,
                    metalness: 0.5
                });
                
                const water = new THREE.Mesh(waterGeometry, waterMaterial);
                water.position.y = 1.1;
                group.add(water);
                break;
        }
        
        // Create physics body
        const shape = new CANNON.Box(new CANNON.Vec3(5, 5, 5));
        const body = new CANNON.Body({
            mass: 0,
            shape,
            position: new CANNON.Vec3(x, y + 5, z),
            material: game.physics.materials.default
        });
        
        return {
            id: `landmark_${name.toLowerCase().replace(' ', '_')}`,
            name,
            mesh: group,
            body,
            position: new THREE.Vector3(x, y, z)
        };
    }
}

// Weather System
class WeatherSystem {
    constructor({ scene, player, types, intensity, changeInterval }) {
        this.scene = scene;
        this.player = player;
        this.types = types;
        this.intensity = intensity;
        this.changeInterval = changeInterval;
        
        this.currentWeather = 'clear';
        this.nextChangeTime = 0;
        this.particles = [];
        this.audio = null;
    }
    
    start() {
        this.nextChangeTime = Date.now() + this.changeInterval * 1000;
        this.update();
    }
    
    update() {
        // Check if it's time to change weather
        if (Date.now() > this.nextChangeTime) {
            this.changeWeather();
            this.nextChangeTime = Date.now() + this.changeInterval * 1000;
        }
        
        // Update current weather effects
        switch (this.currentWeather) {
            case 'rain':
                this.updateRain();
                break;
            case 'snow':
                this.updateSnow();
                break;
            case 'sandstorm':
                this.updateSandstorm();
                break;
            case 'fog':
                this.updateFog();
                break;
        }
    }
    
    changeWeather() {
        // Remove previous weather effects
        this.clearWeather();
        
        // Select new weather type
        const newWeather = this.types[Math.floor(Math.random() * this.types.length)];
        this.currentWeather = newWeather;
        
        // Initialize new weather
        switch (newWeather) {
            case 'rain':
                this.initRain();
                break;
            case 'snow':
                this.initSnow();
                break;
            case 'sandstorm':
                this.initSandstorm();
                break;
            case 'fog':
                this.initFog();
                break;
        }
        
        // Update scene fog based on weather
        this.updateSceneFog();
    }
    
    clearWeather() {
        // Remove all weather particles
        this.particles.forEach(particle => {
            this.scene.remove(particle);
        });
        this.particles = [];
        
        // Stop any weather audio
        if (this.audio) {
            this.audio.stop();
            this.audio = null;
        }
    }
    
    updateSceneFog() {
        switch (this.currentWeather) {
            case 'clear':
                this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.0005);
                break;
            case 'rain':
                this.scene.fog = new THREE.FogExp2(0x666666, 0.0007);
                break;
            case 'snow':
                this.scene.fog = new THREE.FogExp2(0xDDDDFF, 0.0006);
                break;
            case 'sandstorm':
                this.scene.fog = new THREE.FogExp2(0xEDC9AF, 0.001);
                break;
            case 'fog':
                this.scene.fog = new THREE.FogExp2(0xAAAAAA, 0.0015);
                break;
        }
    }
    
    initRain() {
        // Create rain particles
        const rainCount = 1000;
        const rainGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);
        
        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1000;
            positions[i * 3 + 1] = Math.random() * 500;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
        }
        
        rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const rainMaterial = new THREE.PointsMaterial({
            color: 0xAAAAAA,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });
        
        const rain = new THREE.Points(rainGeometry, rainMaterial);
        this.scene.add(rain);
        this.particles.push(rain);
        
        // Create rain audio
        this.audio = new THREE.PositionalAudio(game.audio.listener);
        this.audio.setBuffer(game.assets.sounds.rain);
        this.audio.setRefDistance(20);
        this.audio.setLoop(true);
        this.audio.setVolume(this.intensity * 0.5);
        this.player.mesh.add(this.audio);
        this.audio.play();
    }
    
    updateRain() {
        if (this.particles.length > 0) {
            const rain = this.particles[0];
            const positions = rain.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] -= 10 * this.intensity;
                
                if (positions[i + 1] < -50) {
                    positions[i] = (Math.random() - 0.5) * 1000;
                    positions[i + 1] = Math.random() * 100 + 400;
                    positions[i + 2] = (Math.random() - 0.5) * 1000;
                }
            }
            
            rain.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    initSnow() {
        // Create snow particles
        const snowCount = 1500;
        const snowGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(snowCount * 3);
        
        for (let i = 0; i < snowCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1000;
            positions[i * 3 + 1] = Math.random() * 500;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
        }
        
        snowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const snowMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.2,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const snow = new THREE.Points(snowGeometry, snowMaterial);
        this.scene.add(snow);
        this.particles.push(snow);
    }
    
    updateSnow() {
        if (this.particles.length > 0) {
            const snow = this.particles[0];
            const positions = snow.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += (Math.random() - 0.5) * 0.5;
                positions[i + 1] -= 2 * this.intensity;
                positions[i + 2] += (Math.random() - 0.5) * 0.5;
                
                if (positions[i + 1] < -50) {
                    positions[i] = (Math.random() - 0.5) * 1000;
                    positions[i + 1] = Math.random() * 100 + 400;
                    positions[i + 2] = (Math.random() - 0.5) * 1000;
                }
            }
            
            snow.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    initSandstorm() {
        // Create sand particles
        const sandCount = 2000;
        const sandGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(sandCount * 3);
        
        for (let i = 0; i < sandCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1000;
            positions[i * 3 + 1] = Math.random() * 200;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
        }
        
        sandGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const sandMaterial = new THREE.PointsMaterial({
            color: 0F4A460, size: 1.5, transparent: true, opacity: 0.6});
const sand = new THREE.Points(sandGeometry, sandMaterial);
this.scene.add(sand);
this.particles.push(sand);
}

updateSandstorm() {
    if (this.particles.length > 0) {
        const sand = this.particles[0];
        const positions = sand.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += (Math.random() - 0.5) * 2;
            positions[i + 1] -= 3 * this.intensity;
            positions[i + 2] += (Math.random() - 0.5) * 2;
            if (positions[i + 1] < -50) {
                positions[i] = (Math.random() - 0.5) * 1000;
                positions[i + 1] = Math.random() * 200;
                positions[i + 2] = (Math.random() - 0.5) * 1000;
            }
        }
        sand.geometry.attributes.position.needsUpdate = true;
    }
}

// Change weather randomly
update(delta) {
    const now = Date.now();
    if (now > this.nextChangeTime) {
        // Choose a new weather type
        const weatherTypes = Object.keys(this.types);
        this.currentWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        this.nextChangeTime = now + this.changeInterval * 1000;

        // Update visual and audio effects
        this.updateFog();
        this.updateWeatherParticles();
        this.updateAudio();
    }

    // Update particle effects
    if (this.currentWeather === 'rain') this.updateRain();
    else if (this.currentWeather === 'snow') this.updateSnow();
    else if (this.currentWeather === 'sandstorm') this.updateSandstorm();
}

updateFog() {
    switch (this.currentWeather) {
        case 'clear':
            this.scene.fog = null;
            break;
        case 'rain':
            this.scene.fog = new THREE.FogExp2(0xAAAAAA, 0.0005);
            break;
        case 'snow':
            this.scene.fog = new THREE.FogExp2(0xDDDDFF, 0.0004);
            break;
        case 'sandstorm':
            this.scene.fog = new THREE.FogExp2(0xEDC9AF, 0.001);
            break;
        case 'fog':
            this.scene.fog = new THREE.FogExp2(0xAAAAAA, 0.0015);
            break;
    }
}
}

// --- Day Night Cycle System ---
class DayNightCycle {
constructor({ scene, camera, renderer, gameState, physicsWorld, ui }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.gameState = gameState;
    this.physicsWorld = physicsWorld;
    this.ui = ui;

    this.time = 0; // 0-24 hours
    this.cycleSpeed = 0.001; // How fast time passes
    this.sun = null;
    this.moon = null;
    this.skybox = null;
    this.sunLight = null;
    this.ambientLight = null;
    this.isNight = false;
}

setup() {
    // Create sun and moon lights
    this.sunLight = new THREE.DirectionalLight(0xFFFFDD, 1.0);
    this.sunLight.castShadow = true;
    this.scene.add(this.sunLight);

    const moonLight = new THREE.DirectionalLight(0xDDEEFF, 0.3);
    moonLight.castShadow = true;
    this.scene.add(moonLight);

    this.ambientLight = new THREE.AmbientLight(0x333333);
    this.scene.add(this.ambientLight);

    // Create skybox
    this.skybox = this.createSkybox();
    this.scene.add(this.skybox);
}

createSkybox() {
    const skyboxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
    const materials = [];
    for (let i = 0; i < 6; i++) {
        const texture = new THREE.TextureLoader().load(`assets/textures/skybox/skybox${i}.jpg`);
        materials.push(new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }));
    }
    return new THREE.Mesh(skyboxGeometry, materials);
}

update(delta) {
    this.time += delta * this.cycleSpeed;
    if (this.time >= 24) this.time = 0;

    // Update skybox and lighting
    this.updateSkybox();
    this.updateLighting();

    // Update UI clock
    this.ui.updateClock(this.time);
}

updateSkybox() {
    // Simple time-based sky color
    let skyColor;
    if (this.time < 6 || this.time >= 18) {
        skyColor = new THREE.Color(0x000011);
        this.isNight = true;
    } else {
        skyColor = new THREE.Color(0x87CEEB);
        this.isNight = false;
    }
    this.renderer.setClearColor(skyColor);
}

updateLighting() {
    // Sun position based on time of day
    const angle = (this.time / 24) * Math.PI * 2;
    const sunX = Math.sin(angle) * 100;
    const sunY = Math.cos(angle) * 50;
    const sunZ = Math.cos(angle) * 100;

    this.sunLight.position.set(sunX, sunY, sunZ);
    this.sunLight.intensity = Math.max(0, Math.cos(angle));
}
}

// --- Quest System ---
class QuestSystem {
constructor({ gameState, playerStats, playerInventory, ui, audio }) {
    this.gameState = gameState;
    this.playerStats = playerStats;
    this.playerInventory = playerInventory;
    this.ui = ui;
    this.audio = audio;
    this.quests = [
        new Quest({
            id: 'main_1',
            title: 'Awakening',
            description: 'You wake up in a strange land with no memory of how you got here.',
            objectives: [
                { id: 'explore', description: 'Explore the area', completed: false },
                { id: 'find_village', description: 'Find the nearby village', completed: false }
            ],
            rewards: { experience: 100, items: ['basic_sword'] },
            isMainQuest: true
        }),
        new Quest({
            id: 'main_2',
            title: 'The Elder\'s Request',
            description: 'The village elder needs your help with a mysterious problem.',
            objectives: [
                { id: 'talk_to_elder', description: 'Speak with the village elder', completed: false }
            ],
            rewards: { experience: 200, items: ['map_piece'] },
            isMainQuest: true
        })
    ];
}

startQuest(questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (quest && !this.gameState.activeQuests.includes(questId)) {
        this.gameState.activeQuests.push(questId);
        this.ui.showNotification(`Started quest: ${quest.title}`);
    }
}

completeObjective(questId, objectiveId) {
    const quest = this.quests.find(q => q.id === questId);
    if (quest) {
        const objective = quest.objectives.find(o => o.id === objectiveId);
        if (objective && !objective.completed) {
            objective.completed = true;
            this.ui.showNotification(`Completed objective: ${objective.description}`);
            if (quest.objectives.every(o => o.completed)) {
                this.completeQuest(quest);
            }
        }
    }
}

completeQuest(quest) {
    if (!this.gameState.completedQuests.includes(quest.id)) {
        this.playerStats.gainExperience(quest.rewards.experience);
        if (quest.rewards.items) {
            quest.rewards.items.forEach(itemId => {
                this.playerInventory.addItem(this.getItemById(itemId));
            });
        }
        this.gameState.completedQuests.push(quest.id);
        this.gameState.activeQuests = this.gameState.activeQuests.filter(id => id !== quest.id);
        this.ui.showQuestComplete(quest);
        this.audio.sfx.questComplete.play();
    }
}
}

// --- Inventory System ---
class Inventory {
constructor({ capacity = 30, quickSlots = 5 }) {
    this.items = [];
    this.capacity = capacity;
    this.quickSlots = Array(quickSlots).fill(null);
}

addItem(item) {
    if (this.items.length < this.capacity) {
        this.items.push(item);
        return true;
    }
    return false;
}

removeItem(itemId) {
    const index = this.items.findIndex(i => i.id === itemId);
    if (index !== -1) {
        this.items.splice(index, 1);
        return true;
    }
    return false;
}

useItem(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
        switch (item.type) {
            case 'consumable':
                this.useConsumable(item);
                break;
            case 'weapon':
                this.equipWeapon(item);
                break;
        }
        return true;
    }
    return false;
}

useConsumable(item) {
    // Apply effect
    console.log(`Using consumable: ${item.name}`);
    this.removeItem(item.id);
}

equipWeapon(item) {
    // Equip weapon
    console.log(`Equipping weapon: ${item.name}`);
}

getQuickSlotItem(slot) {
    return this.quickSlots[slot];
}
}

// --- UI System ---
class GameUI {
constructor({ gameState, playerStats, inventory, questSystem, renderer }) {
    this.gameState = gameState;
    this.playerStats = playerStats;
    this.inventory = inventory;
    this.questSystem = questSystem;
    this.renderer = renderer;

    this.hud = null;
    this.minimap = null;
    this.dialogueBox = null;
    this.questLog = null;
    this.inventoryUI = null;
    this.deathScreen = null;
    this.loadingScreen = null;
}

showMainMenu() {
    // Display main menu UI
    console.log("Showing main menu...");
}

showSettings(settings) {
    // Display settings menu
    console.log("Showing settings...");
}

showNotification(message) {
    // Show in-game notification
    console.log(`Notification: ${message}`);
}

showDamageIndicator(position, damage, source) {
    // Show damage indicator on screen
    console.log(`Damage: ${damage} from ${source}`);
}

showQuestComplete(quest) {
    // Show quest completion UI
    console.log(`Quest Complete: ${quest.title}`);
}

showErrorMessage(message) {
    // Show error message
    console.log(`Error: ${message}`);
}

updateClock(time) {
    // Update in-game clock
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    console.log(`Time: ${hours}:${minutes.toString().padStart(2, '0')}`);
}
}

// --- Main Game Class (BUKGame) - Continued ---
class BUKGame {
constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0, down: false };
    this.keys = {};
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
    this.gameState = {
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        gold: 0,
        activeQuests: [],
        completedQuests: [],
        settings: {
            graphics: 'high',
            controls: 'keyboard',
            audio: 0.7
        }
    };
    this.isPaused = false;
    this.debugMode = false;
    this.ui = new GameUI({ gameState: this.gameState, renderer: this.renderer });
    this.player = null;
    this.playerStats = null;
    this.playerInventory = new Inventory({});
    this.npcs = [];
    this.enemies = [];
    this.weatherSystem = new WeatherSystem({ scene: this.scene });
    this.dayNightCycle = new DayNightCycle({ scene: this.scene, camera: this.camera, renderer: this.renderer, gameState: this.gameState, physicsWorld: null, ui: this.ui });
    this.questSystem = new QuestSystem({ gameState: this.gameState, playerStats: this.playerStats, playerInventory: this.playerInventory, ui: this.ui, audio: {} });
}

async init() {
    await this.setupGraphics();
    this.setupAudio();
    this.setupInput();
    this.setupUI();
    await this.loadAssets();
    this.setupWorld();
    this.setupPlayer();
    this.setupNPCs();
    this.setupEnemies();
    this.setupQuests();
    this.setupWeather();
    this.setupDayNightCycle();
    this.showMainMenu();
}

setupGraphics() {
    // Setup renderer and post-processing
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0;
    bloomPass.strength = 1.5;
    bloomPass.radius = 0.5;
    this.composer.addPass(bloomPass);

    const ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
    ssaoPass.kernelRadius = 16;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.1;
    this.composer.addPass(ssaoPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
}

setupAudio() {
    this.audio.listener = new THREE.AudioListener();
    this.camera.add(this.audio.listener);

    this.audio.bgm = new THREE.Audio(this.audio.listener);
    this.audio.sfx = {
        attack: new THREE.Audio(this.audio.listener),
        damage: new THREE.Audio(this.audio.listener),
        questComplete: new THREE.Audio(this.audio.listener)
    };

    // Load sound files
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('assets/audio/bgm.mp3', buffer => {
        this.audio.bgm.setBuffer(buffer);
        this.audio.bgm.setLoop(true);
        this.audio.bgm.setVolume(this.gameState.settings.audio);
        this.audio.bgm.play();
    });

    audioLoader.load('assets/audio/attack.mp3', buffer => {
        this.audio.sfx.attack.setBuffer(buffer);
        this.audio.sfx.attack.setVolume(this.gameState.settings.audio);
    });
}

setupInput() {
    window.addEventListener('keydown', e => {
        this.keys[e.code] = true;
        if (e.code === 'KeyE') this.useQuickSlot(0);
        if (e.code === 'Escape') this.togglePause();
    });

    window.addEventListener('keyup', e => {
        this.keys[e.code] = false;
    });

    window.addEventListener('mousedown', e => {
        if (e.button === 0) this.handlePrimaryAttack();
    });
}

gameLoop() {
    this.stats.begin();
    const delta = this.clock.getDelta();

    if (!this.isPaused) {
        this.updatePlayer(delta);
        this.updateEnemies(delta);
        this.updatePhysics(delta);
        this.updateWeather(delta);
        this.updateDayNightCycle(delta);
        this.updateUI(delta);
    }

    this.composer.render(delta);
    this.stats.end();
    requestAnimationFrame(() => this.gameLoop());
}

updatePlayer(delta) {
    // Handle player movement, animation, etc.
}

updateEnemies(delta) {
    // Update enemy AI and behavior
}

updatePhysics(delta) {
    // Update CANNON physics world
}

updateWeather(delta) {
    this.weatherSystem.update(delta);
}

updateDayNightCycle(delta) {
    this.dayNightCycle.update(delta);
}

updateUI(delta) {
    // Update HUD, minimap, etc.
}

togglePause() {
    this.isPaused = !this.isPaused;
    this.ui.showPauseMenu(this.isPaused);
}

toggleDebugMode() {
    this.debugMode = !this.debugMode;
    this.ui.showDebugOverlay(this.debugMode);
}
}

// Start the game
window.addEventListener('load', () => {
    const game = new BUKGame();
    game.init();
    game.gameLoop();
});
