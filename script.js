
document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileMenu();
  initMenuFilters();
  initReservationForm();
  initScrollReveal();
});

function initStickyHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const toggleShadow = () => {
    header.classList.toggle('scrolled', window.scrollY > 12);
  };

  toggleShadow();
  window.addEventListener('scroll', toggleShadow, { passive: true });
}

function initMobileMenu() {
  const button = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('mainNav');
  if (!button || !nav) return;

  const closeMenu = () => {
    nav.classList.remove('mobile-open');
    button.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
  };

  button.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('mobile-open');
    button.classList.toggle('open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
  });
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}

function initMenuFilters() {
  const filterBar = document.getElementById('menuFilters');
  const groups = document.querySelectorAll('.menu-group');
  const emptyMessage = document.getElementById('menuEmpty');
  if (!filterBar || groups.length === 0) return;

  filterBar.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-btn');
    if (!button) return;

    filterBar.querySelectorAll('.filter-btn').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');

    const category = button.dataset.category;
    let visibleCount = 0;

    groups.forEach((group) => {
      const matches = category === 'all' || group.dataset.category === category;
      group.style.display = matches ? '' : 'none';
      if (matches) visibleCount += 1;
    });

    if (emptyMessage) {
      emptyMessage.hidden = visibleCount > 0;
    }
  });
}

// Point this at wherever the backend from /dastarkhwan-backend is deployed.
// Same-origin deployments (backend serving the frontend too) can use a relative '/api/reservations'.
const RESERVATION_API_URL = 'http://localhost:4000/api/reservations';

function initReservationForm() {
  const form = document.getElementById('reserveForm');
  const successMessage = document.getElementById('formSuccess');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const errorBanner = document.getElementById('formError');

  const validators = {
    fullName: (value) => value.trim().length >= 2 || 'Please enter your full name.',
    email: (value) =>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Please enter a valid email address.',
    phone: (value) => /^[0-9+\s()-]{7,}$/.test(value) || 'Please enter a valid phone number.',
    guests: (value) => (Number(value) >= 1 && Number(value) <= 20) || 'Guests must be between 1 and 20.',
    date: (value) => value.trim() !== '' || 'Please choose a date.',
    time: (value) => value.trim() !== '' || 'Please choose a time.',
  };

  function validateField(field) {
    const validate = validators[field.name];
    if (!validate) return true;

    const result = validate(field.value);
    const wrapper = field.closest('.form-field');
    const errorEl = document.getElementById(`err-${field.name}`);

    if (result === true) {
      wrapper.classList.remove('invalid');
      if (errorEl) errorEl.textContent = '';
      return true;
    }

    wrapper.classList.add('invalid');
    if (errorEl) errorEl.textContent = result;
    return false;
  }

  function showFieldErrorsFromServer(fieldErrors) {
    Object.keys(fieldErrors).forEach((name) => {
      const field = form.elements[name];
      if (!field) return;
      const wrapper = field.closest('.form-field');
      const errorEl = document.getElementById(`err-${field.name}`);
      if (wrapper) wrapper.classList.add('invalid');
      if (errorEl) errorEl.textContent = fieldErrors[name];
    });
  }

  Object.keys(validators).forEach((name) => {
    const field = form.elements[name];
    if (field) field.addEventListener('blur', () => validateField(field));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (successMessage) successMessage.hidden = true;
    if (errorBanner) errorBanner.hidden = true;

    // Honeypot: a hidden field real visitors never fill in. If it has a value, a bot filled it.
    const honeypot = form.elements.website;
    if (honeypot && honeypot.value) return;

    let isFormValid = true;
    Object.keys(validators).forEach((name) => {
      const field = form.elements[name];
      if (field && !validateField(field)) isFormValid = false;
    });

    if (!isFormValid) {
      const firstInvalid = form.querySelector('.form-field.invalid input, .form-field.invalid textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const payload = {
      fullName: form.elements.fullName.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      guests: Number(form.elements.guests.value),
      date: form.elements.date.value,
      time: form.elements.time.value,
      request: form.elements.request.value.trim(),
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Booking...';
    }

    try {
      const response = await fetch(RESERVATION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.fields) showFieldErrorsFromServer(data.fields);
        if (errorBanner) {
          errorBanner.textContent = data.error || 'Something went wrong. Please check the form and try again.';
          errorBanner.hidden = false;
        }
        return;
      }

      if (successMessage) successMessage.hidden = false;
      form.reset();
      form.querySelectorAll('.form-field').forEach((el) => el.classList.remove('invalid'));
    } catch (err) {
      if (errorBanner) {
        errorBanner.textContent = 'Could not reach the server. Please check your connection and try again.';
        errorBanner.hidden = false;
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book a Table';
      }
    }
  });
}

function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.section-head, .dish-card, .why-item, .testimonial, .story-text, .story-image, .hero-text'
  );
  if (targets.length === 0) return;

  targets.forEach((el) => el.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}
