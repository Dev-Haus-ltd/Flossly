export const defaultTemplatesByGroup = {
  new_patient_booking: [
    {
      key: 'new_patient_booking_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Welcome to Your New Dental Home!</p><p>Hi [First Name], we're thrilled you've chosen [Practice Name]. Your first appointment is confirmed for [Date/Time]. To make your visit smooth, please fill out your welcome forms here: [link]. Any questions? Our team is just a call or reply away!</p>`
    },
    {
      key: 'new_patient_booking_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Meet Your [Practice Name] Team & What to Expect</p><p>Your appointment is just a few days away! Meet your dentist and care team here: [team page]. Watch our welcome video to see how we make visits easy even if you feel nervous about the dentist. Any last-minute questions? Reply for instant answers.</p>`
    },
    {
      key: 'new_patient_booking_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Your Smile Journey Begins Soon!</p><p>Just a quick reminder of your appointment this week. Here's a checklist to help you prepare: [pre-visit checklist]. Can't make it or need to adjust your time? Use this link: [reschedule link].</p>`
    },
  ],
  composite_bonding: [
    {
      key: 'composite_bonding_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Prepare for Your Composite Bonding Consultation</p><p>Hi [First Name], your composite bonding journey starts soon! Review our prep guide and FAQs: [link]. Thinking about the results? See our before-and-after gallery for inspiration.</p>`
    },
    {
      key: 'composite_bonding_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Curious About Composite Bonding?</p><p>Still thinking about your visit? Our patients love their natural-looking, fast results. Read their 5-star testimonials here: [testimonials link].</p>`
    },
    {
      key: 'composite_bonding_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Let's Make Your Dream Smile a Reality</p><p>We're excited to see you soon. Don't forget to bring your photo inspirations or questions. Your perfect smile is a conversation away!</p>`
    },
  ],
  invisalign: [
    {
      key: 'invisalign_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Countdown to Confident Smiles - Your Invisalign Welcome</p><p>Welcome, [First Name]! Here's what to expect at your upcoming Invisalign appointment: [link]. Take our quick quiz to see how Invisalign fits your lifestyle.</p>`
    },
    {
      key: 'invisalign_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Invisalign - Designed for Your Lifestyle</p><p>We know you're busy! Invisalign is flexible, practically invisible, and can fit around work or family. Want to see an animated simulation of your new smile? Ask us at your visit!</p>`
    },
    {
      key: 'invisalign_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Your Free Scan & Consultation Awaits</p><p>Still have questions about costs, comfort, or results? We're an email or call away. Ready to take the first step? We'll guide you at every stage.</p>`
    },
  ],
  check_up: [
    {
      key: 'checkup_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Appointment Confirmed - Let's Keep Your Smile Healthy</p><p>Thanks for booking a check-up! Did you know regular exams prevent expensive dental work later? Here's what happens at your visit: [video].</p>`
    },
    {
      key: 'checkup_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Top Questions Before Your Dental Check-Up</p><p>Nervous or new to our practice? See our patient guide on what to expect and what to bring. We look forward to meeting you!</p>`
    },
    {
      key: 'checkup_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Your Appointment is This Week!</p><p>Got a dental concern or update for your dentist? Reply here. We want your visit to be perfect.</p>`
    },
  ],
  implant: [
    {
      key: 'implant_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Ready for Your Dental Implant Consultation?</p><p>Your implant consultation is booked! Watch our intro video to meet your specialist: [link]. Learn how to prepare for a smooth visit.</p>`
    },
    {
      key: 'implant_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Your Implant Journey - Common Questions Answered</p><p>Wondering about costs, healing, or long-term success? Our experts answer the most common questions here: [FAQ link].</p>`
    },
    {
      key: 'implant_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> See Real Implant Smiles</p><p>Take a look at real patient stories and before-and-after results: [gallery]. We look forward to helping you regain confidence in your smile.</p>`
    },
  ],
  teeth_whitening: [
    {
      key: 'teeth_whitening_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Shine Bright - Your Whitening Visit is Booked</p><p>Get ready for your teeth whitening. See the best ways to prep for outstanding results: [care guide].</p>`
    },
    {
      key: 'teeth_whitening_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Boost Your Results With These Simple Steps</p><p>Whitening works best when you avoid staining foods and drinks. Want tips for a long-lasting result? Check out our quick video: [link].</p>`
    },
    {
      key: 'teeth_whitening_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> It's Almost Time to Glow!</p><p>Remember to follow your pre-visit advice. Got questions? Our team is always here for you.</p>`
    },
  ],
  appointment_follow_up: [
    {
      key: 'appointment_follow_up_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Thank You for Visiting - Your Feedback Means Everything</p><p>Hi [First Name], thank you for trusting [Practice Name]! If you have any swelling, discomfort, or just want advice, hit reply. We care about your aftercare as much as your appointment.</p>`
    },
    {
      key: 'appointment_follow_up_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Can We Improve? Quick Feedback</p><p>Your opinion helps us get even better! Please fill out our 1-minute patient survey: [link]. Your experience matters.</p>`
    },
    {
      key: 'appointment_follow_up_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Simple Tips for Post-Visit Care</p><p>Wondering what's next after your appointment? Here's a handy guide, plus how to contact us if you need anything: [care tips link].</p>`
    },
  ],
  patient_cancelled_appointment: [
    {
      key: 'patient_cancelled_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Sorry We Missed You</p><p>We noticed you had to cancel today. Is there anything we can help with? We'd love to get you rebooked for better dental health.</p>`
    },
    {
      key: 'patient_cancelled_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Let's Find a New Time For Your Visit</p><p>We're holding a few slots open this week. Book your new appointment online or call us for personal assistance.</p>`
    },
    {
      key: 'patient_cancelled_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Keep Your Smile On Track - Rebook Today</p><p>Prevention is better than cure! Schedule at your convenience here: [link]. Need help? We're a call away.</p>`
    },
  ],
  recalls_reactivation: [
    {
      key: 'dentist_recall_day_1',
      type: 'Email',
      name: 'Dentist Recall - Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Time for Your 6-Month Smile Check</p><p>Hi [First Name], it's time for your next check-up! Early detection means healthier smiles and lower costs. Book now: [link].</p>`
    },
    {
      key: 'dentist_recall_day_3',
      type: 'Email',
      name: 'Dentist Recall - Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> We Miss Seeing Your Smile!</p><p>A gentle nudge. Book your appointment to keep your teeth and gums in the best shape.</p>`
    },
    {
      key: 'dentist_recall_day_5',
      type: 'Email',
      name: 'Dentist Recall - Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> One Last Reminder - Your Dental Health Matters</p><p>We don't want you to miss this important visit. Click here to reserve your time: [booking link].</p>`
    },
    {
      key: 'hygiene_recall_day_1',
      type: 'Email',
      name: 'Hygiene Recall - Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Time for a Refresh - Book Your Hygiene Appointment</p><p>Hi [First Name], let's keep your mouth fresh and healthy. Book your professional clean today!</p>`
    },
    {
      key: 'hygiene_recall_day_3',
      type: 'Email',
      name: 'Hygiene Recall - Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Your Healthy Smile is Waiting</p><p>Still thinking about booking? Let's find a time that works for you. Reply or use our online scheduler.</p>`
    },
    {
      key: 'hygiene_recall_day_5',
      type: 'Email',
      name: 'Hygiene Recall - Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Goodbye Plaque - Book Your Hygiene Visit</p><p>It just takes an hour to give your teeth a complete refresh. Our team is ready to help you shine.</p>`
    },
  ],
  birthday_anniversary: [
    {
      key: 'birthday_anniversary_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Happy Birthday From All of Us!</p><p>It's your special day! Enjoy a complimentary [gift/service] on your next visit. Just mention "birthday" when booking.</p>`
    },
    {
      key: 'birthday_anniversary_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Your Birthday Gift Awaits - Don't Forget to Book!</p><p>Swing by this month and pick up your gift. We love celebrating your milestones.</p>`
    },
    {
      key: 'birthday_anniversary_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Final Call - Birthday Offer Ends Soon</p><p>Last chance to redeem your birthday bonus!</p>`
    },
  ],
  patient_no_show_follow_up: [
    {
      key: 'patient_no_show_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> We Missed Seeing You</p><p>Hi [First Name], hope all is well. Would you like to reschedule your missed appointment? We'll make it easy.</p>`
    },
    {
      key: 'patient_no_show_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Ready for a Fresh Start?</p><p>Keeping up with dental visits is vital. Click or call for new time options.</p>`
    },
    {
      key: 'patient_no_show_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> We're Here When You're Ready</p><p>Your dental health is important to us. Reach out anytime. You're always welcome back.</p>`
    },
  ],
  post_treatment_check_in: [
    {
      key: 'post_treatment_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Checking In On Your Recovery</p><p>How are you feeling? Let us know if you need any reassurance or aftercare advice.</p>`
    },
    {
      key: 'post_treatment_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Your Recovery Matters to Us</p><p>Still feeling discomfort? Reply for prompt support. Your comfort comes first.</p>`
    },
    {
      key: 'post_treatment_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Need Any More Guidance?</p><p>Quick tips for faster healing are here: [link]. We're happy to answer any follow-up questions.</p>`
    },
  ],
  referral_automation: [
    {
      key: 'referral_day_1',
      type: 'Email',
      name: 'Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Share Your Smile & Get Rewarded!</p><p>Loved your visit? Refer a friend and both of you receive [reward/discount]. Share the gift of great dental care!</p>`
    },
    {
      key: 'referral_day_3',
      type: 'Email',
      name: 'Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Who Else Deserves a Perfect Smile?</p><p>Thank you for trusting us. Your referral could change someone's smile and you both benefit.</p>`
    },
    {
      key: 'referral_day_5',
      type: 'Email',
      name: 'Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Spread the Word, Keep Earning</p><p>Refer another friend, get even more rewards! There's no limit to how many you can help.</p>`
    },
  ],
  social_review_campaigns: [
    {
      key: 'google_review_day_1',
      type: 'Email',
      name: 'Google Review - Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Share Your Experience - Google Review Invitation</p><p>Your feedback helps other patients find the best care! Leave us a review here: [Google review link].</p>`
    },
    {
      key: 'google_review_day_3',
      type: 'Email',
      name: 'Google Review - Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Your Feedback Fuels Our Growth</p><p>Did you enjoy your appointment? We'd be grateful for your quick Google review.</p>`
    },
    {
      key: 'google_review_day_5',
      type: 'Email',
      name: 'Google Review - Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Last Chance - Your Review Makes a Difference</p><p>Still haven't left a review? We'd truly appreciate your support!</p>`
    },
    {
      key: 'facebook_review_day_1',
      type: 'Email',
      name: 'Facebook Review - Day 1',
      sending: 'Day 1',
      enabled: false,
      template: `<p><strong>Subject:</strong> Tell Your Story - Leave Us a Facebook Review</p><p>Share your success story with our online community! Click here: [Facebook review link].</p>`
    },
    {
      key: 'facebook_review_day_3',
      type: 'Email',
      name: 'Facebook Review - Day 3',
      sending: 'Day 3',
      enabled: false,
      template: `<p><strong>Subject:</strong> Thanks Again - Your Voice Matters</p><p>Our practice grows with your feedback. Take a moment to write a quick Facebook review.</p>`
    },
    {
      key: 'facebook_review_day_5',
      type: 'Email',
      name: 'Facebook Review - Day 5',
      sending: 'Day 5',
      enabled: false,
      template: `<p><strong>Subject:</strong> Final Reminder - Spread the Word!</p><p>Just one more ask to leave a review and help us reach more smiles like yours.</p>`
    },
  ],
}

export const defaultAutomationGroups = [
  {
    key: 'new_patient_booking',
    title: 'New Patient Booking Automation',
    description: 'Welcome and prepare new patients before their first visit.',
    itemCount: (defaultTemplatesByGroup.new_patient_booking || []).length,
    image: null,
  },
  {
    key: 'composite_bonding',
    title: 'Composite Bonding',
    description: 'Educate and reassure patients booked for composite bonding.',
    itemCount: (defaultTemplatesByGroup.composite_bonding || []).length,
    image: null,
  },
  {
    key: 'invisalign',
    title: 'Invisalign',
    description: 'Build confidence and answer common Invisalign questions.',
    itemCount: (defaultTemplatesByGroup.invisalign || []).length,
    image: null,
  },
  {
    key: 'check_up',
    title: 'Check-Up',
    description: 'Prepare patients for routine check-up appointments.',
    itemCount: (defaultTemplatesByGroup.check_up || []).length,
    image: null,
  },
  {
    key: 'implant',
    title: 'Implant',
    description: 'Support patients ahead of implant consultations.',
    itemCount: (defaultTemplatesByGroup.implant || []).length,
    image: null,
  },
  {
    key: 'teeth_whitening',
    title: 'Teeth Whitening',
    description: 'Get patients ready for their whitening visit.',
    itemCount: (defaultTemplatesByGroup.teeth_whitening || []).length,
    image: null,
  },
  {
    key: 'appointment_follow_up',
    title: 'Appointment Follow-Up Automation',
    description: 'Check in and collect feedback after appointments.',
    itemCount: (defaultTemplatesByGroup.appointment_follow_up || []).length,
    image: null,
  },
  {
    key: 'patient_cancelled_appointment',
    title: 'Patient Cancelled Appointment Automation',
    description: 'Encourage cancelled patients to rebook.',
    itemCount: (defaultTemplatesByGroup.patient_cancelled_appointment || []).length,
    image: null,
  },
  {
    key: 'recalls_reactivation',
    title: 'Recalls and Reactivation',
    description: 'Dentist and hygiene recall follow-ups.',
    itemCount: (defaultTemplatesByGroup.recalls_reactivation || []).length,
    image: null,
  },
  {
    key: 'birthday_anniversary',
    title: 'Birthday & Anniversary Automations',
    description: 'Celebrate patients and drive bookings around milestones.',
    itemCount: (defaultTemplatesByGroup.birthday_anniversary || []).length,
    image: null,
  },
  {
    key: 'patient_no_show_follow_up',
    title: 'Patient No-Show/Cancellation Follow-Up',
    description: 'Reconnect with patients who missed appointments.',
    itemCount: (defaultTemplatesByGroup.patient_no_show_follow_up || []).length,
    image: null,
  },
  {
    key: 'post_treatment_check_in',
    title: 'Post-Treatment Check-In',
    description: 'Check on recovery after treatments.',
    itemCount: (defaultTemplatesByGroup.post_treatment_check_in || []).length,
    image: null,
  },
  {
    key: 'referral_automation',
    title: 'Referral Automation',
    description: 'Encourage patients to refer friends and family.',
    itemCount: (defaultTemplatesByGroup.referral_automation || []).length,
    image: null,
  },
  {
    key: 'social_review_campaigns',
    title: 'Social Review Campaigns',
    description: 'Google and Facebook review outreach.',
    itemCount: (defaultTemplatesByGroup.social_review_campaigns || []).length,
    image: null,
  },
]

export const legacyAutomationGroupKeys = [
  'appointment_reminder',
  'dentist_recall',
  'google_review',
  'patient_cancellation',
]
