(function() {
    'use strict';

    if (window.__appInitialized) return;
    window.__appInitialized = true;

    const CONFIG = {
        headerHeight: 80,
        headerHeightMobile: 64,
        breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1280
        },
        animationDuration: 300,
        scrollOffset: 120,
        debounceDelay: 250,
        throttleDelay: 100
    };

    const VALIDATORS = {
        name: {
            pattern: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
            message: 'Name muss 2-50 Zeichen enthalten und darf nur Buchstaben, Leerzeichen, Bindestriche und Apostrophe enthalten'
        },
        firstName: {
            pattern: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
            message: 'Vorname muss 2-50 Zeichen enthalten'
        },
        lastName: {
            pattern: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
            message: 'Nachname muss 2-50 Zeichen enthalten'
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
        },
        phone: {
            pattern: /^[\d\s+\-()]{10,20}$/,
            message: 'Telefonnummer muss 10-20 Zeichen enthalten'
        },
        message: {
            minLength: 10,
            message: 'Nachricht muss mindestens 10 Zeichen enthalten'
        }
    };

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function getHeaderHeight() {
        const header = document.querySelector('.l-header');
        return header ? header.offsetHeight : (window.innerWidth < CONFIG.breakpoints.mobile ? CONFIG.headerHeightMobile : CONFIG.headerHeight);
    }

    class BurgerMenuManager {
        constructor() {
            this.nav = document.querySelector('.c-nav#main-nav') || document.querySelector('nav.navbar');
            this.toggle = document.querySelector('.navbar-toggler');
            this.collapse = document.querySelector('.navbar-collapse');
            this.navLinks = document.querySelectorAll('.nav-link');
            this.body = document.body;
            this.isOpen = false;

            if (this.toggle && this.collapse) {
                this.init();
            }
        }

        init() {
            this.toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMenu();
            });

            this.navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (this.isOpen) this.closeMenu();
                });
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeMenu();
                    this.toggle.focus();
                }
            });

            document.addEventListener('click', (e) => {
                if (this.isOpen && this.nav && !this.nav.contains(e.target)) {
                    this.closeMenu();
                }
            });

            window.addEventListener('resize', debounce(() => {
                if (window.innerWidth >= CONFIG.breakpoints.tablet && this.isOpen) {
                    this.closeMenu();
                }
            }, CONFIG.debounceDelay));
        }

        toggleMenu() {
            this.isOpen ? this.closeMenu() : this.openMenu();
        }

        openMenu() {
            this.isOpen = true;
            this.collapse.classList.add('show');
            this.toggle.classList.remove('collapsed');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.body.classList.add('u-no-scroll');
            
            const firstFocusable = this.collapse.querySelector('a, button');
            if (firstFocusable) firstFocusable.focus();
        }

        closeMenu() {
            this.isOpen = false;
            this.collapse.classList.remove('show');
            this.toggle.classList.add('collapsed');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.body.classList.remove('u-no-scroll');
        }
    }

    class SmoothScrollManager {
        constructor() {
            this.isHomepage = ['/', '/index.html'].some(path => 
                window.location.pathname === path || window.location.pathname.endsWith(path)
            );
            this.init();
        }

        init() {
            if (!this.isHomepage) {
                this.convertSectionLinks();
            }

            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (!link) return;

                const href = link.getAttribute('href');
                if (!href || href === '#' || href === '#!' || href.length <= 1) return;

                if (this.isHomepage) {
                    e.preventDefault();
                    this.scrollToTarget(href.substring(1));
                }
            });
        }

        convertSectionLinks() {
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                const href = link.getAttribute('href');
                if (href && href !== '#' && href !== '#!' && href.length > 1) {
                    link.setAttribute('href', '/' + href);
                }
            });
        }

        scrollToTarget(targetId) {
            const target = document.getElementById(targetId);
            if (!target) return;

            const headerHeight = getHeaderHeight();
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: 'smooth'
            });
        }
    }

    class ActiveMenuManager {
        constructor() {
            this.currentPath = window.location.pathname;
            this.navLinks = document.querySelectorAll('.nav-link');
            this.init();
        }

        init() {
            this.navLinks.forEach(link => {
                const linkPath = link.getAttribute('href');
                link.removeAttribute('aria-current');
                link.classList.remove('active');

                const isActive = this.isLinkActive(linkPath);
                if (isActive) {
                    link.setAttribute('aria-current', 'page');
                    link.classList.add('active');
                }
            });
        }

        isLinkActive(linkPath) {
            if (linkPath === this.currentPath) return true;
            if (linkPath === '/' && ['/', '/index.html'].some(path => 
                this.currentPath === path || this.currentPath.endsWith(path)
            )) return true;
            return false;
        }
    }

    class ScrollSpyManager {
        constructor() {
            this.sections = document.querySelectorAll('section[id]');
            this.navLinks = document.querySelectorAll('.nav-link[href^="#"]');
            
            if (this.sections.length && this.navLinks.length) {
                this.init();
            }
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.setActiveLink(entry.target.id);
                    }
                });
            }, {
                rootMargin: `-${getHeaderHeight()}px 0px -70% 0px`,
                threshold: 0
            });

            this.sections.forEach(section => observer.observe(section));
        }

        setActiveLink(sectionId) {
            this.navLinks.forEach(link => {
                const href = link.getAttribute('href');
                link.classList.toggle('active', href === `#${sectionId}`);
            });
        }
    }

    class ImagesManager {
        constructor() {
            this.images = document.querySelectorAll('img');
            this.init();
        }

        init() {
            this.images.forEach(img => {
                if (!img.hasAttribute('loading') && 
                    !img.classList.contains('c-logo__img') && 
                    !img.hasAttribute('data-critical')) {
                    img.setAttribute('loading', 'lazy');
                }

                if (!img.classList.contains('img-fluid')) {
                    img.classList.add('img-fluid');
                }

                img.addEventListener('error', this.handleImageError.bind(this, img), { once: true });
            });
        }

        handleImageError(img) {
            if (img.dataset.fallbackApplied) return;
            img.dataset.fallbackApplied = 'true';

            const fallbackSvg = 'data:image/svg+xml;base64,' + btoa(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
                '<rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6"/>' +
                '<text x="200" y="150" font-family="Arial, sans-serif" font-size="14" fill="#6c757d" text-anchor="middle">Bild nicht verfügbar</text>' +
                '</svg>'
            );

            img.src = fallbackSvg;
            img.style.objectFit = 'contain';
        }
    }

    class FormValidationManager {
        constructor() {
            this.forms = document.querySelectorAll('form.c-form, form.needs-validation');
            this.notificationContainer = this.createNotificationContainer();
            this.init();
        }

        createNotificationContainer() {
            let container = document.getElementById('notification-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notification-container';
                container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:350px;';
                document.body.appendChild(container);
            }
            return container;
        }

        init() {
            this.forms.forEach(form => {
                this.setupFormValidation(form);
                this.addRealTimeValidation(form);
            });
        }

        setupFormValidation(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const submitBtn = form.querySelector('button[type="submit"]');
                const isValid = this.validateForm(form);

                if (isValid) {
                    this.submitForm(form, submitBtn);
                }
            });
        }

        addRealTimeValidation(form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', debounce(() => {
                    if (input.classList.contains('is-invalid')) {
                        this.validateField(input);
                    }
                }, 300));
            });
        }

        validateForm(form) {
            let isValid = true;
            const fields = form.querySelectorAll('input, textarea, select');

            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            return isValid;
        }

        validateField(field) {
            const fieldName = field.name || field.id;
            const fieldValue = field.value.trim();
            const fieldType = field.type;
            const isRequired = field.hasAttribute('required');

            this.clearFieldError(field);

            if (isRequired && !fieldValue) {
                this.showFieldError(field, 'Dieses Feld ist erforderlich');
                return false;
            }

            if (fieldType === 'checkbox' && isRequired && !field.checked) {
                this.showFieldError(field, 'Bitte bestätigen Sie dieses Feld');
                return false;
            }

            if (fieldValue) {
                const validator = VALIDATORS[fieldName];
                if (validator) {
                    if (validator.pattern && !validator.pattern.test(fieldValue)) {
                        this.showFieldError(field, validator.message);
                        return false;
                    }
                    if (validator.minLength && fieldValue.length < validator.minLength) {
                        this.showFieldError(field, validator.message);
                        return false;
                    }
                }
            }

            this.showFieldSuccess(field);
            return true;
        }

        showFieldError(field, message) {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');

            let errorElement = field.parentElement.querySelector('.invalid-feedback');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'invalid-feedback';
                field.parentElement.appendChild(errorElement);
            }
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        showFieldSuccess(field) {
            if (field.type !== 'checkbox' && field.value.trim()) {
                field.classList.add('is-valid');
                field.classList.remove('is-invalid');
            }
        }

        clearFieldError(field) {
            field.classList.remove('is-invalid', 'is-valid');
            const errorElement = field.parentElement.querySelector('.invalid-feedback');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }

        async submitForm(form, submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Wird gesendet...';

            const formData = new FormData(form);
            const jsonData = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('process.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonData)
                });

                const data = await response.json();

                if (data.success) {
                    this.showNotification('Ihre Nachricht wurde erfolgreich gesendet!', 'success');
                    setTimeout(() => {
                        window.location.href = 'thank_you.html';
                    }, 1500);
                } else {
                    this.showNotification(data.message || 'Es ist ein Fehler aufgetreten.', 'error');
                }
            } catch (error) {
                this.showNotification('Verbindungsfehler. Bitte versuchen Sie es später erneut.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }

        showNotification(message, type = 'info') {
            const alertClass = type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info';
            const alert = document.createElement('div');
            alert.className = `alert alert-${alertClass} alert-dismissible fade show`;
            alert.style.cssText = 'animation: slideInRight 0.3s ease-out;';
            alert.innerHTML = `${message}<button type="button" class="btn-close" aria-label="Schließen"></button>`;

            const closeBtn = alert.querySelector('.btn-close');
            closeBtn.addEventListener('click', () => this.removeNotification(alert));

            this.notificationContainer.appendChild(alert);
            setTimeout(() => alert.classList.add('show'), 10);
            setTimeout(() => this.removeNotification(alert), 5000);
        }

        removeNotification(alert) {
            alert.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }
    }

    class ScrollAnimationManager {
        constructor() {
            this.animatedElements = document.querySelectorAll('.card, .c-card, [data-animate]');
            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            this.animatedElements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                observer.observe(el);
            });
        }
    }

    class MicroInteractionsManager {
        constructor() {
            this.buttons = document.querySelectorAll('.c-button, .btn, a.btn');
            this.cards = document.querySelectorAll('.card, .c-card');
            this.init();
        }

        init() {
            this.buttons.forEach(btn => {
                btn.addEventListener('mouseenter', (e) => this.createRipple(e));
                btn.addEventListener('click', (e) => this.createRipple(e, true));
            });

            this.cards.forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-8px)';
                    card.style.transition = 'transform 0.3s ease-out';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0)';
                });
            });
        }

        createRipple(event, isClick = false) {
            const button = event.currentTarget;
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                animation: ripple 0.6s ease-out;
            `;

            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        }
    }

    class CountUpManager {
        constructor() {
            this.counters = document.querySelectorAll('[data-count]');
            if (this.counters.length) this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            this.counters.forEach(counter => observer.observe(counter));
        }

        animateCounter(element) {
            const target = parseInt(element.dataset.count);
            const duration = 2000;
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    element.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = target;
                }
            };

            updateCounter();
        }
    }

    class PrivacyPolicyManager {
        constructor() {
            this.privacyLinks = document.querySelectorAll('a[href*="privacy"]');
            this.init();
        }

        init() {
            this.privacyLinks.forEach(link => {
                if (link.closest('form')) {
                    link.addEventListener('click', (e) => {
                        if (window.innerWidth < CONFIG.breakpoints.mobile) {
                            e.preventDefault();
                            this.showPrivacyModal();
                        }
                    });
                }
            });
        }

        showPrivacyModal() {
            const modal = document.createElement('div');
            modal.className = 'privacy-modal';
            modal.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
                animation: fadeIn 0.3s ease-out;
            `;

            modal.innerHTML = `
                <div style="background: white; border-radius: 12px; max-width: 500px; width: 100%; padding: 30px; position: relative; animation: slideInUp 0.3s ease-out;">
                    <button class="close-modal" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    <h3 style="margin-top: 0;">Datenschutzerklärung</h3>
                    <p>Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.</p>
                    <a href="privacy.html" class="btn btn-primary" style="margin-top: 20px;">Vollständige Datenschutzerklärung</a>
                </div>
            `;

            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';

            const closeModal = () => {
                modal.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    modal.remove();
                    document.body.style.overflow = '';
                }, 300);
            };

            modal.querySelector('.close-modal').addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }
    }

    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes slideInUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes ripple {
            to { transform: scale(4); opacity: 0; }
        }
        .invalid-feedback {
            color: var(--color-error, #dc2626);
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
        .is-invalid {
            border-color: var(--color-error, #dc2626) !important;
        }
        .is-valid {
            border-color: var(--color-success, #059669) !important;
        }
        .u-no-scroll {
            overflow: hidden !important;
        }
    `;
    document.head.appendChild(styleSheet);

    function init() {
        new BurgerMenuManager();
        new SmoothScrollManager();
        new ActiveMenuManager();
        new ScrollSpyManager();
        new ImagesManager();
        new FormValidationManager();
        new ScrollAnimationManager();
        new MicroInteractionsManager();
        new CountUpManager();
        new PrivacyPolicyManager();

        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 600,
                easing: 'ease-out',
                once: true,
                offset: CONFIG.scrollOffset,
                disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();