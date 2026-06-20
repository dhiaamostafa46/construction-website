// Main Website Interactions & Animations

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize AOS (Animate on Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-out-quad',
        once: true,
        mirror: false
    });

    // 2. GSAP Hero Section Intro Animations
    if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        
        tl.from('.navbar', { y: -80, opacity: 0, duration: 1.2 })
          .from('.hero-badge', { y: 30, opacity: 0, duration: 0.8 }, '-=0.6')
          .from('.hero-title', { y: 40, opacity: 0, duration: 1.0 }, '-=0.6')
          .from('.hero-desc', { y: 30, opacity: 0, duration: 0.8 }, '-=0.6')
          .from('.hero-cta .btn', { y: 20, opacity: 0, duration: 0.6, stagger: 0.2 }, '-=0.5')
          .from('.hero-3d-container', { scale: 0.9, opacity: 0, duration: 1.5 }, '-=1.0');
    }

    // 3. Navbar scroll effect
    const navbar = document.querySelector('.custom-navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 4. Interactive 3D Tilt Effect for Service Cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x coordinate within client
            const y = e.clientY - rect.top;  // y coordinate within client
            
            // Calculate tilt angle based on mouse coordinates relative to center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Limit tilt angle to max 12 degrees
            const tiltX = ((centerY - y) / centerY) * 12;
            const tiltY = ((x - centerX) / centerX) * 12;
            
            card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.03)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });

    // 5. Scroll-Triggered Animated Stats Counter
    const statsSection = document.querySelector('.stats-section');
    const counters = document.querySelectorAll('.stats-number');
    let countersAnimated = false;

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000; // 2 seconds animation
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = target / steps;
            let current = 0;

            const updateCount = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current).toLocaleString();
                    setTimeout(updateCount, stepTime);
                } else {
                    counter.innerText = target.toLocaleString() + (counter.getAttribute('data-suffix') || '');
                }
            };
            updateCount();
        });
    };

    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !countersAnimated) {
                animateCounters();
                countersAnimated = true;
            }
        }, { threshold: 0.3 });

        observer.observe(statsSection);
    }

    // 6. Portfolio Projects Filter System
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectItems = document.querySelectorAll('.project-item');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle active button class
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            projectItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                // Hide with transition, then toggle display, then show with animation
                if (filterValue === 'all' || category === filterValue) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.85)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // 7. Initialize Project Detail 3D models when modals open
    const projectModals = document.querySelectorAll('.project-modal');
    projectModals.forEach(modal => {
        modal.addEventListener('shown.bs.modal', () => {
            const canvasId = modal.querySelector('.modal-canvas').id;
            const projectType = modal.getAttribute('data-project-type');
            if (canvasId && projectType) {
                initProject3D(canvasId, projectType);
            }
        });

        modal.addEventListener('hidden.bs.modal', () => {
            const canvas = modal.querySelector('.modal-canvas');
            if (canvas && activeModalRenderers[canvas.id]) {
                // Call cleanup function
                activeModalRenderers[canvas.id].stop();
                delete activeModalRenderers[canvas.id];
            }
        });
    });

    // 8. Interactive Dark styled Leaflet Map (Riyadh Headquarters Location)
    initMap();

    // 9. Forms Interceptors & Feedback Overlays
    setupFormHandlers();
});

/**
 * Initializes the Leaflet Map with Riyadh HQ Coordinates
 */
function initMap() {
    const mapContainer = document.getElementById('contact-map');
    if (!mapContainer) return;

    // Riyadh Olaya District Headquarters coordinates
    const lat = 24.7077;
    const lng = 46.6739;

    const map = L.map('contact-map', {
        scrollWheelZoom: false
    }).setView([lat, lng], 15);

    // Load open street map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Custom Gold Icon Marker
    const goldIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #ffd700 0%, #d4af37 100%);
            border: 3px solid #050c18;
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(212, 175, 55, 0.8);
            animation: pulse 2.5s infinite;
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    const marker = L.marker([lat, lng], { icon: goldIcon }).addTo(map);
    
    // Popup styled popup
    marker.bindPopup(`
        <div style="font-family: 'Cairo', sans-serif; text-align: right; direction: rtl;">
            <h6 style="color: #d4af37; font-weight: 700; margin-bottom: 5px;">مقر شركة المقاولات الفاخرة</h6>
            <p style="margin: 0; font-size: 0.85rem; color: #f3f4f6;">حي العليا، الرياض، المملكة العربية السعودية</p>
        </div>
    `).openPopup();
}

/**
 * Sets up custom interceptors for form submissions to show elegant overlays
 */
function setupFormHandlers() {
    const forms = [
        { id: 'quote-form', successTitle: 'تم إرسال طلب السعر بنجاح', successMsg: 'سيقوم مهندسونا بمراجعة تفاصيل مشروعك والتواصل معك خلال 24 ساعة لتقديم عرض تفصيلي.' },
        { id: 'contact-form', successTitle: 'تم إرسال رسالتك بنجاح', successMsg: 'شكراً لتواصلك معنا. سنقوم بالرد على استفسارك عبر البريد الإلكتروني أو الهاتف في أقرب وقت.' },
        { id: 'career-form', successTitle: 'تم تقديم طلب التوظيف بنجاح', successMsg: 'تلقينا سيرتك الذاتية واهتمامك بالانضمام لفريقنا. سيقوم فريق الموارد البشرية بالتواصل معك في حال تطابق المؤهلات.' },
        { id: 'newsletter-form', successTitle: 'تم الاشتراك بنجاح', successMsg: 'تمت إضافتك إلى القائمة البريدية. سنبقيك على اطلاع بأحدث تقنيات وأخبار قطاع الإنشاءات.' }
    ];

    forms.forEach(formConfig => {
        const formEl = document.getElementById(formConfig.id);
        if (!formEl) return;

        formEl.addEventListener('submit', (e) => {
            e.preventDefault();

            // Find submit button and change to loading state
            const submitBtn = formEl.querySelector('[type="submit"]');
            const originalBtnContent = submitBtn ? submitBtn.innerHTML : '';
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true"></span> جاري الإرسال...';
            }

            // Simulate server network latency
            setTimeout(() => {
                // Reset button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                }

                // Close bootstrap modal if form was inside one (e.g. Careers, Quote)
                const modalEl = formEl.closest('.modal');
                if (modalEl) {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }

                // Show elegant visual modal success notification overlay
                showSuccessNotification(formConfig.successTitle, formConfig.successMsg);

                // Reset form inputs
                formEl.reset();

            }, 1800);
        });
    });
}

/**
 * Shows an elegant glassmorphism popup notification on success
 */
function showSuccessNotification(title, message) {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(3, 7, 18, 0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.5s ease;
    `;

    // Create central glass panel card
    const card = document.createElement('div');
    card.className = 'glass-panel text-center';
    card.style.cssText = `
        padding: 3rem 2.5rem;
        max-width: 500px;
        margin: 1.5rem;
        border-color: rgba(212, 175, 55, 0.4);
        box-shadow: 0 15px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.2);
        transform: scale(0.9);
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        direction: rtl;
    `;

    card.innerHTML = `
        <div style="
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(212, 175, 55, 0.1);
            border: 2px solid #d4af37;
            color: #d4af37;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.2rem;
            margin: 0 auto 2rem;
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
        ">
            <i class="fa-solid fa-check"></i>
        </div>
        <h4 style="color: #ffffff; font-weight: 800; font-size: 1.6rem; margin-bottom: 1rem;">${title}</h4>
        <p style="color: #9ca3af; font-size: 1rem; margin-bottom: 2rem; line-height: 1.6;">${message}</p>
        <button class="btn btn-gold w-100" style="padding: 0.8rem;">حسناً، إغلاق</button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Animate In
    setTimeout(() => {
        overlay.style.opacity = '1';
        card.style.transform = 'scale(1)';
    }, 50);

    // Wire up close button
    const closeBtn = card.querySelector('button');
    const closeNotification = () => {
        overlay.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
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
