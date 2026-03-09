const crmAutomationDefaultsAll = [
  {
    key: 'send_price_list',
    type: 'Email',
    name: 'Send Price List',
    subject: 'Your requested price list',
    sending: 'Manual',
    enabled: false,
    template: `<p>Dear [Patient Name],</p><p>Thank you for contacting us. We appreciate your interest in our practice and are delighted that you're considering us for your dental care needs.</p><p>As requested, please find our practice price list attached to this email. We believe in transparent pricing and strive to make quality dental care accessible to all our patients.</p><p>If you have any questions about our services, pricing, finance plans, or would like to schedule an appointment, please don't hesitate to reach out. Our friendly team is here to assist you and ensure you receive the best possible care.</p><p>We look forward to welcoming you to our practice and helping you achieve a healthy, beautiful smile.</p><p>Warm regards,<br>[Your Name]</p>`,
  },
  {
    key: 'practice_locations',
    type: 'Email',
    name: 'Send Practice Location',
    subject: 'Our location and directions',
    sending: 'Manual',
    enabled: false,
    template: `<p>Dear [Patient Name],</p><p>Thank you for your interest in visiting our dental clinic. We're conveniently located and easy to find.</p><p><strong>Our Address:</strong><br>[Street Address]<br>[City, State ZIP Code]</p><p><strong>Office Hours:</strong><br>[Days and Times]</p><p>Parking is available [on-site/nearby/street parking details], and our clinic is easily accessible by [public transportation details if applicable].</p><p>If you need directions or have any questions about finding us, please feel free to call us at [Phone Number]. We're happy to help guide you to our location.</p><p>We look forward to seeing you soon!</p><p>Best regards,<br>[Your Name]</p>`,
  },
  {
    key: 'lead_enquiry_day_1',
    type: 'Email',
    name: 'Welcome & Value (Immediate)',
    subject: 'Welcome to [Practice Name] - Your Smile Journey Starts Here ✨',
    sending: 'Send immediately',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 0 },
    template: `<p>Hi [Name],</p><p>Thank you for reaching out to [Practice Name]! We're thrilled you're considering us for your dental care.</p><p>I'm [Treatment Coordinator Name], and I'll be your personal guide throughout this journey. We understand that choosing the right dental practice is important, which is why we've helped over 1000+ patients achieve their dream smiles right here in [Location].</p><p>What makes us different? We combine cutting-edge technology with genuine care. Every patient receives a personalized treatment plan tailored to their unique needs and budget.</p><p>I'd love to schedule a complimentary consultation where we can discuss your goals and answer any questions. Simply reply to this email or call us at [Phone Number] - we have appointments available this week.</p><p>Looking forward to meeting you!</p><p>Warmly,<br>[Practice Name] Team<br>[Website] | [Phone Number]</p>`,
  },
  {
    key: 'lead_enquiry_day_3',
    type: 'Email',
    name: 'Educational Value (Day 3)',
    subject: "[Name], here's what to expect at your first visit",
    sending: '3 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 3 },
    template: `<p>Hi [Name],</p><p>I wanted to share what happens during your first visit with us - no surprises, just exceptional care.</p><p>Your complimentary consultation includes:</p><ul><li>Comprehensive oral health assessment</li><li>3D imaging (if needed) so you can see exactly what we see</li><li>Personalized treatment options with transparent pricing</li><li>No-pressure discussion about your goals and concerns</li></ul><p>Many patients tell us they wish they'd come to see us sooner. The consultation typically takes 30-45 minutes, and you'll leave with a clear roadmap for your smile transformation.</p><p>Have questions before booking? I'm here to help. Just hit reply or call [Phone Number].</p><p>Best wishes,<br>[Practice Name] Team<br>[Address] | [Email]</p>`,
  },
  {
    key: 'lead_enquiry_day_5',
    type: 'Email',
    name: 'Social Proof (Day 5)',
    subject: 'See why patients choose [Practice Name]',
    sending: '5 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 5 },
    template: `<p>Hi [Name],</p><p>Sometimes the best way to understand what we do is to hear from people just like you.</p><p>"I was nervous about dental treatment, but the team at [Practice Name] made me feel completely at ease. The results exceeded my expectations!" - Sarah M.</p><p>"Professional, caring, and transparent about costs. I finally found a dental practice I trust." - James T.</p><p>We're proud to maintain a 5-star rating because we treat every patient like family. Our approach is simple: listen first, recommend honest solutions, and deliver exceptional results.</p><p>Ready to experience the difference? Book your complimentary consultation today: [Phone Number]</p><p>We'd love to welcome you to our practice family.</p><p>Warmly,<br>[Practice Name] Team<br>[Website]</p>`,
  },
  {
    key: 'lead_enquiry_day_12',
    type: 'Email',
    name: 'Overcome Objections (Day 7)',
    subject: "Questions about dental treatment? We've got answers",
    sending: '7 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 7 },
    template: `<p>Hi [Name],</p><p>I know choosing a dental practice can feel overwhelming. Here are the most common questions we hear:</p><p>"How much will it cost?" - We provide transparent pricing during your free consultation and offer flexible payment plans to fit any budget.</p><p>"Will it hurt?" - We use the latest pain-free techniques and sedation options. Your comfort is our priority.</p><p>"How long will it take?" - Most treatments are faster than you think. We'll create a timeline that works with your schedule.</p><p>"Are you accepting new patients?" - Yes! We'd love to welcome you to [Practice Name].</p><p>Still have questions? Let's chat. Call [Phone Number] or reply to this email.</p><p>Best wishes,<br>[Practice Name] Team<br>[Address] | [Email]</p>`,
  },
  {
    key: 'lead_enquiry_day_18',
    type: 'Email',
    name: 'Final Call to Action (Day 9)',
    subject: "[Patient Name], we'd love to help you achieve your smile goals",
    sending: '9 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 9 },
    template: `<p>Hi [Name],</p><p>I wanted to reach out one last time because I genuinely believe we can help you achieve the smile you deserve.</p><p>At [Practice Name], we've transformed thousands of smiles, and we'd be honored to help you too. Whether you're looking for a routine check-up or a complete smile makeover, we're here to support you every step of the way.</p><p>Here's what happens next:</p><ul><li>Call us at [Phone Number] or reply to this email</li><li>Schedule your complimentary consultation at a time that works for you</li><li>Meet our friendly team and discover your personalized treatment options</li></ul><p>Our calendar fills quickly, so I encourage you to book soon. We have limited appointments available this month.</p><p>Looking forward to welcoming you.</p><p>Warmly,<br>[Practice Name] Team<br>[Website] | [Phone Number] | [Email]</p>`,
  },
  {
    key: 'composite_bonding_day_1',
    type: 'Email',
    name: 'Educational Introduction (Immediate)',
    subject: 'Transform your smile in just one appointment with composite bonding',
    sending: 'Immediately when lead comes into CRM',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 0 },
    template: `<p>Hi [Patient Name],</p><p>Dreaming of a flawless smile without the wait or high cost of veneers? Composite bonding might be exactly what you're looking for.</p><p>This revolutionary treatment can:</p><ul><li>Fix chips, cracks, and gaps in your teeth</li><li>Reshape uneven or worn teeth</li><li>Close gaps between teeth</li><li>Improve discoloration</li></ul><p>All in a single visit.</p><p>The best part? Composite bonding is painless, requires no drilling, and costs a fraction of traditional veneers. Most patients see dramatic results in just 60-90 minutes.</p><p>At [Practice Name], we specialize in natural-looking composite bonding that transforms smiles while preserving your natural teeth. Our expert team has completed over [X] successful bonding treatments.</p><p>Curious to see if composite bonding is right for you? Book your free consultation: [Phone Number]</p><p>We'll assess your smile and show you exactly what's possible.</p><p>Best wishes,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'composite_bonding_day_3',
    type: 'Email',
    name: 'Before/After Social Proof (Day 4)',
    subject: 'See real composite bonding transformations from [Practice Name]',
    sending: '4 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 4 },
    template: `<p>Hi [Patient Name],</p><p>A picture is worth a thousand words - especially when it comes to composite bonding.</p><p>We've helped hundreds of patients achieve stunning smile transformations in just one visit. From fixing chipped front teeth to closing gaps and creating perfectly shaped smiles, the results speak for themselves.</p><p>What our patients say:</p><p>"I can't believe the difference! My teeth look completely natural and I'm smiling with confidence for the first time in years." - Emma L.</p><p>"Quick, painless, and affordable. Wish I'd done this years ago." - Michael R.</p><p>Composite bonding typically costs 60-70% less than porcelain veneers, with results that last 5-10 years with proper care.</p><p>Want to see your own transformation? Book your complimentary consultation today: [Phone Number]</p><p>We'll create a personalized treatment plan just for you, with transparent pricing and flexible payment options.</p><p>Looking forward to meeting you.</p><p>[Practice Name] Team<br>[Email] | [Website]</p>`,
  },
  {
    key: 'composite_bonding_day_5',
    type: 'Email',
    name: 'Process & Comfort (Day 6)',
    subject: 'What to expect during your composite bonding treatment',
    sending: '6 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 6 },
    template: `<p>Hi [Patient Name],</p><p>Let me walk you through exactly what happens during composite bonding - no mysteries, just facts.</p><p>Your Treatment Journey:</p><ul><li>Consultation (30 mins) - We discuss your goals, assess your teeth, and show you what's achievable</li><li>Preparation (15 mins) - We gently prepare your tooth surface (no drilling or pain)</li><li>Application (30-60 mins) - We apply and sculpt the composite resin to create your perfect smile</li><li>Finishing touches (15 mins) - Polish and perfect for a natural, beautiful result</li></ul><p>Total time: 60-90 minutes for most treatments</p><p>Anesthesia needed: Usually not required.</p><p>Recovery time: None - leave with your new smile immediately.</p><p>Many patients are amazed at how comfortable and quick the process is. You can even watch your smile transform in real-time.</p><p>Ready to get started? We're offering a 10% discount on composite bonding consultations booked this month.</p><p>Call [Phone Number] or reply to this email to claim your spot.</p><p>Warmly,<br>[Practice Name] Team<br>[Address] | [Phone Number]</p>`,
  },
  {
    key: 'composite_bonding_day_13',
    type: 'Email',
    name: 'Overcome Price Objections (Day 8)',
    subject: "Affordable smile transformation - here's how we make it work",
    sending: '8 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 8 },
    template: `<p>Hi [Patient Name],</p><p>We believe everyone deserves a confident smile, which is why we've made composite bonding accessible to all our patients.</p><p>Investment: Composite bonding typically ranges from £[X] per tooth, significantly less than veneers at £[higher amount].</p><p>Flexible Payment Plans: Spread the cost over 6-12 months with 0% finance options (subject to approval).</p><p>What's included:</p><ul><li>Comprehensive consultation and assessment</li><li>Expert composite bonding treatment</li><li>Aftercare guidance and support</li><li>12-month satisfaction guarantee</li></ul><p>Think of it as an investment in yourself - your confidence, your career, your social life. Patients tell us their new smile changes everything.</p><p>Plus, this month we're offering up to 10% off composite bonding treatments when you book your consultation.</p><p>Don't let cost hold you back from the smile you deserve. Call [Phone Number] today to discuss your options.</p><p>Best wishes,<br>[Practice Name] Team<br>[Website] | [Email]</p>`,
  },
  {
    key: 'composite_bonding_day_18',
    type: 'Email',
    name: 'Urgency & Final CTA (Day 10)',
    subject: 'Last chance: 15% off composite bonding ends soon',
    sending: '10 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 10 },
    template: `<p>Hi [Patient Name],</p><p>This is your final reminder - our special offer on composite bonding treatments ends this week!</p><p>Save 15% when you book your consultation by [Date]. This exclusive discount won't last, and our calendar is filling fast.</p><p>Composite bonding can transform your smile in just one visit:</p><ul><li>No drilling or pain</li><li>Immediate results</li><li>Natural-looking finish</li><li>Lasts 5-10 years</li></ul><p>Hundreds of patients have trusted [Practice Name] with their smile transformations. Now it's your turn.</p><p>Act now: Call [Phone Number] or reply to this email to secure your discounted consultation.</p><p>Limited appointments available - don't miss out on this opportunity!</p><p>Looking forward to helping you achieve your dream smile.</p><p>Warmly,<br>[Practice Name] Team<br>[Website] | [Address] | [Phone Number]</p>`,
  },
  {
    key: 'invisalign_day_1',
    type: 'Email',
    name: 'Solution-Focused Introduction (Immediate)',
    subject: 'Straighten your smile discreetly with Invisalign',
    sending: 'Immediately when lead comes into CRM',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 0 },
    template: `<p>Hi [Patient Name],</p><p>Dreaming of straighter teeth but don't want the hassle of metal braces? You're not alone.</p><p>Invisalign clear aligners have revolutionized orthodontics, helping millions of adults achieve perfectly straight smiles without anyone noticing they're in treatment.</p><p>Why patients choose Invisalign:</p><ul><li>Virtually invisible - no one will know you're wearing them</li><li>Removable - eat, drink, and brush normally</li><li>Comfortable - no metal brackets or wires</li><li>Effective - treats crowding, gaps, overbites, and more</li><li>Fast results - most treatments complete in 6-18 months</li></ul><p>At [Practice Name], we're certified Invisalign providers with [X] successful cases completed. We use advanced 3D imaging to show you your new smile before you even start treatment.</p><p>Ready to discover if Invisalign is right for you? Book your free consultation and 3D smile simulation: [Phone Number]</p><p>We'll create a personalized treatment plan with transparent pricing - no hidden costs, no surprises.</p><p>Excited to help you achieve your dream smile.</p><p>Best wishes,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'invisalign_day_3',
    type: 'Email',
    name: 'Visualization and Technology (Day 4)',
    subject: 'See your future smile before treatment begins',
    sending: '4 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 4 },
    template: `<p>Hi [Patient Name],</p><p>Imagine seeing exactly how your smile will look after Invisalign treatment - before you even commit.</p><p>At [Practice Name], we use cutting-edge 3D technology to create a digital preview of your smile transformation. You'll see every stage of your treatment journey, from day one to your final, perfect smile.</p><p>Your Invisalign journey:</p><ul><li>Free consultation - We assess your teeth and discuss your goals</li><li>3D smile preview - See your future smile in stunning detail</li><li>Custom aligners - Precision-crafted for your unique treatment</li><li>Regular check-ins - We monitor progress every 6-8 weeks</li><li>Beautiful results - Achieve the straight smile you've always wanted</li></ul><p>Real patient feedback:</p><p>"Seeing my smile preview made the decision easy. The treatment was exactly as shown - absolutely worth it." - Rachel K.</p><p>"I loved that I could remove my aligners for important meetings. No one at work even knew I was straightening my teeth." - David M.</p><p>Most Invisalign treatments take 12-18 months, but you'll start seeing results within weeks.</p><p>Book your complimentary consultation and 3D preview today: [Phone Number]</p><p>Looking forward to showing you what's possible.</p><p>Warmly,<br>[Practice Name] Team<br>[Email] | [Website]</p>`,
  },
  {
    key: 'invisalign_day_5',
    type: 'Email',
    name: 'Lifestyle Benefits (Day 8)',
    subject: 'Why busy professionals choose Invisalign',
    sending: '8 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 8 },
    template: `<p>Hi [Patient Name],</p><p>If you've been hesitating about teeth straightening because of your lifestyle, Invisalign might be the perfect solution.</p><p>Perfect for busy lives:</p><ul><li>Minimal appointments - Check-ins every 6-8 weeks (not monthly like braces)</li><li>No food restrictions - Remove aligners to eat whatever you want</li><li>No emergencies - No broken brackets or wires requiring urgent visits</li><li>Easy maintenance - Simply brush your aligners and teeth as normal</li><li>Professional appearance - Completely discreet during meetings and social events</li></ul><p>Many of our patients are working professionals, parents, and active individuals who need flexibility. Invisalign fits seamlessly into your life, not the other way around.</p><p>This month only: We're offering 15% off Invisalign treatment packages when you book your consultation.</p><p>That's a saving of up to GBP [X] on your smile transformation.</p><p>Ready to get started? Call [Phone Number] or reply to this email. Our calendar is filling quickly.</p><p>Best wishes,<br>[Practice Name] Team<br>[Address] | [Phone Number]</p>`,
  },
  {
    key: 'invisalign_day_13',
    type: 'Email',
    name: 'Financial Options (Day 10)',
    subject: 'Make Invisalign affordable with flexible payment plans',
    sending: '10 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 10 },
    template: `<p>Hi [Patient Name],</p><p>We know cost is an important consideration when investing in your smile. That's why we've made Invisalign accessible with flexible financing options.</p><p>Investment options:</p><ul><li>Full payment discount: Pay upfront and save £[X]</li><li>Interest-free plans: Spread payments over 12 months at 0% APR</li><li>Extended finance: Monthly plans up to 24 months available</li><li>Deposit: From just £[X] to start treatment</li></ul><p>Average Invisalign investment: £2,500-4,500 (varies based on complexity)</p><p>What's included:</p><ul><li>All aligners and retainers</li><li>Regular monitoring appointments</li><li>3D smile preview and treatment planning</li><li>Aftercare and support</li></ul><p>Plus, this month we're offering up to 15% off - that's a potential saving of £[X].</p><p>Think of Invisalign as an investment in your confidence, career, and quality of life. Patients consistently tell us it's one of the best decisions they've ever made.</p><p>Let's create a payment plan that works for your budget. Call [Phone Number] today for your free consultation.</p><p>Warmly,<br>[Practice Name] Team<br>[Website] | [Email]</p>`,
  },
  {
    key: 'invisalign_day_18',
    type: 'Email',
    name: 'Social Proof and Urgency (Day 18)',
    subject: 'Join [X] patients who transformed their smiles with Invisalign',
    sending: '18 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 18 },
    template: `<p>Hi [Patient Name],</p><p>This is your final reminder about our special Invisalign offer - 15% off treatment packages ends [Date].</p><p>We've helped [X] patients achieve straighter, more confident smiles with Invisalign. Here's what they're saying:</p><p>"I wish I'd done this years ago. The process was so easy and the results are incredible." - Sophie T.</p><p>"Completely painless and no one noticed I was wearing them. Best investment ever." - Tom H.</p><p>"The team at [Practice Name] made everything simple. From consultation to final results, I felt supported every step." - Lisa M.</p><p>Don't let this opportunity pass. Invisalign can transform not just your smile, but your confidence and quality of life.</p><p>Final call to action:</p><ul><li>Call [Phone Number] by [Date] to claim your 15% discount</li><li>Limited consultation slots available</li><li>Join our family of happy, confident patients</li></ul><p>We'd be honored to be part of your smile transformation journey.</p><p>Looking forward to meeting you.</p><p>Best wishes,<br>[Practice Name] Team<br>[Website] | [Address] | [Phone Number]</p>`,
  },
  {
    key: 'check_up_day_1',
    type: 'Email',
    name: 'Health-Focused Introduction (Immediate)',
    subject: 'Your smile deserves expert care - book your dental exam today',
    sending: 'Immediately when lead comes into CRM',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 0 },
    template: `<p>Hi [Patient Name],</p><p>When was your last dental check-up? If you're like most people, it's probably been longer than you'd like to admit.</p><p>At [Practice Name], we believe preventative care is the foundation of lasting oral health. Our comprehensive dental exams do more than just check for cavities - we assess your overall oral health to catch small issues before they become big problems.</p><p>Your comprehensive exam includes:</p><ul><li>Thorough examination of teeth, gums, and soft tissues</li><li>Oral cancer screening</li><li>Gum disease assessment</li><li>Digital X-rays (if needed)</li><li>Personalized oral health advice</li><li>Professional cleaning (hygienist appointment)</li><li>Treatment plan for any issues identified</li></ul><p>Special offer: New patients receive a comprehensive exam, X-rays, and professional cleaning for just GBP [X] (usually GBP [Y]) - save GBP [Z].</p><p>Regular dental exams can save you thousands in future treatment costs by catching problems early. Plus, good oral health is linked to overall wellbeing, heart health, and longevity.</p><p>Ready to prioritize your oral health? Book your appointment today: [Phone Number]</p><p>We have early morning and evening slots available to fit your schedule.</p><p>Best wishes,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'check_up_day_3',
    type: 'Email',
    name: 'Overcome Fear and Anxiety (Day 4)',
    subject: 'Nervous about the dentist? We understand, and we are here to help',
    sending: '4 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 4 },
    template: `<p>Hi [Patient Name],</p><p>Dental anxiety is incredibly common - you're definitely not alone. Many of our patients tell us they've avoided the dentist for years because of fear or past negative experiences.</p><p>Here's what makes [Practice Name] different:</p><p><strong>Our gentle approach:</strong></p><ul><li>We listen to your concerns without judgment</li><li>You're in control - we'll stop anytime you need a break</li><li>We explain everything before we do it (no surprises)</li><li>Modern pain-free techniques and sedation options available</li><li>Calm, spa-like environment designed for relaxation</li><li>Extra time allocated so you never feel rushed</li></ul><p>"I hadn't been to a dentist in 8 years because of anxiety. The team at [Practice Name] made me feel so comfortable. I actually didn't mind being there." - Jennifer S.</p><p>"They took the time to understand my fears and worked at my pace. Best dental experience I've ever had." - Mark P.</p><p>The longer you wait, the more complex (and expensive) treatment becomes. But we promise to make your visit as comfortable as possible.</p><p>New patient offer: Comprehensive exam and cleaning for just GBP [X] this month.</p><p>Take the first step - call [Phone Number] today. Let us show you that dental visits can actually be pleasant.</p><p>Warmly,<br>[Practice Name] Team<br>[Email] | [Website]</p>`,
  },
  {
    key: 'check_up_day_5',
    type: 'Email',
    name: 'Prevention Equals Savings (Day 8)',
    subject: 'Save thousands with regular dental exams',
    sending: '8 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 8 },
    template: `<p>Hi [Patient Name],</p><p>Here's a truth most dentists won't tell you upfront: Regular check-ups can save you thousands of pounds in future dental work.</p><p>The cost of prevention vs treatment:</p><ul><li>Regular exam and cleaning: GBP [X] every 6 months</li><li>Filling (caught early): GBP [X]</li><li>Root canal (problem ignored): GBP [X]-GBP [X]</li><li>Crown after root canal: GBP [X]</li><li>Extraction and implant (worst case): GBP [X]-GBP [X]</li></ul><p>See the difference? A simple exam that catches a small cavity can prevent thousands in complex treatment later.</p><p>Plus, gum disease and oral infections can lead to serious health issues including heart disease, diabetes complications, and stroke. Prevention isn't just about your teeth - it's about your overall health.</p><p>This month only: New patient comprehensive exam package for GBP [X] (save GBP [Y])</p><p>This includes:</p><ul><li>Full oral health assessment</li><li>Digital X-rays</li><li>Professional cleaning</li><li>Personalized treatment plan</li><li>Oral hygiene guidance</li></ul><p>Think of it as an investment in your health and future savings. Book your appointment today: [Phone Number]</p><p>Our friendly team is here to help you maintain optimal oral health for life.</p><p>Best wishes,<br>[Practice Name] Team<br>[Address] | [Phone Number]</p>`,
  },
  {
    key: 'check_up_day_13',
    type: 'Email',
    name: 'Convenience and Technology (Day 13)',
    subject: 'Modern dentistry that fits your busy schedule',
    sending: '13 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 13 },
    template: `<p>Hi [Patient Name],</p><p>We know you're busy. That's why we've designed our practice around your convenience.</p><p>Flexible scheduling:</p><ul><li>Early morning appointments (from 7:30 AM)</li><li>Evening appointments (until 7:00 PM)</li><li>Saturday availability</li><li>Same-day emergency slots</li><li>Online booking available 24/7</li></ul><p>Modern technology for faster visits:</p><ul><li>Digital X-rays (90% less radiation, instant results)</li><li>Advanced diagnostics that catch issues early</li><li>Efficient appointments that respect your time</li><li>Text/email reminders so you never forget</li><li>Digital treatment plans you can review at home</li></ul><p>Comfortable, modern environment:</p><ul><li>Spa-like atmosphere</li><li>Music or TV during treatment</li><li>Comfortable treatment chairs</li><li>Complimentary refreshments</li><li>Friendly, caring staff who remember your name</li></ul><p>We've streamlined everything to make dental care as easy and pleasant as possible. Most routine exams take just 45-60 minutes.</p><p>Special offer ends soon: New patient exam package for GBP [X] - save GBP [Y].</p><p>Book online at [Website] or call [Phone Number]. We have appointments available this week.</p><p>Looking forward to welcoming you.</p><p>Best wishes,<br>[Practice Name] Team<br>[Website] | [Email]</p>`,
  },
  {
    key: 'check_up_day_18',
    type: 'Email',
    name: 'Final Urgency (Day 10)',
    subject: 'Last chance: £[Y] off new patient dental exam ends [Date]',
    sending: '10 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 10 },
    template: `<p>Hi [Patient Name],</p><p>This is your final reminder - our new patient special offer ends [Date].</p><p>Final chance to save: Comprehensive exam + X-rays + professional cleaning for just £[X] (regularly £[Y]).</p><p>Your oral health shouldn't wait. Here's why booking now matters:</p><ul><li>Catch problems early before they become painful and expensive</li><li>Professional cleaning removes buildup your toothbrush can't reach</li><li>Peace of mind knowing your oral health is in expert hands</li><li>Prevent future issues with personalized care advice</li><li>Save money with our limited-time new patient discount</li></ul><p>We've helped thousands of patients achieve and maintain healthy, beautiful smiles. Let us do the same for you.</p><p>Don't miss out:</p><ul><li>Call [Phone Number] by [Date] to claim this offer</li><li>Limited appointment slots available</li><li>Join our family of happy, healthy patients</li></ul><p>Our team is ready to welcome you with exceptional, gentle care.</p><p>Book now - your smile will thank you.</p><p>Warmly,<br>[Practice Name] Team<br>[Website] | [Address] | [Phone Number]</p>`,
  },
  {
    key: 'black_friday_7_days_before',
    type: 'Email',
    name: 'Black Friday - Early Access (5 Days Before)',
    subject: 'VIP Early Access: Black Friday deals revealed',
    sending: '5 days before Black Friday',
    enabled: false,
    trigger: { type: 'black_friday', offsetDays: -5 },
    template: `<p>Hi [Patient Name],</p><p>Black Friday is coming, and we're giving you exclusive early access to our biggest sale of the year.</p><p>Your VIP Black Friday Preview:</p><ul><li>Up to 20% off all dental treatments</li><li>Special package deals on smile makeovers</li><li>0% finance on treatments over GBP [X]</li></ul><p>This is our most generous offer all year - and as a valued lead, you get first access before the general public.</p><p>Early bird booking opens: [Date/Time]</p><p>Sale ends: [Date] at midnight</p><p>Popular treatments like Invisalign, composite bonding, and teeth whitening typically sell out within 48 hours during our Black Friday sale. Last year, we were fully booked by Saturday morning.</p><p>Mark your calendar and get ready to save big on the smile you've been dreaming about.</p><p>Set your reminder: Call [Phone Number] on [Date] at [Time] to secure your slot before they're gone.</p><p>Looking forward to helping you achieve your best smile at our best prices.</p><p>Best wishes,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'black_friday_launch',
    type: 'Email',
    name: 'Black Friday - Sale Launch (Morning)',
    subject: 'BLACK FRIDAY: 20% off starts now',
    sending: 'Black Friday morning',
    enabled: false,
    trigger: { type: 'black_friday', offsetDays: 0 },
    template: `<p>Hi [Patient Name],</p><p>It's here. Our Black Friday sale is officially live.</p><p>Today only - save up to 20% on:</p><ul><li>Invisalign clear aligners - save up to GBP [X]</li><li>Composite bonding - transform your smile for less</li><li>Teeth whitening - get camera-ready confidence</li><li>Dental implants - permanent solution, temporary price</li><li>Smile makeover packages - our biggest discount ever</li></ul><p>Plus exclusive bonuses:</p><ul><li>Free consultation (worth GBP [X])</li><li>Free teeth whitening with treatments over GBP [X]</li><li>0% finance available on all treatments</li><li>Priority booking for 2026 appointments</li></ul><p>Sale ends: Midnight tonight | Appointments remaining: Limited</p><p>Last year we filled our entire December and January calendar in just 24 hours. Don't miss this opportunity to invest in yourself at unbeatable prices.</p><p>Book now: Call [Phone Number] or visit [Website]</p><p>Appointments are filling fast.</p><p>Urgently yours,<br>[Practice Name] Team<br>[Phone Number] | [Email]</p>`,
  },
  {
    key: 'black_friday_midday',
    type: 'Email',
    name: 'Black Friday - Midday Urgency (Afternoon)',
    subject: 'Only 8 hours left: Black Friday slots filling fast',
    sending: 'Black Friday afternoon',
    enabled: false,
    trigger: { type: 'black_friday', offsetDays: 0, minHour: 12 },
    template: `<p>Hi [Patient Name],</p><p>Urgent: Our Black Friday sale ends at midnight, and we're nearly fully booked.</p><p>Slots remaining as of 2 PM:</p><ul><li>Invisalign consultations: 3 left</li><li>Composite bonding: 5 left</li><li>Teeth whitening: 7 left</li><li>Smile makeover packages: 2 left</li></ul><p>These are the lowest prices you'll see all year - up to 20% off plus free bonuses worth GBP [X].</p><p>Over [X] patients have already secured their discounted treatments today. Will you be one of them?</p><p>What you're missing if you don't act now:</p><ul><li>Up to GBP [X] in savings</li><li>Free teeth whitening (worth GBP [X])</li><li>Priority 2026 appointment slots</li><li>0% finance options</li></ul><p>Time remaining: 8 hours</p><p>Slots remaining: Single digits</p><p>Act now: Call [Phone Number] immediately or book online at [Website]</p><p>Urgently,<br>[Practice Name] Team<br>[Phone Number]</p>`,
  },
  {
    key: 'black_friday_last_chance',
    type: 'Email',
    name: 'Black Friday - Final Hours (Evening)',
    subject: 'Final call: Black Friday ends at midnight',
    sending: 'Black Friday evening',
    enabled: false,
    trigger: { type: 'black_friday', offsetDays: 0, minHour: 18 },
    template: `<p>Hi [Patient Name],</p><p>This is it. In less than 3 hours, our Black Friday sale will be gone forever.</p><p>Right now, we have just a handful of discounted treatment slots remaining:</p><ul><li>2 Invisalign packages</li><li>3 composite bonding appointments</li><li>4 teeth whitening sessions</li><li>1 smile makeover package</li></ul><p>Sale ends: Tonight at midnight</p><p>Final savings: Up to 20% off plus free bonuses</p><p>Slots left: Almost sold out</p><p>Do not wait: Call [Phone Number] right now or book at [Website]</p><p>After midnight, these prices are gone for an entire year.</p><p>Final urgency,<br>[Practice Name] Team<br>[Phone Number] | [Website]</p>`,
  },
  {
    key: 'black_friday_sale_ended',
    type: 'Email',
    name: 'Black Friday - Sale Ended (Saturday)',
    subject: 'You missed it - Black Friday sale is over',
    sending: 'Saturday morning after Black Friday',
    enabled: false,
    trigger: { type: 'black_friday', offsetDays: 1 },
    template: `<p>Hi [Patient Name],</p><p>Our Black Friday sale officially ended at midnight last night.</p><p>I'm reaching out because I noticed you didn't book your discounted treatment, and I wanted to make sure you didn't miss out due to a technical issue or oversight.</p><p>What happened yesterday:</p><ul><li>[X] patients booked discounted treatments</li><li>We filled our calendar through [Month]</li><li>Patients saved an average of GBP [X]</li><li>All promotional slots sold out by 11:47 PM</li></ul><p>Here's the good news: While the Black Friday sale is over, I can offer you a one-time 10% courtesy discount if you book your consultation this weekend.</p><p>Your exclusive weekend offer:</p><ul><li>10% off any treatment (not the full 20%, but better than regular pricing)</li><li>Valid only until Sunday at midnight</li><li>Must mention "Weekend Courtesy Offer" when booking</li></ul><p>This is genuinely your last opportunity for a discount until our next promotional period.</p><p>Book now: Call [Phone Number] and ask for the Weekend Courtesy Offer.</p><p>Don't let another year go by without the smile you deserve.</p><p>Last chance,<br>[Practice Name] Team<br>[Phone Number] | [Website]</p>`,
  },
  {
    key: 'birthday_day',
    type: 'Email',
    name: 'Birthday Promotion - Birthday Month',
    subject: '🎂 Happy Birthday Month, [Name]!',
    sending: '1st of birthday month',
    enabled: false,
    trigger: { type: 'birthday_month_start', offsetDays: 0 },
    template: `<p>Hi [Name],</p><p>🎉 IT'S YOUR BIRTHDAY MONTH! 🎉</p><p>At [Practice Name], we believe your birthday should be celebrated all month long - especially when it comes to investing in yourself.</p><p>Your Exclusive Birthday Gift:</p><ul><li>20% OFF any dental treatment (our biggest personal discount!)</li><li>FREE professional teeth whitening with treatment packages (worth £[X])</li><li>Complimentary birthday smile consultation</li></ul>`,
  },
  {
    key: 'christmas_email_day_1',
    type: 'Email',
    name: 'Christmas Promotion - Gift of Confidence (2 weeks before)',
    subject: '🎄 Give yourself the gift of confidence this Christmas',
    sending: '2 weeks before Christmas',
    enabled: false,
    trigger: { type: 'month_day', month: 12, day: 25, offsetDays: -14 },
    template: `<p>Hi [Name],</p><p>The holidays are the perfect time for fresh starts and new beginnings. This Christmas, why not give yourself the gift that keeps on giving - a smile you're proud to show off?</p><p>Our Christmas Gift to You:</p><ul><li>15% OFF all dental treatments booked in December</li><li>FREE teeth whitening worth £[X] with treatment packages</li><li>0% finance available - spread payments into 2026</li><li>Priority appointments for January/February 2026</li></ul><p>Imagine ringing in the New Year with renewed confidence:</p><ul><li>Smiling freely in family photos</li><li>Feeling attractive at holiday parties</li><li>Starting 2026 with the best version of yourself</li></ul><p>Christmas offer valid: Now through December 23rd</p><p>Appointments filling: Book early for January starts</p><p>Book your consultation: Call [Phone Number] or visit [Website]</p><p>Wishing you a season of joy and beautiful smiles!</p><p>Warmly,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'christmas_email_day_10',
    type: 'Email',
    name: 'Christmas Promotion - Holiday Smile Makeover (10 days before)',
    subject: '✨ Look your best in holiday photos - Christmas smile specials',
    sending: '10 days before Christmas',
    enabled: false,
    trigger: { type: 'month_day', month: 12, day: 25, offsetDays: -10 },
    template: `<p>Hi [Name],</p><p>Holiday gatherings, family photos, New Year celebrations - the next few weeks are full of moments you'll want to remember forever.</p><p>Fast-track treatments for the holidays:</p><ul><li>Express Teeth Whitening (1 visit) - Brighten up to 8 shades in 60 minutes - Christmas special: £[X] (save 15%)</li><li>Composite Bonding (1-2 visits) - Fix chips, gaps, or discoloration quickly - Christmas offer: 15% OFF + FREE whitening</li><li>Invisalign New Year Start - Begin your journey to straight teeth - 15% OFF treatment packages</li></ul><p>Limited December appointments available - our calendar is filling fast.</p><p>Book now for pre-holiday appointments: Call [Phone Number]</p><p>Don't hide your smile in this year's holiday photos. Let us help you look and feel your absolute best!</p><p>Festive wishes,<br>[Practice Name] Team<br>[Phone Number] | [Email]</p>`,
  },
  {
    key: 'christmas_email_day_5',
    type: 'Email',
    name: 'Christmas Promotion - Last Minute Gift (5 days before)',
    subject: '🎁 The perfect last-minute gift: A smile transformation',
    sending: '5 days before Christmas',
    enabled: false,
    trigger: { type: 'month_day', month: 12, day: 25, offsetDays: -5 },
    template: `<p>Hi [Name],</p><p>Still looking for the perfect gift? Give someone (or yourself!) something truly transformative this Christmas.</p><p>[Practice Name] Gift Vouchers:</p><ul><li>Available in any amount</li><li>Redeemable for any treatment</li><li>Beautiful presentation</li><li>Valid for 12 months</li><li>Can be sent digitally or posted</li></ul><p>Plus: All treatments booked before December 31st receive 15% OFF when you redeem your voucher!</p><p>Order gift vouchers: Call [Phone Number] or purchase online at [Website]</p><p>Digital vouchers delivered immediately - perfect for last-minute gifting!</p><p>Give the gift of confidence this Christmas.</p><p>With Christmas cheer,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'christmas_email_day_27',
    type: 'Email',
    name: 'Christmas Promotion - New Year Prep (2 days after)',
    subject: 'New Year, New Smile - Christmas offer extended!',
    sending: '2 days after Christmas',
    enabled: false,
    trigger: { type: 'month_day', month: 12, day: 25, offsetDays: 2 },
    template: `<p>Hi [Name],</p><p>How were your holidays? Now that Christmas is behind us, it's time to think about starting 2026 with confidence and purpose.</p><p>Great news: Due to popular demand, we're extending our Christmas offer through New Year's Day!</p><p>Start 2026 with your best smile:</p><ul><li>15% OFF all treatments booked by January 1st</li><li>FREE teeth whitening with comprehensive packages</li><li>Zero-deposit payment plans - start paying in February</li><li>Priority appointments for January</li></ul><p>Appointments are limited - January is our busiest month as people commit to their resolutions. Book now to secure your preferred dates.</p><p>Start your transformation: Call [Phone Number] or book at [Website]</p><p>Cheers to new beginnings,<br>[Practice Name] Team<br>[Phone Number] | [Email]</p>`,
  },
  {
    key: 'christmas_email_day_31',
    type: 'Email',
    name: 'Christmas Promotion - Final Extended Offer (New Year’s Eve)',
    subject: '⏰ Final hours: Christmas offer ends tonight at midnight',
    sending: 'New Year’s Eve',
    enabled: false,
    trigger: { type: 'month_day', month: 12, day: 31, offsetDays: 0 },
    template: `<p>Hi [Name],</p><p>This is your absolute last chance.</p><p>Our Christmas promotion - 15% OFF all treatments + FREE teeth whitening - ends tonight at midnight.</p><p>After tonight, prices return to normal and this offer won't be back until next Christmas.</p><p>Time remaining: Less than 12 hours</p><p>Appointments available: Very limited</p><p>This ends at midnight: Call [Phone Number] now or book instantly at [Website]</p><p>Don't start 2026 with regret. Start it with confidence.</p><p>Final call,<br>[Practice Name] Team<br>[Phone Number] | [Website]</p>`,
  },
  {
    key: 'new_year_email_day_1',
    type: 'Email',
    name: 'New Year Promotion - Resolution Focus (Jan 1)',
    subject: '💫 New Year, New Smile - Make 2026 YOUR year',
    sending: 'January 1st',
    enabled: false,
    trigger: { type: 'month_day', month: 1, day: 1, offsetDays: 0 },
    template: `<p>Hi [Name],</p><p>Happy New Year! 🎊</p><p>While others are making resolutions they'll abandon by February, you have the opportunity to make a lasting change that will impact every single day of 2026 and beyond.</p><p>Our New Year Resolution Support:</p><ul><li>20% OFF all smile transformation treatments</li><li>No payment required until March (0% interest)</li><li>FREE consultation + treatment planning</li><li>Bonus teeth whitening with packages</li></ul><p>New Year special valid: January 1-15 only</p><p>Start your transformation: Call [Phone Number] or book at [Website]</p><p>Limited January appointments available - our busiest month of the year!</p><p>Here's to your most confident year yet!</p><p>Enthusiastically yours,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'new_year_email_day_5',
    type: 'Email',
    name: 'New Year Promotion - Goal Achievement Strategy (Jan 5)',
    subject: 'Why smile transformations succeed when other resolutions fail',
    sending: 'January 5th',
    enabled: false,
    trigger: { type: 'month_day', month: 1, day: 1, offsetDays: 4 },
    template: `<p>Hi [Name],</p><p>It's January 5th. Statistics show that 80% of New Year resolutions fail by February.</p><p>But here's why smile transformations are different:</p><ul><li>Measurable results - You can see and feel the progress</li><li>Expert support - We guide you every step of the way</li><li>Timeline commitment - Structured treatment plan keeps you accountable</li><li>Life-changing results - Benefits you notice daily</li></ul><p>New Year special: 20% OFF + pay nothing until March!</p><p>Valid through January 15th only - [X] appointments already booked!</p><p>Book now: Call [Phone Number] or visit [Website]</p><p>Your future self is counting on you!</p><p>Best wishes,<br>[Practice Name] Team<br>[Phone Number] | [Email]</p>`,
  },
  {
    key: 'new_year_email_day_9',
    type: 'Email',
    name: 'New Year Promotion - Investment in Self (Jan 9)',
    subject: "The best investment you'll make in 2026 isn't financial",
    sending: 'January 9th',
    enabled: false,
    trigger: { type: 'month_day', month: 1, day: 1, offsetDays: 8 },
    template: `<p>Hi [Name],</p><p>While everyone else is focused on investment portfolios and savings accounts, consider this: The ROI of a confident smile is immeasurable.</p><p>Our New Year offer makes it affordable:</p><ul><li>20% OFF all treatments (save up to £[X])</li><li>Zero payments until March</li><li>Flexible finance plans from £[X]/month</li><li>FREE teeth whitening included</li></ul><p>Offer ends January 15th - only [X] promotional slots remaining!</p><p>Book your consultation: Call [Phone Number] or visit [Website]</p><p>Make 2026 the year everything changes!</p><p>Confidently yours,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'new_year_email_day_12',
    type: 'Email',
    name: 'New Year Promotion - Social Proof & Urgency (Jan 12)',
    subject: '[X] people have already started their 2026 smile journey',
    sending: 'January 12th',
    enabled: false,
    trigger: { type: 'month_day', month: 1, day: 1, offsetDays: 11 },
    template: `<p>Hi [Name],</p><p>Since January 1st, [X] people have booked smile transformation treatments at [Practice Name]. They're already on their way to more confident smiles. The question is: will you join them?</p><p>Only 3 days left to secure your 20% discount!</p><p>New Year offer ends: January 15th at 11:59 PM</p><p>Remaining appointments: Limited (70% already booked)</p><p>Book now: Call [Phone Number] or visit [Website]</p><p>Urgently yours,<br>[Practice Name] Team<br>[Phone Number] | [Email]</p>`,
  },
  {
    key: 'new_year_email_day_15',
    type: 'Email',
    name: 'New Year Promotion - Final Call (Jan 15)',
    subject: '🚨 TODAY ONLY: Final hours for 20% OFF New Year smile transformations',
    sending: 'January 15th',
    enabled: false,
    trigger: { type: 'month_day', month: 1, day: 1, offsetDays: 14 },
    template: `<p>Hi [Name],</p><p>THIS IS IT.</p><p>Our New Year promotion - 20% OFF + pay nothing until March - ends tonight at midnight.</p><p>Final call to action:</p><ul><li>Call [Phone Number] by [Date] to claim your 20% discount</li><li>Limited consultation slots available</li><li>Join our family of happy, confident patients</li></ul><p>Call now: [Phone Number]</p><p>Final urgency,<br>[Practice Name] Team<br>[Website] | [Address] | [Phone Number]</p>`,
  },
  {
    key: 'valentines_email_day_1',
    type: 'Email',
    name: "Valentine's Promotion - Love Yourself (2 weeks before)",
    subject: "💕 Fall in love with your smile this Valentine's Day",
    sending: '2 weeks before Valentines Day',
    enabled: false,
    trigger: { type: 'month_day', month: 2, day: 14, offsetDays: -14 },
    template: `<p>Hi [Name],</p><p>This Valentine's Day, forget the chocolates and flowers that fade in days. Give yourself something lasting - a smile you'll love for years to come.</p><p>Our Valentine's Gift to You:</p><ul><li>15% OFF all smile enhancement treatments</li><li>FREE professional teeth whitening with packages (worth £[X])</li><li>Couples' packages available - transform together and save even more</li></ul><p>Valentine's offer valid: Now through February 14th</p><p>Book your confidence boost: Call [Phone Number] or visit [Website]</p><p>With love,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'valentines_email_day_10',
    type: 'Email',
    name: "Valentine's Promotion - Date Night Ready (10 days before)",
    subject: "❤️ Look irresistible this Valentine's Day",
    sending: '10 days before Valentines Day',
    enabled: false,
    trigger: { type: 'month_day', month: 2, day: 14, offsetDays: -10 },
    template: `<p>Hi [Name],</p><p>Got Valentine's plans? Make sure your smile is as ready as your outfit!</p><p>Last-minute confidence boosters:</p><ul><li>Professional Teeth Whitening (60 minutes) - Valentine's special: £[X] (save 15%)</li><li>Quick Composite Touch-Ups - 15% OFF</li></ul><p>Couples special: Book together and save an additional 5%!</p><p>Limited pre-Valentine's appointments - our calendar is filling fast!</p><p>Book now: Call [Phone Number] - mention \"Valentine's Special\"</p><p>Romantically yours,<br>[Practice Name] Team<br>[Phone Number] | [Email]</p>`,
  },
  {
    key: 'valentines_email_day_5',
    type: 'Email',
    name: "Valentine's Promotion - Self-Love (5 days before)",
    subject: '💝 The most important relationship is with yourself',
    sending: '5 days before Valentines Day',
    enabled: false,
    trigger: { type: 'month_day', month: 2, day: 14, offsetDays: -5 },
    template: `<p>Hi [Name],</p><p>Valentine's Day isn't just for couples - it's the perfect reminder to love and invest in yourself.</p><p>Self-love investment ideas:</p><ul><li>Teeth Whitening - £[X] (save 15%)</li><li>Composite Bonding - From £[X]/tooth (save 15%)</li><li>Invisalign Start Package (save 15%)</li></ul><p>Valentine's Self-Love Special:</p><ul><li>15% OFF all treatments</li><li>FREE whitening with comprehensive packages</li><li>Flexible payment plans</li></ul><p>Offer ends February 14th - treat yourself before it's too late!</p><p>Book your self-love appointment: Call [Phone Number] or visit [Website]</p><p>With admiration,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'valentines_email_day_3',
    type: 'Email',
    name: "Valentine's Promotion - Couples Package (3 days before)",
    subject: "💑 Couples' special: Transform your smiles together",
    sending: '3 days before Valentines Day',
    enabled: false,
    trigger: { type: 'month_day', month: 2, day: 14, offsetDays: -3 },
    template: `<p>Hi [Name],</p><p>Looking for a unique Valentine's experience that's actually meaningful?</p><p>Introducing our Couples' Smile Transformation Package:</p><ul><li>Couples' Whitening Experience - £[X] (save 20%)</li><li>Partner Smile Makeover Package - Save up to 20%</li></ul><p>Extra Valentine's bonus: Book by February 14th and receive FREE take-home whitening kits for both partners (£[X] value)!</p><p>Limited couples' slots available - this is our most popular Valentine's offer!</p><p>Book together: Call [Phone Number] and ask for the Couples' Valentine's Package</p><p>Lovingly,<br>[Practice Name] Team<br>[Phone Number] | [Website]</p>`,
  },
  {
    key: 'valentines_email_day_14',
    type: 'Email',
    name: "Valentine's Promotion - Last Chance (Feb 14)",
    subject: "💌 Final hours: Valentine's smile special ends tonight",
    sending: 'Valentines Day',
    enabled: false,
    trigger: { type: 'month_day', month: 2, day: 14, offsetDays: 0 },
    template: `<p>Hi [Name],</p><p>FINAL CALL: Our Valentine's promotion ends tonight at midnight!</p><p>Today only:</p><ul><li>15% OFF all treatments</li><li>FREE teeth whitening with packages</li><li>Extra 5% OFF for couples</li><li>Priority appointment booking</li></ul><p>Call [Phone Number] RIGHT NOW or book instantly at [Website].</p><p>Final Valentine's wishes,<br>[Practice Name] Team<br>[Website] | [Address] | [Phone Number]</p>`,
  },
  {
    key: 'mothers_day_email_day_1',
    type: 'Email',
    name: 'Mothers Day Promotion - Appreciation Focus (3 weeks before)',
    subject: "💐 Celebrate Mum with the gift of confidence this Mother's Day",
    sending: '3 weeks before Mothers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 3, weekday: 0, weekIndex: 3, offsetDays: -21 },
    template: `<p>Hi [Name],</p><p>Mother's Day is approaching, and if you're looking for a gift that's truly meaningful, look no further.</p><p>Our Mother's Day Special:</p><ul><li>15% OFF all dental treatments for mums</li><li>FREE teeth whitening with treatment packages</li><li>Mother-Daughter/Son packages - save an extra 5%</li><li>Gift vouchers available</li></ul><p>Mother's Day special valid: Now through [Mother's Day date]</p><p>Book or purchase gift vouchers: Call [Phone Number] or visit [Website]</p><p>Warmly,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'mothers_day_email_day_2',
    type: 'Email',
    name: 'Mothers Day Promotion - Mother-Child Bonding (2 weeks before)',
    subject: "👩‍👧 Bond with Mum over smile transformations this Mother's Day",
    sending: '2 weeks before Mothers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 3, weekday: 0, weekIndex: 3, offsetDays: -14 },
    template: `<p>Hi [Name],</p><p>The best gifts aren't things - they're experiences shared together.</p><p>Mother & Child Special Package:</p><ul><li>20% OFF when you book together (extra 5% on top of Mother's Day discount!)</li><li>Same-day appointments available</li><li>Coordinated treatment planning</li></ul><p>Book together: Call [Phone Number] and mention \"Mother & Child Package\"</p><p>With appreciation,<br>[Practice Name] Team<br>[Phone Number] | [Email]</p>`,
  },
  {
    key: 'mothers_day_email_day_3',
    type: 'Email',
    name: 'Mothers Day Promotion - She Deserves It (10 days before)',
    subject: '🌺 Mum deserves more than flowers this year',
    sending: '10 days before Mothers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 3, weekday: 0, weekIndex: 3, offsetDays: -10 },
    template: `<p>Hi [Name],</p><p>Another Mother's Day, another bunch of flowers that will wilt in a week?</p><p>Thoughtful gift options:</p><ul><li>Gift Voucher - Any amount, redeemable for any treatment</li><li>Pre-Booked Treatment - Schedule whitening, bonding, or consultation</li><li>Treatment Package - Complete smile makeover</li></ul><p>Mother's Day special pricing:</p><ul><li>15% OFF all treatments</li><li>FREE whitening with packages</li><li>12-month voucher validity</li></ul><p>Order by [date] for guaranteed Mother's Day delivery!</p><p>Gift options: Call [Phone Number] or order online at [Website]</p><p>Appreciatively yours,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'mothers_day_email_day_4',
    type: 'Email',
    name: 'Mothers Day Promotion - Last Minute Gift (5 days before)',
    subject: "⏰ Last-minute Mother's Day gift - delivered instantly!",
    sending: '5 days before Mothers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 3, weekday: 0, weekIndex: 3, offsetDays: -5 },
    template: `<p>Hi [Name],</p><p>Digital Gift Vouchers - delivered to your inbox instantly, redeemable for any treatment, beautifully designed, and actually meaningful.</p><p>Why this is the perfect last-minute gift:</p><ul><li>Delivered in minutes (no shipping stress)</li><li>Shows thought and care</li><li>Valid for 12 months</li><li>15% bonus value included with Mother's Day special</li></ul><p>Order now: Visit [Website] or call [Phone Number]</p><p>Quick gift delivery,<br>[Practice Name] Team<br>[Phone Number] | [Website]</p>`,
  },
  {
    key: 'mothers_day_email_day_5',
    type: 'Email',
    name: 'Mothers Day Promotion - Final Day (Mothers Day)',
    subject: "💕 Happy Mother's Day - final hours for special pricing",
    sending: 'Mothers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 3, weekday: 0, weekIndex: 3, offsetDays: 0 },
    template: `<p>Hi [Name],</p><p>FINAL HOURS: Our Mother's Day special pricing ends tonight at midnight!</p><p>Today only:</p><ul><li>15% OFF all treatments</li><li>FREE teeth whitening with packages</li><li>20% OFF mother-child packages</li><li>Bonus value on all gift vouchers</li></ul><p>This pricing ends at midnight - after tonight, the special offer is gone until next Mother's Day.</p><p>Book or order: [Phone Number] | [Website]</p><p>With love and appreciation,<br>[Practice Name] Team<br>[Website] | [Address] | [Phone Number]</p>`,
  },
  {
    key: 'fathers_day_email_day_1',
    type: 'Email',
    name: "Father's Day Promotion - Dad Deserves It (2 weeks before)",
    subject: "🎁 Give Dad a gift he'll use every day - Father's Day smile special",
    sending: '2 weeks before Fathers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 6, weekday: 0, weekIndex: 3, offsetDays: -14 },
    template: `<p>Hi [Name],</p><p>Father's Day is coming, and if you're tired of giving Dad ties he won't wear and tools he doesn't need, we have the perfect solution.</p><p>Our Father's Day Special:</p><ul><li>20% OFF all dental treatments for dads</li><li>FREE teeth whitening with treatment packages</li><li>Express appointment booking</li><li>Gift vouchers available</li><li>Father & child packages</li></ul><p>Father's Day special valid: Now through Father's Day</p><p>Order gift voucher or book Dad's appointment: Call [Phone Number] or visit [Website]</p><p>With appreciation for all dads,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'fathers_day_email_day_2',
    type: 'Email',
    name: "Father's Day Promotion - Health Focus (10 days before)",
    subject: "📊 Why Dad's dental health matters more than he thinks",
    sending: '10 days before Fathers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 6, weekday: 0, weekIndex: 3, offsetDays: -10 },
    template: `<p>Hi [Name],</p><p>Uncomfortable truth: Men are 30% less likely than women to visit the dentist regularly. Dads especially tend to ignore dental health while prioritizing everyone else's appointments.</p><p>This Father's Day, change that pattern.</p><p>Father's Day offer designed for busy dads:</p><ul><li>20% OFF treatments</li><li>Express appointments</li><li>Flexible finance options</li><li>FREE consultation</li></ul><p>Book Dad's consultation: Call [Phone Number]</p><p>Give Dad the gift of health, confidence, and many more years of smiling!</p><p>With care for dads everywhere,<br>[Practice Name] Team<br>[Phone Number] | [Email]</p>`,
  },
  {
    key: 'fathers_day_email_day_3',
    type: 'Email',
    name: "Father's Day Promotion - Father-Child Bonding (5 days before)",
    subject: "👨‍👧‍👦 The Father's Day gift you'll both benefit from",
    sending: '5 days before Fathers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 6, weekday: 0, weekIndex: 3, offsetDays: -5 },
    template: `<p>Hi [Name],</p><p>Introducing: Father & Child Smile Packages. Transform your smiles together. Support each other through treatment. Create lasting memories. Both save money!</p><p>Father & Child Special Terms:</p><ul><li>25% OFF combined (20% Father's Day + 5% together bonus)</li><li>Coordinated scheduling</li><li>Family treatment planning</li></ul><p>Book your Father & Child package: Call [Phone Number] or visit [Website]</p><p>With family appreciation,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'fathers_day_email_day_4',
    type: 'Email',
    name: "Father's Day Promotion - Last Minute Gift (3 days before)",
    subject: "⏰ Last-minute Father's Day gift - delivered instantly!",
    sending: '3 days before Fathers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 6, weekday: 0, weekIndex: 3, offsetDays: -3 },
    template: `<p>Hi [Name],</p><p>Digital Gift Vouchers - Delivered Instantly to Your Inbox.</p><p>Why this is perfect for last-minute gifting:</p><ul><li>Instant digital delivery</li><li>Thoughtful and flexible</li><li>20% bonus value included</li></ul><p>Order now: [Website] or call [Phone Number]</p><p>With last-minute life-saving solutions,<br>[Practice Name] Team<br>[Phone Number] | [Website]</p>`,
  },
  {
    key: 'fathers_day_email_day_5',
    type: 'Email',
    name: "Father's Day Promotion - Final Day",
    subject: "🎉 Happy Father's Day to all the amazing dads!",
    sending: 'Fathers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 6, weekday: 0, weekIndex: 3, offsetDays: 0 },
    template: `<p>Hi [Name],</p><p>Happy Father's Day to all the incredible fathers, father-figures, and dad-heroes out there!</p><p>Father's Day offer - FINAL HOURS:</p><ul><li>Today only - Extra 5% bonus (total 25% savings)</li><li>FREE teeth whitening with packages</li><li>Gift vouchers include 20% bonus value</li></ul><p>Final chance: Call [Phone Number] or order online at [Website]</p><p>With appreciation for all fathers,<br>[Practice Name] Team<br>[Website] | [Address] | [Phone Number]</p>`,
  },
  {
    key: 'special_occasion_email_day_1',
    type: 'Email',
    name: 'Special Occasion - Big Event Preparation (Immediate)',
    subject: '✨ Look your absolute best for your special occasion',
    sending: 'Immediately when lead comes into CRM',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 0 },
    template: `<p>Hi [Name],</p><p>Got a big event coming up? Wedding, graduation, milestone birthday, job interview, or important presentation?</p><p>Pre-Event Smile Services:</p><ul><li>Express Teeth Whitening (1 visit, 60 minutes)</li><li>Composite Bonding (1-2 visits)</li><li>Smile Assessment & Planning (FREE consultation)</li></ul><p>Special occasion offer: 10% OFF event-prep treatments</p><p>Book your pre-event appointment: Call [Phone Number] or visit [Website]</p><p>Excitedly yours,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'special_occasion_email_day_4',
    type: 'Email',
    name: 'Special Occasion - Timeline Planning (Day 4)',
    subject: '📅 Plan your perfect smile for your special day',
    sending: '4 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 4 },
    template: `<p>Hi [Name],</p><p>Timing is everything when it comes to event-ready smiles!</p><p>Recommended timelines:</p><ul><li>Events 1-2 weeks away: Whitening, minor bonding, cleaning</li><li>Events 1-3 months away: Composite bonding, whitening maintenance</li><li>Events 6-12 months away: Invisalign, complete smile makeovers</li></ul><p>Free consultation to discuss your timeline: Call [Phone Number]</p><p>With excitement,<br>[Practice Name] Team<br>[Phone Number] | [Email]</p>`,
  },
  {
    key: 'special_occasion_email_day_8',
    type: 'Email',
    name: 'Special Occasion - Confidence Psychology (Day 8)',
    subject: '🌟 Why your smile matters more than you think on special occasions',
    sending: '8 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 8 },
    template: `<p>Hi [Name],</p><p>Research shows that in photos, videos, and memories of special events, your smile is what people remember most.</p><p>When you feel confident about your smile:</p><ul><li>You smile more naturally in photos</li><li>You feel more attractive and self-assured</li><li>You engage more freely with people</li></ul><p>10% special occasion discount available now!</p><p>Book your confidence consultation: Call [Phone Number] or visit [Website]</p><p>Confidently yours,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'special_occasion_email_day_13',
    type: 'Email',
    name: 'Special Occasion - Last-Minute Solutions (Day 13)',
    subject: '⚡ Last-minute smile emergencies? We can help!',
    sending: '13 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 13 },
    template: `<p>Hi [Name],</p><p>Event approaching fast and you just realized your smile needs attention?</p><p>Last-Minute Smile Solutions:</p><ul><li>Same-Day Teeth Whitening</li><li>Express Composite Repairs</li><li>Emergency Cleaning & Polish</li></ul><p>For urgent appointments: Call [Phone Number] immediately and mention your event date.</p><p>Ready to help,<br>[Practice Name] Team<br>[Phone Number] | [Website]</p>`,
  },
  {
    key: 'special_occasion_email_day_18',
    type: 'Email',
    name: 'Special Occasion - Post-Event Maintenance (Day 18)',
    subject: '💫 Keep your event-ready smile looking amazing',
    sending: '18 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 18 },
    template: `<p>Hi [Name],</p><p>Whether you've already had your treatment or you're still considering it, I wanted to share how to keep your smile looking event-ready all the time.</p><p>Long-term confidence solutions:</p><ul><li>Invisalign (permanent straightening)</li><li>Composite bonding (lasting transformations)</li><li>Regular whitening maintenance</li><li>Comprehensive smile makeovers</li></ul><p>10% special occasion discount still available for new bookings!</p><p>Call [Phone Number] or visit [Website] to discuss long-term solutions.</p><p>With ongoing support,<br>[Practice Name] Team<br>[Website] | [Address] | [Phone Number]</p>`,
  },
  {
    key: 'practice_anniversary_email_day_1',
    type: 'Email',
    name: 'Practice Anniversary - Announcement (2 weeks before)',
    subject: '🎉 Celebrating [X] years of beautiful smiles - thank YOU!',
    sending: '2 weeks before practice anniversary',
    enabled: false,
    trigger: { type: 'practice_anniversary', offsetDays: -14 },
    template: `<p>Hi [Name],</p><p>This month marks a very special milestone for us at [Practice Name] - we're celebrating [X] years of serving our wonderful community!</p><p>To celebrate, we're giving back to YOU:</p><ul><li>Anniversary Special: 20% OFF all treatments throughout [Month]</li><li>FREE teeth whitening with treatment packages over £[X]</li><li>Grand prize draw - Win a complete smile makeover worth £[X]</li><li>Exclusive anniversary gift for every patient who visits this month</li></ul><p>Book your anniversary appointment: Call [Phone Number] today</p><p>With heartfelt gratitude,<br>[Practice Name] Team<br>[Website] | [Address]</p>`,
  },
  {
    key: 'practice_anniversary_email_day_10',
    type: 'Email',
    name: 'Practice Anniversary - Milestone Stories (10 days before)',
    subject: '✨ [X] years, [X] smile transformations - your stories inspire us',
    sending: '10 days before practice anniversary',
    enabled: false,
    trigger: { type: 'practice_anniversary', offsetDays: -10 },
    template: `<p>Hi [Name],</p><p>As we approach our [X]-year anniversary, we've been reflecting on the incredible journey we've shared with patients like you.</p><p>Anniversary special continues:</p><ul><li>20% OFF all treatments throughout [Month]</li><li>FREE teeth whitening with packages over £[X]</li><li>Automatic entry into smile makeover prize draw (worth £[X])</li><li>Special financing - 0% interest on 12-month plans this month only</li></ul><p>Book your anniversary appointment: Call [Phone Number] or visit [Website]</p><p>With appreciation,<br>[Practice Name] Team<br>[Phone Number] | [Email]</p>`,
  },
  {
    key: 'practice_anniversary_email_day_5',
    type: 'Email',
    name: 'Practice Anniversary - Community Appreciation (5 days before)',
    subject: "💙 You're invited: Anniversary celebration week at [Practice Name]",
    sending: '5 days before practice anniversary',
    enabled: false,
    trigger: { type: 'practice_anniversary', offsetDays: -5 },
    template: `<p>Hi [Name],</p><p>Our [X]-year anniversary is almost here, and we're hosting a special celebration week - and YOU'RE invited!</p><p>Anniversary Celebration Week Details:</p><ul><li>Open house event - [Date], [Time]</li><li>Practice tours, photo booth, and prize draw</li><li>Free oral health screenings</li></ul><p>Anniversary week exclusive offer:</p><ul><li>20% OFF treatment cost</li><li>FREE teeth whitening (worth £[X])</li><li>Double entries into grand prize draw</li></ul><p>Book your appointment: Call [Phone Number] or visit [Website]</p><p>With excitement,<br>[Practice Name] Team<br>[Website] | [Address] | [Phone Number]</p>`,
  },
  {
    key: 'practice_anniversary_email_day_0',
    type: 'Email',
    name: 'Practice Anniversary - Anniversary Day',
    subject: '🎊 Today we celebrate [X] years - and it is all because of YOU',
    sending: 'Practice anniversary day',
    enabled: false,
    trigger: { type: 'practice_anniversary', offsetDays: 0 },
    template: `<p>Hi [Name],</p><p>Today is the day! [X] years ago, we opened our doors with hope, determination, and a commitment to exceptional dental care.</p><p>Anniversary Day Bonus: Book today and receive an EXTRA 5% off (total 25% discount!)</p><p>Anniversary month continues:</p><ul><li>20% OFF all treatments (25% if booked TODAY)</li><li>FREE teeth whitening with packages</li><li>Special financing terms</li><li>Prize draw entries with bookings</li></ul><p>Book your anniversary appointment: Call [Phone Number] or visit [Website]</p><p>With deep gratitude and celebration,<br>The entire [Practice Name] Family<br>[Website] | [Address] | [Phone Number]</p>`,
  },
  {
    key: 'practice_anniversary_email_month_end',
    type: 'Email',
    name: 'Practice Anniversary - Final Week Reminder',
    subject: '⏰ Final week: Anniversary celebration ends [Date]',
    sending: '5 days before end of anniversary month',
    enabled: false,
    trigger: { type: 'practice_anniversary_month_end', offsetDays: -5 },
    template: `<p>Hi [Name],</p><p>Our [X]-year anniversary celebration has been incredible - but it's almost over!</p><p>Time is running out to take advantage of our biggest offer of the year:</p><ul><li>20% OFF all treatments</li><li>FREE teeth whitening worth £[X]</li><li>Prize draw entry for smile makeover</li><li>Anniversary gift bags</li></ul><p>Final week availability is limited. Book now: Call [Phone Number] or visit [Website]</p><p>With final celebration wishes,<br>[Practice Name] Team<br>[Website] | [Address] | [Phone Number]</p>`,
  },
  {
    key: 'lead_enquiry_whatsapp_day_1',
    type: 'WhatsApp',
    name: 'Lead Enquiry - WhatsApp (Immediate)',
    subject: '',
    sending: 'Immediately when lead comes into CRM',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 0 },
    template: `Hi [Name]!
Thank you for your enquiry at [Practice Name]. We are excited to help you achieve your smile goals.
I am here to answer any questions and help you book a free consultation.
When would be a good time for you? We have appointments available this week.
Reply here or call [Phone Number].
[Practice Name]`,
  },
  {
    key: 'lead_enquiry_whatsapp_day_3',
    type: 'WhatsApp',
    name: 'Lead Enquiry - WhatsApp (Day 3)',
    subject: '',
    sending: '3 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 3 },
    template: `Hi [Name]!
Quick question - what is most important to you in choosing a dental practice?
We specialise in creating comfortable, stress-free experiences with honest, transparent care. Over [X] happy patients trust us with their smiles.
Ready to book your free consultation? Just let me know what works for you.
[Practice Name]
[Phone Number]`,
  },
  {
    key: 'lead_enquiry_whatsapp_day_7',
    type: 'WhatsApp',
    name: 'Lead Enquiry - WhatsApp (Day 7)',
    subject: '',
    sending: '7 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 7 },
    template: `Hi [Name]!
"Best dental practice I have ever been to!" - That is what Sarah said after her visit last week.
We would love to show you why our patients love us. Your free consultation includes a full assessment and personalized treatment plan.
Available slots: [Diary Booking Link]
Let me know what works.
[Practice Name]`,
  },
  {
    key: 'lead_enquiry_whatsapp_day_12',
    type: 'WhatsApp',
    name: 'Lead Enquiry - WhatsApp (Day 12)',
    subject: '',
    sending: '12 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 12 },
    template: `Hi [Name]!
I wanted to check in - do you have any questions about treatment, costs, or what to expect?
We offer:
- Transparent pricing
- Flexible payment plans
- Pain-free treatments
- Free consultation
I am here to help. Call [Phone Number] or just reply here.
[Practice Name]`,
  },
  {
    key: 'lead_enquiry_whatsapp_day_18',
    type: 'WhatsApp',
    name: 'Lead Enquiry - WhatsApp (Day 18)',
    subject: '',
    sending: '18 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 18 },
    template: `Hi [Name],
I do not want you to miss out on starting your smile journey with us.
We have just a few consultation slots left this month. Book now and take the first step towards the smile you deserve.
Call [Phone Number] or reply to secure your spot.
[Practice Name] Team
[Website]`,
  },
  {
    key: 'composite_bonding_whatsapp_day_1',
    type: 'WhatsApp',
    name: 'Composite Bonding - WhatsApp (Immediate)',
    subject: '',
    sending: 'Immediately when lead comes into CRM',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 0 },
    template: `Hi [Name]!
Interested in composite bonding? It is one of our most popular treatments.
- Transform your smile in one visit
- No drilling or pain
- Results last 5-10 years
- Much more affordable than veneers
Free consultation available this week. When works for you?
[Practice Name]
[Phone Number]`,
  },
  {
    key: 'composite_bonding_whatsapp_day_4',
    type: 'WhatsApp',
    name: 'Composite Bonding - WhatsApp (Day 4)',
    subject: '',
    sending: '4 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 4 },
    template: `Hi [Name]!
Did you know composite bonding can fix chips, gaps, and discoloration in just 60-90 minutes?
We have completed over [X] successful bonding treatments with stunning results.
Want to see what is possible for your smile? Book your free consultation: [Phone Number]
[Practice Name]`,
  },
  {
    key: 'composite_bonding_whatsapp_day_8',
    type: 'WhatsApp',
    name: 'Composite Bonding - WhatsApp (Day 8)',
    subject: '',
    sending: '8 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 8 },
    template: `Hi [Name]!
Great news - we are offering 10% off composite bonding consultations this month only.
Most treatments take just one visit with zero recovery time. Walk in, walk out with a new smile.
Available appointments: [Day/Time]
Reply to book your spot.
[Practice Name]
[Website]`,
  },
  {
    key: 'composite_bonding_whatsapp_day_13',
    type: 'WhatsApp',
    name: 'Composite Bonding - WhatsApp (Day 13)',
    subject: '',
    sending: '13 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 13 },
    template: `Hi [Name],
Quick question - is cost holding you back from your dream smile?
We offer flexible payment plans from just GBP [X]/month for composite bonding. Plus 15% off this month.
Lets make it work for you. Call [Phone Number] or reply here to discuss options.
[Practice Name]`,
  },
  {
    key: 'composite_bonding_whatsapp_day_18',
    type: 'WhatsApp',
    name: 'Composite Bonding - WhatsApp (Day 18)',
    subject: '',
    sending: '18 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 18 },
    template: `Hi [Name]!
Final reminder - our 15% off composite bonding offer ends [Date].
Do not miss out on this chance to transform your smile at an unbeatable price.
Only a few slots left. Call [Phone Number] now to book.
[Practice Name] Team
[Website]`,
  },
  {
    key: 'invisalign_whatsapp_day_1',
    type: 'WhatsApp',
    name: 'Invisalign - WhatsApp (Immediate)',
    subject: '',
    sending: 'Immediately when lead comes into CRM',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 0 },
    template: `Hi [Name]!
Interested in straightening your teeth discreetly? Invisalign might be perfect for you.
- Virtually invisible
- Removable and comfortable
- Results in 6-18 months
- Free 3D smile preview
When can you come in for a consultation? We have slots this week.
[Practice Name]
[Phone Number]`,
  },
  {
    key: 'invisalign_whatsapp_day_4',
    type: 'WhatsApp',
    name: 'Invisalign - WhatsApp (Day 4)',
    subject: '',
    sending: '4 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 4 },
    template: `Hi [Name]!
Did you know we can show you your new smile before you start Invisalign treatment?
Our 3D smile simulator lets you see exactly how you will look.
Book your free consultation and 3D preview: [Phone Number]
[Practice Name]`,
  },
  {
    key: 'invisalign_whatsapp_day_8',
    type: 'WhatsApp',
    name: 'Invisalign - WhatsApp (Day 8)',
    subject: '',
    sending: '8 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 8 },
    template: `Hi [Name]!
Special offer: 15% off Invisalign treatment this month.
That is a saving of up to GBP [X] on your smile transformation.
Most treatments take 12-18 months. Imagine your new smile by [Future Date].
Available appointments: [Days/Times]
Call [Phone Number] to book.
[Practice Name]`,
  },
  {
    key: 'invisalign_whatsapp_day_13',
    type: 'WhatsApp',
    name: 'Invisalign - WhatsApp (Day 13)',
    subject: '',
    sending: '13 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 13 },
    template: `Hi [Name],
Worried about cost? We offer flexible payment plans from just GBP [X]/month for Invisalign.
Plus 15% off this month = big savings.
Let us make your dream smile affordable. Reply here or call [Phone Number] to discuss options.
[Practice Name]
[Website]`,
  },
  {
    key: 'invisalign_whatsapp_day_18',
    type: 'WhatsApp',
    name: 'Invisalign - WhatsApp (Day 18)',
    subject: '',
    sending: '18 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 18 },
    template: `Hi [Name]!
LAST CHANCE - 15% off Invisalign ends [Date].
Over [X] patients trust us for their smile transformations. You could be next.
Only a few consultation slots left. Call [Phone Number] now to secure your discount.
[Practice Name] Team
[Website]`,
  },
  {
    key: 'check_up_whatsapp_day_1',
    type: 'WhatsApp',
    name: 'Dental Exam - WhatsApp (Immediate)',
    subject: '',
    sending: 'Immediately when lead comes into CRM',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 0 },
    template: `Hi [Name]!
When was your last dental check-up? We would love to help you maintain a healthy, beautiful smile.
New patient offer: Exam + X-rays + Cleaning = GBP [X] (save GBP [Y]).
Book your appointment: [Phone Number]
We have slots available this week.
[Practice Name]`,
  },
  {
    key: 'check_up_whatsapp_day_4',
    type: 'WhatsApp',
    name: 'Dental Exam - WhatsApp (Day 4)',
    subject: '',
    sending: '4 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 4 },
    template: `Hi [Name]!
Nervous about dental visits? You are not alone.
Our gentle, caring team specializes in making anxious patients feel comfortable. Over [X] happy patients trust us with their smiles.
Let us show you dentistry can be pleasant. Call [Phone Number] to book.
[Practice Name]`,
  },
  {
    key: 'check_up_whatsapp_day_8',
    type: 'WhatsApp',
    name: 'Dental Exam - WhatsApp (Day 8)',
    subject: '',
    sending: '8 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 8 },
    template: `Hi [Name]!
Did you know regular exams can save you thousands in future dental work?
Catch small problems early before they need expensive treatment.
Special offer: Comprehensive exam package GBP [X] (save GBP [Y]).
Book now: [Phone Number]
[Practice Name]
[Website]`,
  },
  {
    key: 'check_up_whatsapp_day_13',
    type: 'WhatsApp',
    name: 'Dental Exam - WhatsApp (Day 13)',
    subject: '',
    sending: '13 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 13 },
    template: `Hi [Name],
We make dental care convenient for busy lives.
- Early morning and evening appointments
- Saturday availability
- Modern, fast technology
- Online booking 24/7
New patient special: GBP [X] (save GBP [Y]).
Available slots: [Days/Times]
Call [Phone Number] to book.
[Practice Name]`,
  },
  {
    key: 'check_up_whatsapp_day_18',
    type: 'WhatsApp',
    name: 'Dental Exam - WhatsApp (Day 10)',
    subject: '',
    sending: '10 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 10 },
    template: `Hi [Name]!
FINAL REMINDER: New patient offer ends [Date].
Save GBP [Y] on comprehensive exam + cleaning.
Do not put your oral health on hold. Call [Phone Number] now to book before this offer expires.
[Practice Name] Team
[Website]`,
  },
  {
    key: 'black_friday_whatsapp_early_access',
    type: 'WhatsApp',
    name: 'Black Friday - WhatsApp Early Access',
    subject: '',
    sending: '5 days before Black Friday',
    enabled: false,
    trigger: { type: 'black_friday', offsetDays: -5 },
    template: `BLACK FRIDAY ALERT
Hi [Name]! VIP early access for you.
Our biggest sale of the year is coming:
- Up to 20% off all treatments
- Free teeth whitening with select treatments
- 0% finance available
Sale starts: [Date] at [Time]
Last year we sold out in 24 hours.
Set your reminder: [Phone Number]
[Practice Name]`,
  },
  {
    key: 'black_friday_whatsapp_launch',
    type: 'WhatsApp',
    name: 'Black Friday - WhatsApp Launch',
    subject: '',
    sending: 'Black Friday morning',
    enabled: false,
    trigger: { type: 'black_friday', offsetDays: 0 },
    template: `ITS LIVE. BLACK FRIDAY SALE.
Hi [Name]!
20% off all treatments today only.
- Invisalign - save up to GBP [X]
- Composite bonding
- Teeth whitening
- Smile makeovers
Plus free bonuses worth GBP [X].
Ends at midnight tonight.
Call [Phone Number] now.
[Practice Name]`,
  },
  {
    key: 'black_friday_whatsapp_midday',
    type: 'WhatsApp',
    name: 'Black Friday - WhatsApp Midday Urgency',
    subject: '',
    sending: 'Black Friday afternoon',
    enabled: false,
    trigger: { type: 'black_friday', offsetDays: 0, minHour: 12 },
    template: `URGENT: Only 8 hours left.
Hi [Name],
Slots filling fast:
Invisalign: 3 left
Bonding: 5 left
Whitening: 7 left
Up to 20% off ends at midnight.
This is your last chance for 2025s best prices.
Call [Phone Number] now before we sell out.
[Practice Name]
[Website]`,
  },
  {
    key: 'black_friday_whatsapp_final',
    type: 'WhatsApp',
    name: 'Black Friday - WhatsApp Final Hours',
    subject: '',
    sending: 'Black Friday evening',
    enabled: false,
    trigger: { type: 'black_friday', offsetDays: 0, minHour: 18 },
    template: `FINAL 3 HOURS.
Hi [Name]!
Black Friday sale ends at midnight. Almost sold out.
Only 2 Invisalign slots left
Only 1 smile makeover package left
Save up to GBP [X] - but only for 3 more hours.
Call [Phone Number] now or book: [Website]
[Practice Name]`,
  },
  {
    key: 'black_friday_whatsapp_sale_ended',
    type: 'WhatsApp',
    name: 'Black Friday - WhatsApp Sale Ended',
    subject: '',
    sending: 'Saturday morning after Black Friday',
    enabled: false,
    trigger: { type: 'black_friday', offsetDays: 1 },
    template: `Sale ended.
Hi [Name],
You missed Black Friday - sale ended at midnight.
But I can offer a one-time 10% courtesy discount this weekend only.
Valid until Sunday midnight. Call [Phone Number] and mention "Weekend Courtesy Offer".
Last chance.
[Practice Name]`,
  },
  {
    key: 'christmas_whatsapp_day_1',
    type: 'WhatsApp',
    name: 'Christmas Promo - WhatsApp (2 weeks before)',
    subject: '',
    sending: '2 weeks before Christmas',
    enabled: false,
    trigger: { type: 'month_day', month: 12, day: 25, offsetDays: -14 },
    template: `CHRISTMAS GIFT TO YOURSELF
Hi [Name]!
Give yourself confidence this holiday season.
- 15% off all treatments
- Free teeth whitening
- 0% finance available
Perfect timing for New Year transformations.
Book now: [Phone Number]
[Practice Name]
[Website]`,
  },
  {
    key: 'christmas_whatsapp_day_10',
    type: 'WhatsApp',
    name: 'Christmas Promo - WhatsApp (10 days before)',
    subject: '',
    sending: '10 days before Christmas',
    enabled: false,
    trigger: { type: 'month_day', month: 12, day: 25, offsetDays: -10 },
    template: `Holiday photos coming up?
Hi [Name]!
Look your best in holiday photos.
Express teeth whitening: GBP [X] (save 15%)
Composite bonding: 15% off
Invisalign: Start now, pay in February
Limited December slots available. Call [Phone Number] to book.
[Practice Name]`,
  },
  {
    key: 'christmas_whatsapp_day_5',
    type: 'WhatsApp',
    name: 'Christmas Promo - WhatsApp (5 days before)',
    subject: '',
    sending: '5 days before Christmas',
    enabled: false,
    trigger: { type: 'month_day', month: 12, day: 25, offsetDays: -5 },
    template: `Perfect last-minute gift.
Hi [Name],
Gift vouchers available for any dental treatment.
Digital delivery available instantly.
Order: [Phone Number] or [Website]
[Practice Name]`,
  },
  {
    key: 'christmas_whatsapp_day_27',
    type: 'WhatsApp',
    name: 'Christmas Promo - WhatsApp (2 days after)',
    subject: '',
    sending: '2 days after Christmas',
    enabled: false,
    trigger: { type: 'month_day', month: 12, day: 25, offsetDays: 2 },
    template: `NEW YEAR, NEW SMILE
Hi [Name]!
Extended: Christmas offer now through Jan 1st.
15% off all treatments booked by New Years Day.
January calendar is filling fast. Book now: [Phone Number]
[Practice Name]
[Website]`,
  },
  {
    key: 'christmas_whatsapp_day_31',
    type: 'WhatsApp',
    name: 'Christmas Promo - WhatsApp (New Years Eve)',
    subject: '',
    sending: 'New Years Eve',
    enabled: false,
    trigger: { type: 'month_day', month: 12, day: 31, offsetDays: 0 },
    template: `ENDS TONIGHT AT MIDNIGHT
Hi [Name]!
Final hours: 15% off + free whitening ends tonight.
Call [Phone Number] now or book: [Website]
Do not start 2026 with regret.
[Practice Name]`,
  },
  {
    key: 'new_year_whatsapp_day_1',
    type: 'WhatsApp',
    name: 'New Year Promo - WhatsApp (Jan 1)',
    subject: '',
    sending: 'January 1st',
    enabled: false,
    trigger: { type: 'month_day', month: 1, day: 1, offsetDays: 0 },
    template: `HAPPY NEW YEAR
Hi [Name]!
Make 2026 your year with a smile transformation.
20% off all treatments
Pay nothing until March
Free consultation + whitening
New Year offer: Jan 1-15 only.
Book now: [Phone Number]
[Practice Name]
[Website]`,
  },
  {
    key: 'new_year_whatsapp_day_5',
    type: 'WhatsApp',
    name: 'New Year Promo - WhatsApp (Jan 5)',
    subject: '',
    sending: 'January 5th',
    enabled: false,
    trigger: { type: 'month_day', month: 1, day: 1, offsetDays: 4 },
    template: `Resolution that actually works.
Hi [Name]!
Unlike gym memberships, smile transformations have guaranteed results.
20% off ends Jan 15.
Already [X] bookings this week.
Call [Phone Number] now.
[Practice Name]`,
  },
  {
    key: 'new_year_whatsapp_day_9',
    type: 'WhatsApp',
    name: 'New Year Promo - WhatsApp (Jan 9)',
    subject: '',
    sending: 'January 9th',
    enabled: false,
    trigger: { type: 'month_day', month: 1, day: 1, offsetDays: 8 },
    template: `Best investment of 2026?
Hi [Name],
Confident smile = better career, relationships, self-esteem.
20% off + GBP [X]/month payment plans.
Offer ends Jan 15 - only [X] slots left.
Book: [Phone Number]
[Practice Name]
[Website]`,
  },
  {
    key: 'new_year_whatsapp_day_12',
    type: 'WhatsApp',
    name: 'New Year Promo - WhatsApp (Jan 12)',
    subject: '',
    sending: 'January 12th',
    enabled: false,
    trigger: { type: 'month_day', month: 1, day: 1, offsetDays: 11 },
    template: `3 days left.
Hi [Name]!
[X] people have already started their 2026 smile journey.
20% off ends January 15.
70% of slots already booked.
Call [Phone Number]
[Practice Name]`,
  },
  {
    key: 'new_year_whatsapp_day_15',
    type: 'WhatsApp',
    name: 'New Year Promo - WhatsApp (Jan 15)',
    subject: '',
    sending: 'January 15th',
    enabled: false,
    trigger: { type: 'month_day', month: 1, day: 1, offsetDays: 14 },
    template: `TODAY ONLY - ENDS AT MIDNIGHT
Hi [Name]!
Final hours: 20% off + pay nothing until March.
Only 3 Invisalign and 5 bonding slots left.
Call [Phone Number] now before it is too late.
[Practice Name]
[Website]`,
  },
  {
    key: 'valentines_whatsapp_day_1',
    type: 'WhatsApp',
    name: 'Valentines Promo - WhatsApp (2 weeks before)',
    subject: '',
    sending: '2 weeks before Valentines Day',
    enabled: false,
    trigger: { type: 'month_day', month: 2, day: 14, offsetDays: -14 },
    template: `VALENTINES LOVE YOURSELF SPECIAL
Hi [Name]!
Fall in love with your smile.
- 15% off all treatments
- Free teeth whitening with packages
- Couples packages available
Valid through Feb 14.
Book: [Phone Number]
[Practice Name]
[Website]`,
  },
  {
    key: 'valentines_whatsapp_day_10',
    type: 'WhatsApp',
    name: 'Valentines Promo - WhatsApp (10 days before)',
    subject: '',
    sending: '10 days before Valentines Day',
    enabled: false,
    trigger: { type: 'month_day', month: 2, day: 14, offsetDays: -10 },
    template: `Date night ready?
Hi [Name]!
Look irresistible this Valentines Day.
Express teeth whitening: GBP [X] (save 15%)
Quick bonding fix-ups available
Appointments this week.
Couples special: Book together, save 20%.
Call [Phone Number] now.
[Practice Name]`,
  },
  {
    key: 'valentines_whatsapp_day_5',
    type: 'WhatsApp',
    name: 'Valentines Promo - WhatsApp (5 days before)',
    subject: '',
    sending: '5 days before Valentines Day',
    enabled: false,
    trigger: { type: 'month_day', month: 2, day: 14, offsetDays: -5 },
    template: `Love yourself first.
Hi [Name],
This Valentines, invest in you.
Confidence boost treatments:
- Teeth whitening
- Composite bonding
- Invisalign start
15% off ends Feb 14.
Call [Phone Number]
[Practice Name]
[Website]`,
  },
  {
    key: 'valentines_whatsapp_day_3',
    type: 'WhatsApp',
    name: 'Valentines Promo - WhatsApp (3 days before)',
    subject: '',
    sending: '3 days before Valentines Day',
    enabled: false,
    trigger: { type: 'month_day', month: 2, day: 14, offsetDays: -3 },
    template: `Couples special.
Hi [Name]!
Transform smiles together this Valentines.
Couples whitening: GBP [X] (save 20%)
Partner packages available
Bonus: Free take-home kits.
Limited slots. Call [Phone Number]
[Practice Name]`,
  },
  {
    key: 'valentines_whatsapp_day_14',
    type: 'WhatsApp',
    name: 'Valentines Promo - WhatsApp (Feb 14)',
    subject: '',
    sending: 'Valentines Day',
    enabled: false,
    trigger: { type: 'month_day', month: 2, day: 14, offsetDays: 0 },
    template: `ENDS TONIGHT AT MIDNIGHT
Hi [Name]!
Final hours: Valentines 15% off ends tonight.
Last chance to save up to GBP [X] and get free whitening.
Call [Phone Number] now.
[Practice Name]
[Website]`,
  },
  {
    key: 'mothers_day_whatsapp_day_1',
    type: 'WhatsApp',
    name: 'Mothers Day Promo - WhatsApp (3 weeks before)',
    subject: '',
    sending: '3 weeks before Mothers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 3, weekday: 0, weekIndex: 3, offsetDays: -21 },
    template: `MOTHERS DAY SPECIAL
Hi [Name]!
Give Mum confidence this Mothers Day.
- 15% off all treatments
- Free teeth whitening with packages
- Gift vouchers available
Valid through Mothers Day.
Book: [Phone Number]
[Practice Name]
[Website]`,
  },
  {
    key: 'mothers_day_whatsapp_day_2',
    type: 'WhatsApp',
    name: 'Mothers Day Promo - WhatsApp (2 weeks before)',
    subject: '',
    sending: '2 weeks before Mothers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 3, weekday: 0, weekIndex: 3, offsetDays: -14 },
    template: `Mother and child special.
Hi [Name]!
Transform smiles together.
20% off when you book with Mum.
Create lasting memories and support each other.
Call [Phone Number]
[Practice Name]`,
  },
  {
    key: 'mothers_day_whatsapp_day_3',
    type: 'WhatsApp',
    name: 'Mothers Day Promo - WhatsApp (10 days before)',
    subject: '',
    sending: '10 days before Mothers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 3, weekday: 0, weekIndex: 3, offsetDays: -10 },
    template: `Mum deserves better than flowers.
Hi [Name],
Give a gift that lasts:
Teeth whitening from GBP [X]
Composite bonding packages
Invisalign treatments
15% off Mothers Day special.
Gift vouchers: [Website]
[Practice Name]`,
  },
  {
    key: 'mothers_day_whatsapp_day_4',
    type: 'WhatsApp',
    name: 'Mothers Day Promo - WhatsApp (5 days before)',
    subject: '',
    sending: '5 days before Mothers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 3, weekday: 0, weekIndex: 3, offsetDays: -5 },
    template: `Last-minute gift solution.
Hi [Name]!
Digital gift vouchers delivered instantly.
Bonus: 15% extra value with all Mothers Day vouchers.
Order now: [Phone Number] or [Website]
Perfect last-minute gift.
[Practice Name]`,
  },
  {
    key: 'mothers_day_whatsapp_day_5',
    type: 'WhatsApp',
    name: 'Mothers Day Promo - WhatsApp (Mothers Day)',
    subject: '',
    sending: 'Mothers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 3, weekday: 0, weekIndex: 3, offsetDays: 0 },
    template: `HAPPY MOTHERS DAY
Hi [Name]!
Final hours: Mothers Day special ends tonight.
15% off all treatments
20% off mother-child packages
Call [Phone Number] now.
[Practice Name]`,
  },
  {
    key: 'fathers_day_whatsapp_day_1',
    type: 'WhatsApp',
    name: 'Fathers Day Promo - WhatsApp (2 weeks before)',
    subject: '',
    sending: '2 weeks before Fathers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 6, weekday: 0, weekIndex: 3, offsetDays: -14 },
    template: `FATHERS DAY SPECIAL
Hi [Name]!
Give Dad a gift he will use every day - a confident smile.
- 20% off all treatments for dads
- Free teeth whitening
- Gift vouchers available
- Father and child packages
Book: [Phone Number]
[Practice Name]`,
  },
  {
    key: 'fathers_day_whatsapp_day_2',
    type: 'WhatsApp',
    name: 'Fathers Day Promo - WhatsApp (10 days before)',
    subject: '',
    sending: '10 days before Fathers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 6, weekday: 0, weekIndex: 3, offsetDays: -10 },
    template: `Dads health matters.
Hi [Name],
Men visit dentists less often. Dads especially neglect dental health.
This Fathers Day, help Dad prioritize himself:
- 20% off treatments
- Express appointments for busy dads
- Flexible finance options
Gift health and confidence: [Phone Number]
[Practice Name]
[Website]`,
  },
  {
    key: 'fathers_day_whatsapp_day_3',
    type: 'WhatsApp',
    name: 'Fathers Day Promo - WhatsApp (5 days before)',
    subject: '',
    sending: '5 days before Fathers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 6, weekday: 0, weekIndex: 3, offsetDays: -5 },
    template: `Do it together.
Hi [Name]!
Father and child smile package:
Transform smiles together.
25% off for both.
Shared bonding experience and mutual support.
Book now: [Phone Number]
[Practice Name]`,
  },
  {
    key: 'fathers_day_whatsapp_day_4',
    type: 'WhatsApp',
    name: 'Fathers Day Promo - WhatsApp (3 days before)',
    subject: '',
    sending: '3 days before Fathers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 6, weekday: 0, weekIndex: 3, offsetDays: -3 },
    template: `Last-minute Fathers Day gift.
Hi [Name]!
Digital vouchers delivered instantly.
- 20% bonus value
- Email/print/text to Dad
- Valid 12 months
Order in 2 minutes.
Order now: [Website] or [Phone Number]
[Practice Name]`,
  },
  {
    key: 'fathers_day_whatsapp_day_5',
    type: 'WhatsApp',
    name: 'Fathers Day Promo - WhatsApp (Fathers Day)',
    subject: '',
    sending: 'Fathers Day',
    enabled: false,
    trigger: { type: 'weekday_of_month', month: 6, weekday: 0, weekIndex: 3, offsetDays: 0 },
    template: `HAPPY FATHERS DAY
Hi [Name]!
Today only: Extra 5% off = 25% total savings.
Offer ends midnight tonight.
Digital vouchers still available.
Final chance: [Phone Number]
[Practice Name]`,
  },
  {
    key: 'practice_anniversary_whatsapp_day_1',
    type: 'WhatsApp',
    name: 'Practice Anniversary - WhatsApp (2 weeks before)',
    subject: '',
    sending: '2 weeks before anniversary',
    enabled: false,
    trigger: { type: 'practice_anniversary', offsetDays: -14 },
    template: `BIG NEWS
Hi [Name]!
We are celebrating [X] years of beautiful smiles.
Anniversary special:
- 20% off all treatments
- Free teeth whitening
- Win smile makeover (GBP [X])
- Exclusive gifts
Valid throughout [Month].
Book now: [Phone Number]
[Practice Name]`,
  },
  {
    key: 'practice_anniversary_whatsapp_day_2',
    type: 'WhatsApp',
    name: 'Practice Anniversary - WhatsApp (10 days before)',
    subject: '',
    sending: '10 days before anniversary',
    enabled: false,
    trigger: { type: 'practice_anniversary', offsetDays: -10 },
    template: `Looking back at [X] incredible years thanks to patients like you.
Anniversary offer continues:
20% off (biggest discount ever)
Free whitening with packages
Prize draw entry with booking
0% finance this month only
Calendar filling fast.
Call [Phone Number]
[Practice Name]
[Website]`,
  },
  {
    key: 'practice_anniversary_whatsapp_day_3',
    type: 'WhatsApp',
    name: 'Practice Anniversary - WhatsApp (5 days before anniversary week)',
    subject: '',
    sending: '5 days before anniversary week',
    enabled: false,
    trigger: { type: 'practice_anniversary', offsetDays: -5 },
    template: `You are invited.
Anniversary Celebration Week: [Date range]
Events:
- Open house: [Specific Date], [Time]
- Practice tours
- Photo booth
- Prize draw live
- Free screenings
Book this week for 20% off + double prize entries.
RSVP: [Phone Number]
[Practice Name]`,
  },
  {
    key: 'practice_anniversary_whatsapp_day_4',
    type: 'WhatsApp',
    name: 'Practice Anniversary - WhatsApp (Anniversary day)',
    subject: '',
    sending: 'Anniversary day',
    enabled: false,
    trigger: { type: 'practice_anniversary', offsetDays: 0 },
    template: `IT IS OUR BIRTHDAY
Hi [Name]!
Today we celebrate [X] years - thank you.
Anniversary day bonus: 25% off today only.
Open house: [Time]-[Time]
Prize draw live at [Time]
Drop in or book: [Phone Number]
[Practice Name]`,
  },
  {
    key: 'practice_anniversary_whatsapp_day_5',
    type: 'WhatsApp',
    name: 'Practice Anniversary - WhatsApp (Final week)',
    subject: '',
    sending: '5 days before end of anniversary month',
    enabled: false,
    trigger: { type: 'practice_anniversary_month_end', offsetDays: -5 },
    template: `FINAL WEEK
Hi [Name]!
Anniversary celebration ends [Date].
Only 5 days left for:
- 20% off all treatments
- Free whitening
- Prize draw entry
- Special financing
Limited slots remaining.
Call [Phone Number] now.
[Practice Name]`,
  },
  {
    key: 'special_occasion_whatsapp_day_1',
    type: 'WhatsApp',
    name: 'Special Occasion - WhatsApp (Immediate)',
    subject: '',
    sending: 'Immediately when lead comes into CRM',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 0 },
    template: `Big event coming up?
Hi [Name]!
Look your absolute best for your special occasion.
Express treatments:
- Teeth whitening (1 visit)
- Composite bonding (1-2 visits)
- Priority booking available
10% special occasion discount.
Book: [Phone Number]
[Practice Name]`,
  },
  {
    key: 'special_occasion_whatsapp_day_4',
    type: 'WhatsApp',
    name: 'Special Occasion - WhatsApp (Day 4)',
    subject: '',
    sending: '4 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 4 },
    template: `Perfect timing.
Hi [Name]!
Lets plan your event-ready smile.
1-2 weeks away: Whitening
1-3 months: Bonding
6-12 months: Invisalign
Free consultation to plan your timeline.
Call [Phone Number]
[Practice Name]
[Website]`,
  },
  {
    key: 'special_occasion_whatsapp_day_8',
    type: 'WhatsApp',
    name: 'Special Occasion - WhatsApp (Day 8)',
    subject: '',
    sending: '8 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 8 },
    template: `Confidence matters.
Hi [Name],
Your smile is what people remember in photos.
Feel confident, look amazing, create better memories.
Small changes = big impact.
10% discount: [Phone Number]
[Practice Name]`,
  },
  {
    key: 'special_occasion_whatsapp_day_13',
    type: 'WhatsApp',
    name: 'Special Occasion - WhatsApp (Day 13)',
    subject: '',
    sending: '13 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 13 },
    template: `Last-minute emergency?
Hi [Name]!
Event approaching fast?
Same-day whitening available
Express repairs possible
Rush service for events
Call [Phone Number] and mention your event date.
We will help.
[Practice Name]`,
  },
  {
    key: 'special_occasion_whatsapp_day_18',
    type: 'WhatsApp',
    name: 'Special Occasion - WhatsApp (Day 18)',
    subject: '',
    sending: '18 days after enquiry',
    enabled: false,
    trigger: { type: 'inquiry_days', days: 18 },
    template: `Always event-ready.
Hi [Name],
Why scramble before each event?
Invest in a smile you are always confident about.
Long-term solutions:
- Invisalign
- Bonding
- Makeovers
10% discount: [Phone Number]
[Practice Name]
[Website]`,
  },
]

const crmAutomationGroupsAll = [
  {
    key: 'manual_responses',
    title: 'Manual Responses',
    description: 'Quick-send templates for common CRM replies.',
    source: 'default',
    templateKeys: ['send_price_list', 'practice_locations'],
  },
  {
    key: 'lead_enquiry',
    title: 'New Lead Enquiry Automation',
    description: 'Email and WhatsApp sequence for new leads.',
    source: 'default',
    templateKeys: [
      'lead_enquiry_day_1',
      'lead_enquiry_day_3',
      'lead_enquiry_day_5',
      'lead_enquiry_day_12',
      'lead_enquiry_day_18',
      'lead_enquiry_whatsapp_day_1',
      'lead_enquiry_whatsapp_day_3',
      'lead_enquiry_whatsapp_day_7',
      'lead_enquiry_whatsapp_day_12',
      'lead_enquiry_whatsapp_day_18',
    ],
  },
  {
    key: 'composite_bonding',
    title: 'Lead Nurture - Composite Bonding',
    description: 'Email and WhatsApp sequence for composite bonding.',
    source: 'default',
    templateKeys: [
      'composite_bonding_day_1',
      'composite_bonding_day_3',
      'composite_bonding_day_5',
      'composite_bonding_day_13',
      'composite_bonding_day_18',
      'composite_bonding_whatsapp_day_1',
      'composite_bonding_whatsapp_day_4',
      'composite_bonding_whatsapp_day_8',
      'composite_bonding_whatsapp_day_13',
      'composite_bonding_whatsapp_day_18',
    ],
  },
  {
    key: 'invisalign',
    title: 'Lead Nurture - Invisalign',
    description: 'Email and WhatsApp sequence for Invisalign.',
    source: 'default',
    templateKeys: [
      'invisalign_day_1',
      'invisalign_day_3',
      'invisalign_day_5',
      'invisalign_day_13',
      'invisalign_day_18',
      'invisalign_whatsapp_day_1',
      'invisalign_whatsapp_day_4',
      'invisalign_whatsapp_day_8',
      'invisalign_whatsapp_day_13',
      'invisalign_whatsapp_day_18',
    ],
  },
  {
    key: 'check_up',
    title: 'Lead Nurture - Dental Exam',
    description: 'Email and WhatsApp sequence for dental exams.',
    source: 'default',
    templateKeys: [
      'check_up_day_1',
      'check_up_day_3',
      'check_up_day_5',
      'check_up_day_13',
      'check_up_day_18',
      'check_up_whatsapp_day_1',
      'check_up_whatsapp_day_4',
      'check_up_whatsapp_day_8',
      'check_up_whatsapp_day_13',
      'check_up_whatsapp_day_18',
    ],
  },
  {
    key: 'black_friday',
    title: 'Black Friday Promotion',
    description: 'Email and WhatsApp Black Friday campaign.',
    source: 'default',
    templateKeys: [
      'black_friday_7_days_before',
      'black_friday_launch',
      'black_friday_midday',
      'black_friday_last_chance',
      'black_friday_sale_ended',
      'black_friday_whatsapp_early_access',
      'black_friday_whatsapp_launch',
      'black_friday_whatsapp_midday',
      'black_friday_whatsapp_final',
      'black_friday_whatsapp_sale_ended',
    ],
  },
  {
    key: 'christmas',
    title: 'Christmas Promotion',
    description: 'Email and WhatsApp Christmas campaign.',
    source: 'default',
    templateKeys: [
      'christmas_email_day_1',
      'christmas_email_day_10',
      'christmas_email_day_5',
      'christmas_email_day_27',
      'christmas_email_day_31',
      'christmas_whatsapp_day_1',
      'christmas_whatsapp_day_10',
      'christmas_whatsapp_day_5',
      'christmas_whatsapp_day_27',
      'christmas_whatsapp_day_31',
    ],
  },
  {
    key: 'new_year',
    title: 'New Year Promotion',
    description: 'Email and WhatsApp New Year campaign.',
    source: 'default',
    templateKeys: [
      'new_year_email_day_1',
      'new_year_email_day_5',
      'new_year_email_day_9',
      'new_year_email_day_12',
      'new_year_email_day_15',
      'new_year_whatsapp_day_1',
      'new_year_whatsapp_day_5',
      'new_year_whatsapp_day_9',
      'new_year_whatsapp_day_12',
      'new_year_whatsapp_day_15',
    ],
  },
  {
    key: 'valentines',
    title: 'Valentines Promotion',
    description: 'Email and WhatsApp Valentines campaign.',
    source: 'default',
    templateKeys: [
      'valentines_email_day_1',
      'valentines_email_day_10',
      'valentines_email_day_5',
      'valentines_email_day_3',
      'valentines_email_day_14',
      'valentines_whatsapp_day_1',
      'valentines_whatsapp_day_10',
      'valentines_whatsapp_day_5',
      'valentines_whatsapp_day_3',
      'valentines_whatsapp_day_14',
    ],
  },
  {
    key: 'mothers_day',
    title: 'Mothers Day Promotion',
    description: 'Email and WhatsApp Mothers Day campaign.',
    source: 'default',
    templateKeys: [
      'mothers_day_email_day_1',
      'mothers_day_email_day_2',
      'mothers_day_email_day_3',
      'mothers_day_email_day_4',
      'mothers_day_email_day_5',
      'mothers_day_whatsapp_day_1',
      'mothers_day_whatsapp_day_2',
      'mothers_day_whatsapp_day_3',
      'mothers_day_whatsapp_day_4',
      'mothers_day_whatsapp_day_5',
    ],
  },
  {
    key: 'birthday',
    title: 'Birthday Promotion',
    description: 'Birthday month greeting email.',
    source: 'default',
    templateKeys: ['birthday_day'],
  },
  {
    key: 'practice_anniversary',
    title: 'Practice Anniversary Promotion',
    description: 'Email and WhatsApp practice anniversary campaign.',
    source: 'default',
    templateKeys: [
      'practice_anniversary_email_day_1',
      'practice_anniversary_email_day_10',
      'practice_anniversary_email_day_5',
      'practice_anniversary_email_day_0',
      'practice_anniversary_email_month_end',
      'practice_anniversary_whatsapp_day_1',
      'practice_anniversary_whatsapp_day_2',
      'practice_anniversary_whatsapp_day_3',
      'practice_anniversary_whatsapp_day_4',
      'practice_anniversary_whatsapp_day_5',
    ],
  },
  {
    key: 'fathers_day',
    title: 'Fathers Day Promotion',
    description: 'Email and WhatsApp Fathers Day campaign.',
    source: 'default',
    templateKeys: [
      'fathers_day_email_day_1',
      'fathers_day_email_day_2',
      'fathers_day_email_day_3',
      'fathers_day_email_day_4',
      'fathers_day_email_day_5',
      'fathers_day_whatsapp_day_1',
      'fathers_day_whatsapp_day_2',
      'fathers_day_whatsapp_day_3',
      'fathers_day_whatsapp_day_4',
      'fathers_day_whatsapp_day_5',
    ],
  },
  {
    key: 'special_occasion',
    title: 'Special Occasion Automation',
    description: 'Email and WhatsApp special occasion sequence.',
    source: 'default',
    templateKeys: [
      'special_occasion_email_day_1',
      'special_occasion_email_day_4',
      'special_occasion_email_day_8',
      'special_occasion_email_day_13',
      'special_occasion_email_day_18',
      'special_occasion_whatsapp_day_1',
      'special_occasion_whatsapp_day_4',
      'special_occasion_whatsapp_day_8',
      'special_occasion_whatsapp_day_13',
      'special_occasion_whatsapp_day_18',
    ],
  },
]

const crmAutomationDefaults = crmAutomationDefaultsAll

const crmAutomationGroups = crmAutomationGroupsAll

export { crmAutomationDefaults, crmAutomationGroups }



