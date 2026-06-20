// Upgraded Website Interactions & Animations with Estimator and Roadmap Stepper

function initMainApp() {
    // Register GSAP plugins
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // 1. Initialize AOS (Animate on Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 900,
            easing: 'ease-out-cubic',
            once: true,
            mirror: false
        });
    } else {
        console.warn("AOS library not loaded");
    }

    // 2. Interactive Spotlight Tracker for Cards
    setupSpotlightCards();

    // 3. 3D Tilt Card Calculations (refined with smooth reset transition)
    setup3DTiltCards();

    // 4. GSAP ScrollTrigger & Parallax Animations
    if (typeof gsap !== 'undefined') {
        setupGSAPScrollAnimations();
    }

    // 5. Scroll-Triggered Animated Stats Counter
    setupStatsCounter();

    // 6. Project Filters
    setupProjectFilters();

    // 7. Modals 3D Hook
    setupProjectModals();

    // 8. Leaflet Interactive map
    initMap();

    // 9. Forms Interceptors & Feedback Overlays
    setupFormHandlers();

    // 10. NEW: Interactive 3D Visualizer Mode Controller
    setup3DModeController();

    // 11. NEW: Interactive Project Cost Estimator Calculator
    setupCostEstimator();

    // 12. NEW: Interactive Construction Steps Roadmap Stepper
    setupRoadmapStepper();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initMainApp();
} else {
    document.addEventListener('DOMContentLoaded', initMainApp);
}


/**
 * Tracks the mouse position over cards to update CSS variables for radial spotlight glows
 */
function setupSpotlightCards() {
    // Select cards that should receive the spotlight hover glow
    const spotlightSelectors = '.spotlight-card, .stats-card, .value-card, .service-card, .blog-card, .contact-info-card, .contact-form-container';
    
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll(spotlightSelectors);
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

/**
 * Calculates mouse coordinates relative to card center and tilts the cards in 3D
 */
function setup3DTiltCards() {
    const cards = document.querySelectorAll('.service-card');
    cards.forEach(card => {
        card.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s, background 0.4s';
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const tiltX = ((centerY - y) / centerY) * 8;
            const tiltY = ((x - centerX) / centerX) * 8;
            
            card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02) translateZ(10px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s, background 0.4s';
            card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1) translateZ(0)';
        });
    });
}

/**
 * Custom GSAP Timeline and ScrollTrigger stagger entrances
 */
function setupGSAPScrollAnimations() {
    // A. Hero Section Timed Entry
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.navbar', { y: -100, opacity: 0, duration: 1.4 })
      .from('.hero-badge', { scale: 0.85, opacity: 0, duration: 0.8 }, '-=0.8')
      .from('.hero-title', { y: 60, opacity: 0, duration: 1.2 }, '-=0.6')
      .from('.hero-desc', { y: 40, opacity: 0, duration: 1.0 }, '-=0.8')
      .from('.hero-cta .btn', { y: 30, opacity: 0, duration: 0.8, stagger: 0.25 }, '-=0.7')
      .from('.hero-3d-container', { scale: 0.92, opacity: 0, duration: 1.6 }, '-=1.2');

    // Hero timed entry is executed. Scroll staggers are handled by AOS to prevent rendering conflicts.
}

/**
 * Animated statistics counters triggered on intersection
 */
function setupStatsCounter() {
    const statsSection = document.querySelector('.stats-section');
    const counters = document.querySelectorAll('.stats-number');
    let countersAnimated = false;

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const suffix = counter.getAttribute('data-suffix') || '';
            const duration = 2200;
            const startTime = performance.now();

            const updateCount = (timestamp) => {
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentVal = Math.floor(easeProgress * target);

                counter.innerText = currentVal.toLocaleString() + suffix;

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    counter.innerText = target.toLocaleString() + suffix;
                }
            };
            requestAnimationFrame((timestamp) => updateCount(timestamp));
        });
    };

    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !countersAnimated) {
                animateCounters();
                countersAnimated = true;
            }
        }, { threshold: 0.25 });

        observer.observe(statsSection);
    }
}

/**
 * Project filter logic
 */
function setupProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectItems = document.querySelectorAll('.project-item');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            projectItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.88)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
        });
    });
}

/**
 * Modals project canvases configurations
 */
function setupProjectModals() {
    const projectModals = document.querySelectorAll('.project-modal');
    projectModals.forEach(modal => {
        modal.addEventListener('shown.bs.modal', () => {
            const canvas = modal.querySelector('.modal-canvas');
            const projectType = modal.getAttribute('data-project-type');
            if (canvas && projectType) {
                initProject3D(canvas.id, projectType);
            }
        });

        modal.addEventListener('hidden.bs.modal', () => {
            const canvas = modal.querySelector('.modal-canvas');
            if (canvas && activeModalRenderers[canvas.id]) {
                activeModalRenderers[canvas.id].stop();
                delete activeModalRenderers[canvas.id];
            }
        });
    });
}

/**
 * Custom dark-styled Leaflet map HQ setup
 */
function initMap() {
    const mapContainer = document.getElementById('contact-map');
    if (!mapContainer) return;

    if (typeof L === 'undefined') {
        console.warn("Leaflet library not loaded");
        mapContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 400px; border: 1px solid var(--glass-border); border-radius: 20px; background: rgba(2,5,14,0.65); color: var(--gold-royal); font-family: 'Cairo', sans-serif;">الخريطة التفاعلية غير متوفرة لعدم الاتصال بالإنترنت</div>`;
        return;
    }

    const lat = 24.7077;
    const lng = 46.6739;

    const map = L.map('contact-map', {
        scrollWheelZoom: false,
        zoomControl: false
    }).setView([lat, lng], 15);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    const goldIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="
            width: 26px;
            height: 26px;
            background: var(--gold-gradient);
            border: 4px solid var(--primary-dark);
            border-radius: 50%;
            box-shadow: var(--gold-glow-strong);
            animation: pulse 2.5s infinite;
        "></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
    });

    const marker = L.marker([lat, lng], { icon: goldIcon }).addTo(map);
    
    marker.bindPopup(`
        <div style="font-family: 'Cairo', sans-serif; text-align: right; direction: rtl; padding: 5px;">
            <h6 style="color: var(--gold-royal); font-weight: 800; margin-bottom: 5px; font-size: 1.05rem;">مقر أركان القوة للمقاولات</h6>
            <p style="margin: 0; font-size: 0.85rem; color: var(--text-pearl); line-height: 1.5;">برج المطورين، الطابق 14، حي العليا، الرياض</p>
        </div>
    `).openPopup();
}

/**
 * Form submissions intercepts
 */
function setupFormHandlers() {
    const forms = [
        { id: 'quote-form', successTitle: 'تم استلام طلب السعر بنجاح', successMsg: 'لقد تمت أرشفة بيانات مشروعك الهندسي بنجاح. سيقوم مستشارونا الفنيون بدراسة المخططات وتقدير التكلفة وإرسال كراسة الشروط الفنية خلال 24 ساعة.' },
        { id: 'contact-form', successTitle: 'تم إرسال استفسارك بنجاح', successMsg: 'شكراً لتواصلك مع مجموعة أركان القوة. تم تحويل الرسالة إلى القسم المختص، وسيتم الاتصال بك هاتفياً أو عبر البريد الإلكتروني قريباً.' },
        { id: 'career-form', successTitle: 'تم حفظ طلب التوظيف في قاعدة البيانات', successMsg: 'تلقينا مستنداتك ورابط سيرتك الذاتية بنجاح. سيقوم قسم الموارد البشرية (Talent Acquisition) بالتواصل معك في حال مطابقة خبراتك لاحتياجات مشاريعنا الحالية.' },
        { id: 'newsletter-form', successTitle: 'تم تفعيل اشتراكك الإخباري', successMsg: 'مرحباً بك في نشرتنا البريدية المعرفية. ستتلقى دورياً تقاريرنا الحصرية حول مواد البناء الأخضر والتقنيات المعمارية الحديثة.' }
    ];

    forms.forEach(formConfig => {
        const formEl = document.getElementById(formConfig.id);
        if (!formEl) return;

        formEl.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = formEl.querySelector('[type="submit"]');
            const originalBtnContent = submitBtn ? submitBtn.innerHTML : '';
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true" style="margin-left: 8px;"></span> جاري معالجة البيانات...';
            }

            setTimeout(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                }

                const modalEl = formEl.closest('.modal');
                if (modalEl && typeof bootstrap !== 'undefined') {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }

                showSuccessNotification(formConfig.successTitle, formConfig.successMsg);
                formEl.reset();

            }, 1600);
        });
    });
}

/**
 * Success modal notification overlay
 */
function showSuccessNotification(title, message) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(2, 5, 14, 0.88);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.5s ease;
    `;

    const card = document.createElement('div');
    card.className = 'glass-panel text-center';
    card.style.cssText = `
        padding: 4rem 3rem;
        max-width: 550px;
        margin: 1.5rem;
        border-color: rgba(212, 175, 55, 0.45);
        box-shadow: 0 25px 50px rgba(0,0,0,0.8), var(--gold-glow);
        transform: scale(0.88);
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        direction: rtl;
    `;

    card.innerHTML = `
        <div style="
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: rgba(212, 175, 55, 0.08);
            border: 2px solid #d4af37;
            color: #d4af37;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            margin: 0 auto 2.5rem;
            box-shadow: var(--gold-glow-strong);
            animation: pulse 2s infinite;
        ">
            <i class="fa-solid fa-check"></i>
        </div>
        <h4 style="color: #ffffff; font-weight: 900; font-size: 1.7rem; margin-bottom: 1.2rem;">${title}</h4>
        <p style="color: var(--text-gray); font-size: 1.05rem; margin-bottom: 2.5rem; line-height: 1.8;">${message}</p>
        <button class="btn btn-gold w-100" style="padding: 0.9rem;">حسناً، إغلاق الإشعار</button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.opacity = '1';
        card.style.transform = 'scale(1)';
    }, 50);

    const closeBtn = card.querySelector('button');
    const closeNotification = () => {
        overlay.style.opacity = '0';
        card.style.transform = 'scale(0.88)';
        setTimeout(() => {
            overlay.remove();
        }, 500);
    };

    closeBtn.addEventListener('click', closeNotification);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeNotification();
        }
    });
}

/**
 * 3D visualizer mode controller buttons bind
 */
function setup3DModeController() {
    const buttons = document.querySelectorAll('.control-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const mode = btn.getAttribute('data-mode');
            if (window.setSkyscraperMode) {
                window.setSkyscraperMode(mode);
            }
        });
    });
}

/**
 * Cost Estimator Calculator logic
 */
function setupCostEstimator() {
    const areaInput = document.getElementById('est-area');
    const areaValueLabel = document.getElementById('est-area-value');
    const typeSelect = document.getElementById('est-type');
    const qualitySelect = document.getElementById('est-quality');
    
    const costOutput = document.getElementById('est-cost-val');
    const timeOutput = document.getElementById('est-time-val');
    const laborOutput = document.getElementById('est-labor-val');

    if (!areaInput || !typeSelect || !qualitySelect) return;

    // Helper to smoothly animate numeric calculations
    const animateNumericValue = (element, targetValue, duration = 800, isCurrency = false) => {
        const start = parseInt(element.innerText.replace(/[^0-9]/g, '')) || 0;
        const startTime = performance.now();

        const run = (timestamp) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // Cubic deceleration
            const current = Math.floor(start + (targetValue - start) * ease);

            if (isCurrency) {
                element.innerText = current.toLocaleString() + ' ر.س';
            } else {
                element.innerText = current.toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(run);
            } else {
                if (isCurrency) {
                    element.innerText = targetValue.toLocaleString() + ' ر.س';
                } else {
                    element.innerText = targetValue.toLocaleString();
                }
            }
        };
        requestAnimationFrame((timestamp) => run(timestamp));
    };

    const calculateEstimations = () => {
        const area = parseInt(areaInput.value);
        areaValueLabel.innerText = area.toLocaleString();

        const type = typeSelect.value;
        const quality = qualitySelect.value;

        // Base configurations [cost/sqm, duration multiplier, labor multiplier]
        let baseConfig = [1500, 0.005, 0.04]; // residential default
        if (type === 'commercial') {
            baseConfig = [2600, 0.007, 0.06];
        } else if (type === 'industrial') {
            baseConfig = [1200, 0.003, 0.03];
        } else if (type === 'infrastructure') {
            baseConfig = [3500, 0.009, 0.08];
        }

        // Quality configurations
        let qualityFactor = 1.0;
        let qualityTimeFactor = 1.0;
        if (quality === 'luxury') {
            qualityFactor = 1.6;
            qualityTimeFactor = 1.25;
        } else if (quality === 'ultra') {
            qualityFactor = 2.4;
            qualityTimeFactor = 1.45;
        }

        // Math totals
        const totalCost = area * baseConfig[0] * qualityFactor;
        const totalTime = Math.max(5, Math.round(area * baseConfig[1] * qualityTimeFactor));
        const totalLabor = Math.max(8, Math.round(area * baseConfig[2]));

        // Animate calculations
        animateNumericValue(costOutput, totalCost, 600, true);
        animateNumericValue(timeOutput, totalTime, 600, false);
        animateNumericValue(laborOutput, totalLabor, 600, false);
    };

    // Calculate immediately on load
    calculateEstimations();

    // Event listeners
    areaInput.addEventListener('input', calculateEstimations);
    typeSelect.addEventListener('change', calculateEstimations);
    qualitySelect.addEventListener('change', calculateEstimations);
}

/**
 * Roadmap Steps stepper setup
 */
function setupRoadmapStepper() {
    const stepsData = [
        {
            title: 'دراسة الموقع وفحص التربة الجيوتقني',
            desc: 'يقوم مهندسونا الاستشاريون بفحص التربة ومسح الأرض لتحديد القواعد الإنشائية ونظم التدعيم الملائمة وحساب الأحمال المناسبة لتفادي أي هبوط هيكلي مستقبلاً.',
            icon: 'fa-solid fa-compass-drafting'
        },
        {
            title: 'التصميم الهندسي ونمذجة معلومات البناء BIM',
            desc: 'تطوير الرسومات ثلاثية الأبعاد ونمذجة تفاصيل الأنابيب والتكييف وتفادي تعارض الكابلات والأنظمة الميكانيكية رقمياً لتقليص نسب الهدر وسرعة التشييد.',
            icon: 'fa-solid fa-laptop-code'
        },
        {
            title: 'التأسيس والأعمال الخرسانية والهيكل الإنشائي',
            desc: 'حفر الأساسات وصب الخرسانة المسلحة وتأمين المنشأ وتشييد القوالب والهياكل المعدنية ونظام شد الخرسانة اللاحق (Post-Tension) للمباني الشاهقة.',
            icon: 'fa-solid fa-helmet-safety'
        },
        {
            title: 'التشطيبات الفاخرة والديكور والأنظمة الذكية',
            desc: 'تكسية الواجهات الخارجية بالزجاج الموفر للحرارة، وتشطيب الجدران والأرضيات الداخلية بأرقى الرخام الطبيعي ودمج شبكات الكهرباء الذكية.',
            icon: 'fa-solid fa-brush'
        },
        {
            title: 'التسليم الإنشائي والتشغيل وتدبير المرافق',
            desc: 'إجراء اختبارات التشغيل كهروميكانيكية المتكاملة، ومطابقة اشتراطات كفاءة الطاقة الخضراء والـ LEED، وتسليم كود المفاتيح وبدء خطة الصيانة الدورية.',
            icon: 'fa-solid fa-key'
        }
    ];

    const triggers = document.querySelectorAll('.roadmap-step-trigger');
    const progressFill = document.querySelector('.roadmap-line-fill');
    
    const displayCard = document.getElementById('roadmap-display-card');
    const displayIcon = displayCard ? displayCard.querySelector('.roadmap-card-icon i') : null;
    const displayTitle = displayCard ? displayCard.querySelector('h4') : null;
    const displayDesc = displayCard ? displayCard.querySelector('p') : null;

    if (!triggers.length || !progressFill || !displayCard) return;

    const setStep = (index) => {
        // Toggle active button
        triggers.forEach((btn, idx) => {
            if (idx <= index) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Set line progress fill width (0%, 25%, 50%, 75%, 100%)
        const percentage = (index / (triggers.length - 1)) * 100;
        progressFill.style.width = `${percentage}%`;

        // Smooth transition display contents
        if (typeof gsap !== 'undefined') {
            gsap.to(displayCard, {
                y: 15,
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    displayIcon.className = stepsData[index].icon;
                    displayTitle.innerText = stepsData[index].title;
                    displayDesc.innerText = stepsData[index].desc;
                    
                    gsap.to(displayCard, {
                        y: 0,
                        opacity: 1,
                        duration: 0.4,
                        ease: 'power3.out'
                    });
                }
            });
        } else {
            // CSS Fallback
            displayCard.style.opacity = 0;
            setTimeout(() => {
                displayIcon.className = stepsData[index].icon;
                displayTitle.innerText = stepsData[index].title;
                displayDesc.innerText = stepsData[index].desc;
                displayCard.style.opacity = 1;
            }, 300);
        }
    };

    // Auto roadmap transition interval or hover/click triggers
    triggers.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            setStep(idx);
        });
    });

    // Default set step 0
    setStep(0);
}
