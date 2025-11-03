// Canonical email templates and helpers

export const DEFAULT_TEMPLATES = [
  // Automated notifications — New patient enquiry
  {
    key: 'new_enquiry_immediate',
    type: 'Email',
    name: 'New enquiry • Immediate',
    sending: 'Immediately when lead comes into CRM',
    enabled: true,
    template: `
<p>Subject: Welcome to [Practice Name] - Your smile journey starts here ✨</p>
<p>Hi [First Name],</p>
<p>Thank you for reaching out! We're thrilled you're considering us for your dental care. At [Practice Name], we believe every smile tells a story, and we can't wait to be part of yours.</p>
<p>Our team is carefully reviewing your enquiry and will contact you within 24 hours to discuss your needs and find the perfect appointment time that fits your schedule.</p>
<p>In the meantime, meet our award-winning team and explore our state-of-the-art facility [link to virtual tour].</p>
<p>Welcome to the family!</p>
`,
  },
  {
    key: 'new_enquiry_day1',
    type: 'Email',
    name: 'New enquiry • Day 1',
    sending: '1 day afterward',
    enabled: false,
    template: `
<p>Subject: [First Name], here's what makes us different 🦷</p>
<p>Hi [First Name],</p>
<p>Choosing a dental practice is a big decision, and we want you to feel completely confident about joining our family.</p>
<p>Here's what our patients love most about us:</p>
<ul>
  <li>Anxiety-free appointments with our gentle care approach</li>
  <li>Same-day emergency availability</li>
  <li>Advanced technology for pain-free treatments</li>
  <li>A team that actually listens to your concerns</li>
  </ul>
<p>Over 2,500 patients trust us with their smiles. Read their stories [link to testimonials] and discover why they've made us their dental home.</p>
<p>Ready to book? Simply reply to this email or call us at [phone number].</p>
`,
  },
  {
    key: 'new_enquiry_day3',
    type: 'Email',
    name: 'New enquiry • Day 3',
    sending: '3 days after enquiry',
    enabled: false,
    template: `
<p>Subject: Still thinking about us? Here's why patients choose [Practice Name]</p>
<p>Hi [First Name],</p>
<p>We noticed you haven't scheduled your appointment yet, and we wanted to reach out one more time.</p>
<p>Did you know? 94% of our new patients wish they'd booked sooner! Don't let dental anxiety or a busy schedule hold you back from the smile you deserve.</p>
<p>This month, we're offering extended evening hours to accommodate your lifestyle. Limited slots available!</p>
<p>Watch this 60-second video of patient transformations that will inspire you [link].</p>
<p>Your future smile is waiting - let's make it happen together.</p>
`,
  },

  // Black Friday series
  {
    key: 'bf_pre_7',
    type: 'Email',
    name: 'Black Friday • Teaser',
    sending: '7 days before Black Friday',
    enabled: false,
    template: `
<p>Subject: 🤫 Something HUGE is coming this Black Friday…</p>
<p>Hi [First Name],</p>
<p>We've been working on something extraordinary, and we can't keep it a secret any longer.</p>
<p>This Black Friday, we're launching our biggest promotion of the year - and it's going to transform the way you think about dental care.</p>
<p>Mark your calendar for November 29th. You won't want to miss this.</p>
<p>Set your reminder now, because when this drops, it's going to be incredible.</p>
<p>The countdown begins...</p>
`,
  },
  {
    key: 'bf_launch',
    type: 'Email',
    name: 'Black Friday • Launch',
    sending: 'Black Friday morning',
    enabled: false,
    template: `
<p>Subject: 🔥 IT'S HERE! Our biggest offer of the year (24 hours only)</p>
<p>Hi [First Name],</p>
<p>BLACK FRIDAY IS LIVE!</p>
<p>For the next 24 hours only, unlock exclusive access to premium dental treatments:</p>
<ul>
  <li>✨ Composite Bonding Transformation</li>
  <li>✨ Professional Teeth Whitening</li>
  <li>✨ Complete Smile Makeovers</li>
  <li>✨ Advanced Dental Examinations</li>
</ul>
<p>This is our ONE annual promotion where we make premium dental care more accessible than ever. Hundreds of appointments available, but they're filling FAST.</p>
<p>Secure your spot before midnight: [booking link]</p>
<p>Over 150 patients have already claimed their appointments in the first hour. Don't miss your chance!</p>
`,
  },
  {
    key: 'bf_last_chance',
    type: 'Email',
    name: 'Black Friday • Last chance',
    sending: 'Black Friday evening (6 hours left)',
    enabled: false,
    template: `
<p>Subject: ⏰ FINAL HOURS: Your Black Friday opportunity ends at midnight</p>
<p>Hi [First Name],</p>
<p>This is it - your last chance.</p>
<p>In just 6 hours, our Black Friday promotion disappears forever. We've already helped 300+ patients secure their dream smile today.</p>
<p>Only 25 appointment slots remaining.</p>
<p>Don't wake up tomorrow with regret. Your future self will thank you for taking action today.</p>
<p>Book now before midnight: [booking link]</p>
<p>Time is running out. Your smile transformation awaits.</p>
`,
  },

  // Birthday sequence
  {
    key: 'birthday_day0',
    type: 'Email',
    name: 'Birthday • Day 0',
    sending: 'On birthday (lead DOB)',
    enabled: false,
    template: `
<p>Subject: 🎉 Happy Birthday [First Name]! Your special gift inside</p>
<p>Hi [First Name],</p>
<p>HAPPY BIRTHDAY! 🎂</p>
<p>Today is all about celebrating YOU, and we wanted to make your day even brighter with a special birthday gift from our team.</p>
<ul>
  <li>🎁 Complimentary smile enhancement consultation</li>
  <li>🎁 Professional teeth whitening session</li>
  <li>🎁 Priority booking privileges</li>
</ul>
<p>Your birthday gift is valid for 30 days - because your celebration shouldn't end today!</p>
<p>Book your birthday appointment here: [link]</p>
<p>Here's to another year of confident, radiant smiles. You deserve to shine!</p>
`,
  },
  {
    key: 'birthday_day20',
    type: 'Email',
    name: 'Birthday • Reminder',
    sending: '20 days after birthday',
    enabled: false,
    template: `
<p>Subject: [First Name], your birthday gift expires in 10 days! 🎁</p>
<p>Hi [First Name],</p>
<p>We hope you had an amazing birthday! Just a friendly reminder that your exclusive birthday gift is still waiting for you - but not for long.</p>
<p>You have just 10 days left to claim your complimentary treatments. Don't let this special opportunity slip away!</p>
<p>Claim your gift now: [booking link]</p>
<p>Make this birthday month truly unforgettable!</p>
`,
  },

  // Composite Bonding
  {
    key: 'bonding_immediate',
    type: 'Email',
    name: 'Composite Bonding • Immediate',
    sending: 'Immediately after enquiry',
    enabled: false,
    template: `
<p>Subject: Your composite bonding questions answered ✨</p>
<p>Hi [First Name],</p>
<p>Thank you for your interest in composite bonding! You're one step closer to the smile transformation you've been dreaming about.</p>
<p>Composite bonding is our most popular cosmetic treatment because it delivers dramatic results in just one appointment. Imagine walking in with insecurities and walking out with unstoppable confidence.</p>
<ul>
  <li>Fixes chips, gaps, and discoloration instantly</li>
  <li>Pain-free procedure with no drilling</li>
  <li>Natural-looking results that last for years</li>
  <li>Transform your smile in under 2 hours</li>
</ul>
<p>Watch real patient transformations: [video link]</p>
<p>Our expert cosmetic dentist has completed over 500 bonding procedures with stunning results. Let's create your masterpiece.</p>
`,
  },
  {
    key: 'bonding_day3',
    type: 'Email',
    name: 'Composite Bonding • Day 3',
    sending: '3 days after enquiry',
    enabled: false,
    template: `
<p>Subject: 😍 These composite bonding transformations will blow your mind</p>
<p>Hi [First Name],</p>
<p>Seeing is believing, and these before-and-after transformations speak louder than any words we could write.</p>
<p>[Patient A] was self-conscious about her smile for 15 years. After one bonding appointment, she couldn't stop smiling.</p>
<p>[Patient B] fixed years of chipped teeth in just 90 minutes. "Life-changing" is how he describes it.</p>
<p>Your transformation could be next. Browse our portfolio of stunning results: [gallery link]</p>
<p>What's holding you back from the smile you deserve? Let's discuss your unique vision.</p>
`,
  },
  {
    key: 'bonding_day7',
    type: 'Email',
    name: 'Composite Bonding • Day 7',
    sending: '7 days after enquiry',
    enabled: false,
    template: `
<p>Subject: Ready to transform your smile, [First Name]?</p>
<p>Hi [First Name],</p>
<p>A week ago, you took the first step toward a confidence-boosting smile. Now it's time for step two.</p>
<p>We're reserving complimentary consultation slots for serious candidates. During your consultation, you'll:</p>
<ul>
  <li>See digital previews of your potential results</li>
  <li>Discuss your unique smile goals</li>
  <li>Get a personalized treatment plan</li>
  <li>Have all your questions answered by our specialist</li>
</ul>
<p>Limited consultation spots available this month. Your dream smile is just one appointment away.</p>
<p>Book your consultation: [link]</p>
`,
  },

  // Teeth Whitening
  {
    key: 'whitening_immediate',
    type: 'Email',
    name: 'Whitening • Immediate',
    sending: 'Immediately after enquiry',
    enabled: false,
    template: `
<p>Subject: Get ready for your brightest smile yet, [First Name] 🌟</p>
<p>Hi [First Name],</p>
<p>A dazzling white smile is closer than you think! Thank you for asking about our professional teeth whitening treatments.</p>
<ul>
  <li>Whiten up to 8 shades in one session</li>
  <li>Zero sensitivity with our unique formula</li>
  <li>Safe, effective, and dentist-supervised</li>
  <li>Results visible immediately</li>
</ul>
<p>See the dramatic difference: [before/after photos]</p>
`,
  },
  {
    key: 'whitening_day2',
    type: 'Email',
    name: 'Whitening • Day 2',
    sending: '2 days after enquiry',
    enabled: false,
    template: `
<p>Subject: Professional vs DIY whitening: The truth [First Name] needs to know</p>
<p>Hi [First Name],</p>
<p>Thinking about drugstore whitening kits to save time? Here's what you should know first.</p>
<p><strong>DIY whitening kits:</strong></p>
<ul>
  <li>Take weeks or months for minimal results</li>
  <li>Can cause severe tooth sensitivity</li>
  <li>Often damage enamel with harsh chemicals</li>
  <li>Inconsistent, patchy results</li>
</ul>
<p><strong>Professional whitening at [Practice Name]:</strong></p>
<ul>
  <li>Dramatic results in just one appointment</li>
  <li>Safe, pain-free procedure</li>
  <li>Customized to your unique needs</li>
  <li>Long-lasting results worth celebrating</li>
</ul>
<p>Don't gamble with your smile. Over 800 patients have chosen professional whitening with us - and they've never looked back.</p>
<p>Read their stories: [testimonials link]</p>
`,
  },
  {
    key: 'whitening_day5',
    type: 'Email',
    name: 'Whitening • Day 5',
    sending: '5 days after enquiry',
    enabled: false,
    template: `
<p>Subject: [First Name], special occasion coming up? Whiten before it's too late! ⚡</p>
<p>Hi [First Name],</p>
<p>Whether you have a wedding, reunion, photo shoot, or important meeting on the horizon - professional teeth whitening is your secret weapon.</p>
<p>Book your whitening session today: [booking link]</p>
`,
  },

  // Dental Examination
  {
    key: 'exam_immediate',
    type: 'Email',
    name: 'Dental Exam • Immediate',
    sending: 'Immediately after enquiry',
    enabled: false,
    template: `
<p>Subject: Your comprehensive dental exam: What to expect</p>
<p>Hi [First Name],</p>
<p>Thank you for prioritizing your oral health! Scheduling a comprehensive dental examination is one of the smartest decisions you can make.</p>
<ul>
  <li>Full mouth digital scanning for early detection</li>
  <li>Oral cancer screening included</li>
  <li>Personalized prevention plan</li>
  <li>No judgment, just compassionate care</li>
  <li>Plain-English breakdown of findings</li>
</ul>
<p>Learn more about our thorough approach: [link]</p>
`,
  },
  {
    key: 'exam_day3',
    type: 'Email',
    name: 'Dental Exam • Day 3',
    sending: '3 days after enquiry',
    enabled: false,
    template: `
<p>Subject: [First Name], prevent problems before they start 🛡️</p>
<p>Hi [First Name],</p>
<p>Did you know? 90% of dental problems are completely preventable with regular examinations and proper care.</p>
<p>Early detection is everything. Don't wait for pain to be your warning sign.</p>
`,
  },
  {
    key: 'exam_day7',
    type: 'Email',
    name: 'Dental Exam • Day 7',
    sending: '7 days after enquiry',
    enabled: false,
    template: `
<p>Subject: Still on the fence about your dental exam, [First Name]?</p>
<p>Hi [First Name],</p>
<p>We understand - life gets busy. By the time you feel dental pain, the problem has usually been developing for months.</p>
<p>Schedule your appointment today: [booking link]</p>
`,
  },
]

export function renderEmailHtml(html, ctx = {}) {
  if (!html) return ''
  const safe = String(html)
  const rep = (str, key, val) => str.replace(new RegExp(`\\[${key}\\]`, 'gi'), val || '')
  let out = safe
  out = rep(out, 'Patient Name', ctx.patientName || ctx.name || '')
  out = rep(out, 'First Name', ctx.firstName || (ctx.name || '').split(' ')[0] || '')
  out = rep(out, 'Your Name', ctx.userName || '')
  out = rep(out, 'Practice Name', ctx.practiceName || process.env.PRACTICE_NAME || '')
  out = rep(out, 'booking link', ctx.bookingLink || process.env.PRACTICE_BOOKING_LINK || '')
  out = rep(out, 'phone number', ctx.phone || process.env.PRACTICE_PHONE || '')
  out = rep(out, 'link to virtual tour', ctx.virtualTourLink || '')
  out = rep(out, 'link to testimonials', ctx.testimonialsLink || '')
  out = rep(out, 'video link', ctx.videoLink || '')
  out = rep(out, 'gallery link', ctx.galleryLink || '')
  return out
}

