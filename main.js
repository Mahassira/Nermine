/* =========================================================
   Nermine El-Behery — Site Interactions
   - EN/AR language switcher (text + image + placeholder swap)
   - Mobile burger menu
   - "Book a Session" / "Order the Book" contact modal
     (submits via a pre-filled WhatsApp message — no backend)
   - Fade-in for the "As seen on" logo strip
   ========================================================= */

/* ---------- language switcher (EN / AR) — purely additive, no page reload ---------- */
(function(){
  function applyLang(lang){
    document.documentElement.setAttribute('lang', lang === 'ar' ? 'ar' : 'en');
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.style.setProperty('--serif', lang === 'ar' ? "'Amiri', serif" : "'Playfair Display', serif");
    document.querySelectorAll('[data-en]').forEach(function(el){
      var val = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
      if(val !== null) el.textContent = val;
    });
    document.querySelectorAll('[data-en-html]').forEach(function(el){
      var val = lang === 'ar' ? el.getAttribute('data-ar-html') : el.getAttribute('data-en-html');
      if(val !== null) el.innerHTML = val;
    });
    document.querySelectorAll('[data-src-en]').forEach(function(el){
      var val = lang === 'ar' ? el.getAttribute('data-src-ar') : el.getAttribute('data-src-en');
      if(val) el.setAttribute('src', val);
    });
    document.querySelectorAll('[data-en-placeholder]').forEach(function(el){
      var val = lang === 'ar' ? el.getAttribute('data-ar-placeholder') : el.getAttribute('data-en-placeholder');
      if(val !== null) el.setAttribute('placeholder', val);
    });
    document.querySelectorAll('.lang-btn').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
    try{ localStorage.setItem('nb-site-lang', lang); }catch(e){}
    if(typeof refreshModalCopy === 'function') refreshModalCopy();
  }
  document.querySelectorAll('.lang-btn').forEach(function(b){
    b.addEventListener('click', function(){ applyLang(b.getAttribute('data-lang')); });
  });
  var saved = 'en';
  try{ saved = localStorage.getItem('nb-site-lang') || 'en'; }catch(e){}
  applyLang(saved === 'ar' ? 'ar' : 'en');

  /* ---------- Mobile burger menu ---------- */
  var navBurger = document.getElementById('nav-burger');
  var mobileMenu = document.getElementById('mobile-menu');
  function closeMobileMenu(){
    if(navBurger) navBurger.classList.remove('is-open');
    if(mobileMenu){ mobileMenu.classList.remove('is-open'); mobileMenu.setAttribute('aria-hidden','true'); }
    if(navBurger) navBurger.setAttribute('aria-expanded','false');
  }
  if(navBurger && mobileMenu){
    navBurger.addEventListener('click', function(){
      var open = mobileMenu.classList.toggle('is-open');
      navBurger.classList.toggle('is-open', open);
      navBurger.setAttribute('aria-expanded', open ? 'true' : 'false');
      mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
    mobileMenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', closeMobileMenu);
    });
  }

  /* ---------- Order the Book / Booking modal (shared) ---------- */
  var orderModal = document.getElementById('order-modal');
  var orderClose = document.getElementById('order-modal-close');
  var orderSubmit = document.getElementById('order-submit');
  var orderName = document.getElementById('order-name');
  var orderPhone = document.getElementById('order-phone');
  var orderTitle = document.getElementById('order-modal-title');
  var orderDesc = document.getElementById('order-modal-desc');
  var currentPurpose = 'booking';

  var modalCopy = {
    booking: {
      title_en: 'Book a Session', title_ar: 'احجز جلسة',
      desc_en: "Leave your name and phone number, and we'll message you on WhatsApp to confirm your session.",
      desc_ar: 'اكتب اسمك ورقم هاتفك، وهنبعتلك رسالة على واتساب لتأكيد الجلسة.'
    },
    book_order: {
      title_en: 'Order the Book', title_ar: 'اطلب الكتاب',
      desc_en: "Leave your name and phone number, and we'll message you on WhatsApp to confirm your order.",
      desc_ar: 'اكتب اسمك ورقم هاتفك، وسنتواصل معك عبر الواتساب لتأكيد الطلب.'
    }
  };

  function refreshModalCopy(){
    if(typeof modalCopy === 'undefined') return;
    var isAr = document.documentElement.getAttribute('lang') === 'ar';
    var c = modalCopy[currentPurpose] || modalCopy.booking;
    if(orderTitle) orderTitle.textContent = isAr ? c.title_ar : c.title_en;
    if(orderDesc) orderDesc.textContent = isAr ? c.desc_ar : c.desc_en;
  }

  function openOrderModal(purpose){
    currentPurpose = purpose || 'booking';
    refreshModalCopy();
    if(orderModal){ orderModal.classList.add('is-open'); orderModal.setAttribute('aria-hidden','false'); }
  }
  function closeOrderModal(){
    if(orderModal){ orderModal.classList.remove('is-open'); orderModal.setAttribute('aria-hidden','true'); }
  }
  document.querySelectorAll('[data-contact-trigger]').forEach(function(btn){
    btn.addEventListener('click', function(){ openOrderModal(btn.getAttribute('data-contact-trigger')); });
  });
  if(orderClose) orderClose.addEventListener('click', closeOrderModal);
  if(orderModal) orderModal.addEventListener('click', function(e){ if(e.target === orderModal) closeOrderModal(); });

  if(orderSubmit) orderSubmit.addEventListener('click', function(){
    var name = (orderName && orderName.value || '').trim();
    var phone = (orderPhone && orderPhone.value || '').trim();
    var isAr = document.documentElement.getAttribute('lang') === 'ar';
    if(!name || !phone){
      alert(isAr ? 'من فضلك اكتب الاسم ورقم الهاتف.' : 'Please enter your name and phone number.');
      return;
    }
    var msg;
    if(currentPurpose === 'book_order'){
      msg = isAr
        ? ('مرحبًا، أريد طلب نسخة من كتاب "مفاتيح الطمأنينة".\nالاسم: ' + name + '\nرقم الهاتف: ' + phone)
        : ('Hello, I would like to order a copy of "Keys to Peace of Mind".\nName: ' + name + '\nPhone: ' + phone);
    } else {
      msg = isAr
        ? ('مرحبًا، أريد حجز جلسة تدريب.\nالاسم: ' + name + '\nرقم الهاتف: ' + phone)
        : ('Hello, I would like to book a coaching session.\nName: ' + name + '\nPhone: ' + phone);
    }
    var waUrl = 'https://wa.me/201033708703?text=' + encodeURIComponent(msg);
    window.open(waUrl, '_blank', 'noopener');
    closeOrderModal();
  });
})();

/* ---------- As Seen On: subtle fade/slide-in ---------- */
(function(){
  var strip = document.querySelector('.seen-on-strip');
  if(!strip) return;
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ strip.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, {threshold:0.2});
    io.observe(strip);
  } else {
    strip.classList.add('is-visible');
  }
})();